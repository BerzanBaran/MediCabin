"""Retrieval-augmented answering over the ingested drug leaflet index."""

from __future__ import annotations

import json
from dataclasses import dataclass

from . import config, embeddings, foundry_client, matching


@dataclass
class IndexState:
    chunks: list[dict]
    chunk_vectors: list
    embedder: embeddings.Embedder
    drug_registry: dict[str, str]


def load_index() -> IndexState:
    if not config.INDEX_PATH.exists():
        raise FileNotFoundError(
            f"{config.INDEX_PATH} bulunamadı. Önce `python -m src.ingest` çalıştırın."
        )

    data = json.loads(config.INDEX_PATH.read_text(encoding="utf-8"))
    chunks: list[dict] = data["chunks"]
    backend_name: str = data["embedding_backend"]

    if backend_name == embeddings.TFIDF_BACKEND_NAME:
        embedder: embeddings.Embedder = embeddings.TfidfEmbedder(
            corpus_texts=[c["text"] for c in chunks]
        )
        chunk_vectors = [embedder.embed_query(c["text"]) for c in chunks]
    else:
        embedder = embeddings.FoundryEmbedder()
        chunk_vectors = [c["embedding"] for c in chunks]

    drug_names = sorted({c["drug_name"] for c in chunks})
    drug_registry = matching.build_drug_registry(drug_names)

    return IndexState(
        chunks=chunks, chunk_vectors=chunk_vectors, embedder=embedder, drug_registry=drug_registry
    )


def _is_interaction_section(section_title: str) -> bool:
    norm = matching.normalize_tr(section_title)
    return any(matching.normalize_tr(kw) in norm for kw in config.INTERACTION_SECTION_KEYWORDS)


MAX_BOOSTED_CHUNKS_PER_DRUG = 2


def retrieve(state: IndexState, question: str, matched_drugs: list[str], top_k: int) -> list[dict]:
    query_vec = state.embedder.embed_query(question)
    scored = sorted(
        zip(state.chunks, state.chunk_vectors),
        key=lambda cv: state.embedder.similarity(query_vec, cv[1]),
        reverse=True,
    )

    result: list[dict] = []
    seen_ids: set[str] = set()

    if len(matched_drugs) >= 2:
        for drug in matched_drugs:
            drug_interaction_chunks = [
                chunk
                for chunk, _vec in scored
                if chunk["drug_name"] == drug and _is_interaction_section(chunk["section_title"])
            ]
            for chunk in drug_interaction_chunks[:MAX_BOOSTED_CHUNKS_PER_DRUG]:
                if chunk["id"] not in seen_ids:
                    result.append(chunk)
                    seen_ids.add(chunk["id"])

    for chunk, _vec in scored:
        if len(result) >= max(top_k, len(seen_ids)):
            break
        if chunk["id"] in seen_ids:
            continue
        result.append(chunk)
        seen_ids.add(chunk["id"])

    return result


def build_prompt(question: str, chunks: list[dict], interaction_warning: bool = False) -> tuple[str, str]:
    base = (
        "Sen bir kişisel ilaç dolabı asistanısın. Her zaman TÜRKÇE, kısa ve net cevap "
        "ver (1-3 cümle yeterli); tek kelimelik 'Evet'/'Hayır' cevabı verme, kısaca "
        "nedenini de ekle. Sadece aşağıda sağlanan alıntılara dayanarak cevap ver. "
        "Alıntılarda yer almayan bir bilgi sorulursa bunu açıkça belirt, uydurma bilgi "
        "verme, tekrar etme. Cevabında hangi ilaca/ilaçlara ait bilgi kullandığını "
        "belirt."
    )
    if interaction_warning:
        base += (
            " Bu soru birden fazla ilacın birlikte kullanımıyla ilgili. Bu, senin "
            "karar verebileceğin bir şey DEĞİL: kesinlikle 'evet kullanabilirsiniz' "
            "veya 'hayır kullanamazsınız' gibi bir yargıya VARMA. Bunun yerine SADECE "
            "alıntılarda bu ilaçlarla ilgili geçen uyarı/dikkat notunu olduğu gibi "
            "özetle ve mutlaka bir eczacı veya doktora danışılması gerektiğini belirt. "
            "Alıntılarda ilgili ilaç için doğrudan bir uyarı yoksa bunu açıkça söyle, "
            "başka bir ilaca ait alakasız bir uyarıyı bu soruya uydurmaya çalışma."
        )
    context = "\n\n".join(f"[{c['drug_name']} - {c['section_title']}]\n{c['text']}" for c in chunks)
    user = f"Alıntılar:\n{context}\n\nSoru: {question}"
    return base, user


def answer(state: IndexState, question: str, top_k: int = config.TOP_K) -> dict:
    matched_drugs = matching.detect_drugs(question, state.drug_registry)
    interaction_warning = len(matched_drugs) >= 2
    chunks = retrieve(state, question, matched_drugs, top_k)
    system, user = build_prompt(question, chunks, interaction_warning=interaction_warning)
    answer_text = foundry_client.chat_complete(system, user)

    sources = [
        {
            "drug_name": c["drug_name"],
            "source_file": c["source_file"],
            "section_title": c["section_title"],
            "page_number": c["page_number"],
            "snippet": (c["text"][:220] + "…") if len(c["text"]) > 220 else c["text"],
        }
        for c in chunks
    ]

    return {
        "answer": answer_text,
        "sources": sources,
        "interaction_warning": interaction_warning,
        "matched_drugs": matched_drugs,
        "disclaimer": config.DISCLAIMER,
    }
