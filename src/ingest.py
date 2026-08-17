"""CLI entrypoint: parse every PDF in data/pdfs/, chunk it, embed it, and
write data/index.json. Run with `python -m src.ingest`."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from . import config
from .chunking import chunk_document
from .embeddings import get_embedder


def main() -> None:
    config.DATA_DIR.mkdir(exist_ok=True)
    config.PDFS_DIR.mkdir(exist_ok=True)

    pdf_paths = sorted(config.PDFS_DIR.glob("*.pdf"))
    if not pdf_paths:
        print(f"data/pdfs/ içinde PDF bulunamadı ({config.PDFS_DIR}).")
        return

    all_chunks = []
    for pdf_path in pdf_paths:
        chunks = chunk_document(pdf_path)
        mode = "bölüm-tabanlı" if chunks and chunks[0].section_title != "İçerik" else "kayan-pencere"
        print(f"  {pdf_path.name}: {len(chunks)} parça ({mode})")
        all_chunks.extend(chunks)

    print(f"Toplam {len(all_chunks)} parça, {len(pdf_paths)} ilaç.")

    embedder = get_embedder()
    print(f"Embedding backend: {embedder.backend_name}")

    texts = [c.text for c in all_chunks]
    vectors = embedder.embed_texts(texts)

    index = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "embedding_backend": embedder.backend_name,
        "chunks": [
            {
                "id": chunk.id,
                "source_file": chunk.source_file,
                "drug_name": chunk.drug_name,
                "section_title": chunk.section_title,
                "page_number": chunk.page_number,
                "text": chunk.text,
                "embedding": vector,
            }
            for chunk, vector in zip(all_chunks, vectors)
        ],
    }

    config.INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Yazıldı: {config.INDEX_PATH}")


if __name__ == "__main__":
    main()
