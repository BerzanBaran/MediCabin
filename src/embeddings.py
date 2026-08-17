"""Embedding backends: Foundry Local (primary) with a pure-Python TF-IDF fallback."""

from __future__ import annotations

import math
from collections import Counter
from typing import Protocol

from . import config, foundry_client
from .matching import normalize_tr

FOUNDRY_BACKEND_NAME = f"foundry:{config.FOUNDRY_EMBEDDING_MODEL_ALIAS}"
TFIDF_BACKEND_NAME = "tfidf-fallback"


class Embedder(Protocol):
    backend_name: str

    def embed_texts(self, texts: list[str]) -> list[list[float] | None]: ...

    def embed_query(self, text: str) -> list[float] | dict[str, float]: ...

    def similarity(self, query_vec, chunk_vec) -> float: ...


def _tokenize(text: str) -> list[str]:
    return [t for t in normalize_tr(text).split() if len(t) > 1]


class FoundryEmbedder:
    backend_name = FOUNDRY_BACKEND_NAME

    def __init__(self):
        foundry_client.ensure_model_loaded(config.FOUNDRY_EMBEDDING_MODEL_ALIAS)
        # Fail fast if the model can't actually serve an embedding request.
        foundry_client.embed_texts(["ping"])

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return foundry_client.embed_texts(texts)

    def embed_query(self, text: str) -> list[float]:
        return foundry_client.embed_texts([text])[0]

    def similarity(self, query_vec: list[float], chunk_vec: list[float]) -> float:
        dot = sum(a * b for a, b in zip(query_vec, chunk_vec))
        norm_q = math.sqrt(sum(a * a for a in query_vec))
        norm_c = math.sqrt(sum(b * b for b in chunk_vec))
        if norm_q == 0 or norm_c == 0:
            return 0.0
        return dot / (norm_q * norm_c)


class TfidfEmbedder:
    """Zero-dependency sparse TF-IDF cosine similarity, fit once over the corpus.

    Appropriate given the corpus is ~9 documents / a few hundred chunks — no
    need for numpy/sklearn, and it works fully offline with no model download.
    """

    backend_name = TFIDF_BACKEND_NAME

    def __init__(self, corpus_texts: list[str] | None = None):
        self._idf: dict[str, float] = {}
        if corpus_texts:
            self.fit(corpus_texts)

    def fit(self, corpus_texts: list[str]) -> None:
        doc_freq: Counter[str] = Counter()
        for text in corpus_texts:
            for term in set(_tokenize(text)):
                doc_freq[term] += 1
        n = len(corpus_texts)
        self._idf = {term: math.log(n / (1 + df)) + 1.0 for term, df in doc_freq.items()}

    def _vectorize(self, text: str) -> dict[str, float]:
        tf = Counter(_tokenize(text))
        return {term: count * self._idf.get(term, 0.0) for term, count in tf.items()}

    def embed_texts(self, texts: list[str]) -> list[None]:
        # TF-IDF vectors are recomputed cheaply at query time from raw text
        # (persisted as `text` in index.json), so nothing is stored per-chunk.
        return [None for _ in texts]

    def embed_query(self, text: str) -> dict[str, float]:
        return self._vectorize(text)

    def similarity(self, query_vec: dict[str, float], chunk_vec: dict[str, float]) -> float:
        common = set(query_vec) & set(chunk_vec)
        dot = sum(query_vec[t] * chunk_vec[t] for t in common)
        norm_q = math.sqrt(sum(v * v for v in query_vec.values()))
        norm_c = math.sqrt(sum(v * v for v in chunk_vec.values()))
        if norm_q == 0 or norm_c == 0:
            return 0.0
        return dot / (norm_q * norm_c)


def get_embedder() -> Embedder:
    try:
        return FoundryEmbedder()
    except Exception as exc:  # noqa: BLE001 - deliberate broad fallback boundary
        print(f"[embeddings] Foundry Local embedder unavailable ({exc}); falling back to TF-IDF.")
        return TfidfEmbedder()
