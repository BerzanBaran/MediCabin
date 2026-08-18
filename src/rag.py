"""Retrieval-augmented answering over the ingested drug leaflet index."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from itertools import combinations

from . import config, embeddings, foundry_client, matching


@dataclass
class IndexState:
    chunks: list[dict]
    chunk_vectors: list
    embedder: embeddings.Embedder
    drug_registry: dict[str, str]
    drugs: list[dict]


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
    drugs: list[dict] = data.get("drugs", [{"drug_name": n, "active_ingredient": None} for n in drug_names])

    return IndexState(
        chunks=chunks,
        chunk_vectors=chunk_vectors,
        embedder=embedder,
        drug_registry=drug_registry,
        drugs=drugs,
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


def _core_ingredient(ingredient: str) -> str:
    """Drop salt-form qualifiers (sodyum, kalsiyum, tartarata, ...) — leaflet
    caution sections almost always refer to the bare molecule name, not the
    specific salt form used in the composition line."""
    return matching.normalize_tr(ingredient).split(" ")[0]


def _mentions_ingredient(state: IndexState, drug_name: str, ingredient: str) -> bool:
    pattern = rf"\b{re.escape(_core_ingredient(ingredient))}\b"
    for chunk in state.chunks:
        if chunk["drug_name"] != drug_name or not _is_interaction_section(chunk["section_title"]):
            continue
        if re.search(pattern, matching.normalize_tr(chunk["text"])):
            return True
    return False


def safety_scan(state: IndexState) -> dict:
    """Deterministic, no-LLM pairwise safety scan across the whole cabinet:
    for each pair of drugs, check whether either leaflet's caution section
    mentions the other drug's active ingredient (leaflets reference generic
    ingredient names, not brand names, so matching must go through
    `active_ingredient` rather than `drug_name`). Also groups drugs that
    share the same active ingredient (duplicate therapy risk)."""
    drugs = [d for d in state.drugs if d.get("active_ingredient")]

    interacting_pairs: list[dict] = []
    for a, b in combinations(drugs, 2):
        if _mentions_ingredient(state, a["drug_name"], b["active_ingredient"]) or _mentions_ingredient(
            state, b["drug_name"], a["active_ingredient"]
        ):
            interacting_pairs.append({"drug_a": a["drug_name"], "drug_b": b["drug_name"]})

    groups: dict[str, list[str]] = {}
    for d in drugs:
        groups.setdefault(_core_ingredient(d["active_ingredient"]), []).append(d["drug_name"])
    duplicate_groups = [
        {
            "active_ingredient": next(
                d["active_ingredient"] for d in drugs if _core_ingredient(d["active_ingredient"]) == key
            ),
            "drugs": names,
        }
        for key, names in groups.items()
        if len(names) > 1
    ]

    interaction_count = len(interacting_pairs)
    if interaction_count == 0:
        risk_level = "low"
    elif interaction_count <= 2:
        risk_level = "medium"
    else:
        risk_level = "high"

    return {
        "total_drugs": len(state.drugs),
        "interaction_count": interaction_count,
        "duplicate_count": len(duplicate_groups),
        "risk_level": risk_level,
        "interacting_pairs": interacting_pairs,
        "duplicate_groups": duplicate_groups,
    }


def _is_side_effects_section(section_title: str) -> bool:
    norm = matching.normalize_tr(section_title)
    return any(matching.normalize_tr(kw) in norm for kw in config.SIDE_EFFECTS_SECTION_KEYWORDS)


# Best-effort lay-phrase -> leaflet-term expansion. Turkish is agglutinative
# (bulanıyor / bulantı share a root but not a literal substring after
# normalization), so a handful of common lay symptom words are mapped to the
# term(s) leaflets actually use. Not exhaustive — literal word matches (below)
# already cover most cases since many symptom words match the leaflet term
# verbatim (kaşıntı, döküntü, çarpıntı, ...).
_SYMPTOM_SYNONYMS: dict[str, list[str]] = {
    "bulaniyor": ["bulanti"],
    "bulantim": ["bulanti"],
    "kusuyorum": ["kusma"],
    "donuyor": ["donmesi"],
    "basim": ["bas donmesi", "bas agrisi"],
    "agriyor": ["agrisi"],
    "kasiniyor": ["kasinti"],
    "uykum": ["uyku hali", "somnolans"],
    "yorgunum": ["halsizlik", "yorgunluk"],
    "halsizim": ["halsizlik"],
    "ishalim": ["ishal"],
    "kabizim": ["kabizlik"],
    "atesim": ["ates"],
    "terliyorum": ["terleme"],
}

_EMBEDDING_ONLY_THRESHOLD = 0.5


def _expand_symptom_terms(symptom: str) -> list[str]:
    words = [w for w in matching.normalize_tr(symptom).split() if len(w) > 2]
    terms = list(words)
    for w in words:
        terms.extend(_SYMPTOM_SYNONYMS.get(w, []))
    return terms


def symptom_check(state: IndexState, symptom: str, top_k: int = config.SYMPTOM_MATCH_TOP_K) -> dict:
    """Restricted to each leaflet's side-effects section. Literal term matches
    (the symptom's own words, plus a small synonym expansion for common lay
    phrasing) are the primary, trustworthy signal — "tamamen yerel çalışır"
    with no ambiguity about why a drug was flagged. Embedding similarity is
    used only as a secondary fallback, and only at a high-confidence
    threshold, for drugs with no literal match at all."""
    side_effect_chunks = [
        (c, v) for c, v in zip(state.chunks, state.chunk_vectors) if _is_side_effects_section(c["section_title"])
    ]
    if not side_effect_chunks:
        return {"symptom": symptom, "matches": [], "checked_drugs": sorted({c["drug_name"] for c in state.chunks})}

    terms = _expand_symptom_terms(symptom)
    query_vec = state.embedder.embed_query(symptom)

    best_literal: dict[str, tuple[dict, int]] = {}  # drug_name -> (chunk, term_hit_count)
    best_semantic: dict[str, tuple[dict, float]] = {}  # drug_name -> (chunk, score)

    for chunk, vec in side_effect_chunks:
        norm_text = matching.normalize_tr(chunk["text"])
        hit_count = sum(1 for term in terms if term in norm_text)
        drug = chunk["drug_name"]

        if hit_count > 0:
            prev = best_literal.get(drug)
            if prev is None or hit_count > prev[1]:
                best_literal[drug] = (chunk, hit_count)

        score = state.embedder.similarity(query_vec, vec)
        prev_sem = best_semantic.get(drug)
        if prev_sem is None or score > prev_sem[1]:
            best_semantic[drug] = (chunk, score)

    matches: list[dict] = []
    for drug, (chunk, hit_count) in best_literal.items():
        matches.append(
            {
                "drug_name": drug,
                "section_title": chunk["section_title"],
                "page_number": chunk["page_number"],
                "snippet": (chunk["text"][:280] + "…") if len(chunk["text"]) > 280 else chunk["text"],
                "direct_match": True,
                "score": hit_count,
            }
        )
    matches.sort(key=lambda m: m["score"], reverse=True)

    for drug, (chunk, score) in best_semantic.items():
        if drug in best_literal or score < _EMBEDDING_ONLY_THRESHOLD:
            continue
        matches.append(
            {
                "drug_name": drug,
                "section_title": chunk["section_title"],
                "page_number": chunk["page_number"],
                "snippet": (chunk["text"][:280] + "…") if len(chunk["text"]) > 280 else chunk["text"],
                "direct_match": False,
                "score": round(score, 3),
            }
        )

    return {
        "symptom": symptom,
        "matches": matches[:top_k],
        "checked_drugs": sorted({c["drug_name"] for c in state.chunks}),
    }


def analysis_summary(stats: dict) -> str:
    """Turkish natural-language summary of the user's local usage/notes
    statistics (Analiz page). Deliberately bypasses the leaflet-grounded RAG
    prompt used by `answer()` — this isn't a leaflet Q&A, it's commentary on
    the user's own locally-logged numbers.

    qwen2.5-1.5b tends to loop/repeat itself on open-ended commentary tasks
    without concrete grounding, so the prompt does the arithmetic itself
    (adherence %) and gives a single worked example — small local models
    follow a concrete pattern far more reliably than an abstract instruction.
    """
    total_doses = stats["taken_count"] + stats["skipped_count"] + stats["delayed_count"] + stats["problem_count"]
    adherence_pct = round(100 * stats["taken_count"] / total_doses) if total_doses else None

    system = (
        "Sen bir ilaç kullanım analisti asistanısın. Kullanıcının kendi "
        "cihazında tuttuğu istatistikleri TÜRKÇE, tam olarak 2-3 cümleyle "
        "yorumla. Sadece sana verilen sayılardan bahset, sayı uydurma, "
        "kendini tekrar etme. Kesin tıbbi yorum veya tanı koyma; bu sadece "
        "kullanım alışkanlığı üzerine bir gözlem.\n\n"
        "Örnek:\n"
        "Girdi: uyum oranı %75, alınan 6, atlanan 2, kayıtlı yan etki 1\n"
        "Çıktı: Dozlarınızın yaklaşık %75'ini zamanında aldınız, bu iyi bir "
        "uyum oranı ancak 2 doz atlanmış. Kayıtlı 1 yan etki bulunuyor. "
        "Atlanan dozları azaltmak için hatırlatıcı kurmayı düşünebilirsiniz."
    )
    user = (
        f"Uyum oranı: {f'%{adherence_pct}' if adherence_pct is not None else 'veri yok'}\n"
        f"Alınan doz: {stats['taken_count']}, Atlanan: {stats['skipped_count']}, "
        f"Geciken: {stats['delayed_count']}, Sorunlu: {stats['problem_count']}\n"
        f"İlaç planındaki ilaç sayısı: {stats['total_drugs']}\n"
        f"Kayıtlı yan etki sayısı: {stats['side_effect_count']}\n"
        f"Kullanım notu sayısı: {stats['usage_note_count']}, Yorum sayısı: {stats['comment_count']}\n"
        f"Ortalama ciddiyet (1-5): {stats['avg_severity']}, Ortalama memnuniyet (1-5): {stats['avg_rating']}\n"
    )
    return foundry_client.chat_complete(system, user, max_tokens=200, frequency_penalty=0.6)
