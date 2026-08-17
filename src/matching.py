"""Turkish-aware text normalization and drug-name detection."""

from __future__ import annotations

import re

_DIACRITIC_MAP = str.maketrans(
    {
        "ç": "c",
        "ğ": "g",
        "ı": "i",
        "ö": "o",
        "ş": "s",
        "ü": "u",
    }
)


def normalize_tr(s: str) -> str:
    """Turkish-correct casefold + ASCII diacritic-strip, for robust fuzzy matching.

    Plain str.lower() mishandles Turkish dotted/dotless I ('İ' -> 'i' + combining
    dot, 'I' -> 'i' instead of 'ı'), which silently breaks substring matching on
    words like "NEXİUM". Map those explicitly before lowercasing.
    """
    s = s.replace("İ", "i").replace("I", "ı")
    s = s.lower()
    s = s.translate(_DIACRITIC_MAP)
    return s


def capitalize_tr(word: str) -> str:
    """Title-case a single word using Turkish-correct first-letter casing."""
    if not word:
        return word
    first = "İ" if word[0] in ("i", "İ") else word[0].upper()
    rest_normalized = normalize_tr(word[1:])
    return first + rest_normalized


def build_drug_registry(drug_names: list[str]) -> dict[str, str]:
    """Map normalize_tr(name) -> canonical display name, for exact-name lookup."""
    return {normalize_tr(name): name for name in drug_names}


def detect_drugs(question: str, registry: dict[str, str]) -> list[str]:
    """Return canonical drug names whose normalized form appears in the question
    as a whole word (word-boundary match, so "parol" doesn't match inside a
    longer unrelated token)."""
    norm_question = normalize_tr(question)
    matched: list[str] = []
    for norm_name, canonical in registry.items():
        if re.search(rf"\b{re.escape(norm_name)}\b", norm_question):
            matched.append(canonical)
    return matched
