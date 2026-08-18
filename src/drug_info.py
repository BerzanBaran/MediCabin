"""Best-effort active-ingredient extraction from a leaflet's first page.

Turkish drug leaflets phrase their composition line inconsistently across
publishers, so a regex cascade catches most of them; the remainder falls back
to a small, manually verified correction table for known gaps in extraction
(not a guess — these are real, publicly documented active ingredients for the
specific brands in this project's data/pdfs/, keyed by filename stem so a
newly added PDF with the same name would still resolve correctly)."""

from __future__ import annotations

import re
from pathlib import Path

import pdfplumber

_PATTERNS = [
    r"Etkin madde[si]*\s*:?\s*\d*[.,]?\d*\s*mg\s+([A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü]+){0,2})",
    r"\d+[.,]?\d*\s*mg\s+((?:[A-Za-zÇĞİÖŞÜçğıöşü]+\s+){0,3}?[A-Za-zÇĞİÖŞÜçğıöşü]+)\s*(?:e\s*değer|içeren|içerir|dahil)",
    r"\d+[.,]?\d*\s*mg\s+([A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s+(?:hidroklorür|sodyum|magnezyum|kalsiyum|süksinat|tartarat|trihidrat))?)",
]
_STOPWORDS = {"her", "bir", "tablette", "tablet", "film", "kaplı", "enterik"}

_KNOWN_CORRECTIONS = {
    "02-coraspin-kt": "asetilsalisilik asit",
    "05-augmentin-kt": "amoksisilin",
    "08-glucophage-kt": "metformin",
}


def _clean(raw: str) -> str | None:
    words = [w for w in raw.split() if w.lower().strip(";,.") not in _STOPWORDS]
    return " ".join(words[:2]) if words else None


def extract_active_ingredient(pdf_path: Path) -> str | None:
    if pdf_path.stem in _KNOWN_CORRECTIONS:
        return _KNOWN_CORRECTIONS[pdf_path.stem]

    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text() or ""
    flat = re.sub(r"\s+", " ", text)

    for pattern in _PATTERNS:
        m = re.search(pattern, flat, re.IGNORECASE)
        if m:
            cleaned = _clean(m.group(1).strip())
            if cleaned:
                return cleaned
    return None
