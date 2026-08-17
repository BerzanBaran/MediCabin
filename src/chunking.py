"""Split a drug leaflet PDF into retrieval-sized chunks with section metadata."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from . import config
from .matching import capitalize_tr
from .pdf_text import extract_pages

_HEADER_RE = re.compile(r"(?m)^\s*(\d{1,2})\s*[\.\)]\s+([^\n]{3,100})")
_FILENAME_RE = re.compile(r"^\d+-([A-Za-zÇĞİÖŞÜçğıöşü]+)-kt", re.IGNORECASE)


@dataclass
class Chunk:
    id: str
    source_file: str
    drug_name: str
    section_title: str
    page_number: int
    text: str


@dataclass
class _Header:
    number: int
    title: str
    offset: int  # char offset of the start of the header line in full_text


def derive_drug_name(pdf_path: Path) -> str:
    m = _FILENAME_RE.match(pdf_path.stem)
    raw = m.group(1) if m else pdf_path.stem
    return capitalize_tr(raw)


def _build_full_text_with_page_offsets(pdf_path: Path) -> tuple[str, list[tuple[int, int]]]:
    """Returns (full_text, [(page_number, start_offset), ...]) sorted by offset."""
    pages = extract_pages(pdf_path)
    parts: list[str] = []
    offsets: list[tuple[int, int]] = []
    cursor = 0
    for p in pages:
        offsets.append((p.page_number, cursor))
        parts.append(p.text)
        cursor += len(p.text) + 1  # +1 for the '\n' joiner below
    full_text = "\n".join(parts)
    return full_text, offsets


def _page_for_offset(offset: int, page_offsets: list[tuple[int, int]]) -> int:
    page_number = page_offsets[0][0]
    for pn, start in page_offsets:
        if start <= offset:
            page_number = pn
        else:
            break
    return page_number


def _all_headers(full_text: str) -> list[_Header]:
    return [
        _Header(number=int(m.group(1)), title=m.group(2).strip(), offset=m.start())
        for m in _HEADER_RE.finditer(full_text)
    ]


def _find_best_run(headers: list[_Header]) -> list[_Header]:
    """Among all maximal ascending-from-1 runs of header numbers (in document
    order), pick the one that spans the most document text. A leaflet's real
    section headers are each followed by a full paragraph of body text, while
    a table-of-contents listing or a nested numbered sub-list has headers
    packed close together with little/no body text between them — so the
    largest character span reliably identifies the real sections without
    needing to hardcode section titles."""
    starts = [i for i, h in enumerate(headers) if h.number == 1]
    if not starts:
        return []

    best_run: list[_Header] = []
    best_span = -1
    for start_idx in starts:
        run = [headers[start_idx]]
        expected = 2
        search_from = start_idx + 1
        while True:
            next_idx = None
            for j in range(search_from, len(headers)):
                if headers[j].number == expected:
                    next_idx = j
                    break
                if headers[j].number == 1:
                    break  # a new run starts before we found `expected`; stop here
            if next_idx is None:
                break
            run.append(headers[next_idx])
            search_from = next_idx + 1
            expected += 1

        span = run[-1].offset - run[0].offset
        if span > best_span:
            best_span = span
            best_run = run

    return best_run


def _sentence_aware_windows(text: str, size: int, overlap: int) -> list[str]:
    if len(text) <= size:
        return [text] if text.strip() else []
    windows: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            boundary = text.rfind(". ", start, end)
            if boundary != -1 and boundary > start + size // 2:
                end = boundary + 1
        windows.append(text[start:end])
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return [w.strip() for w in windows if w.strip()]


def _sliding_window_chunks(
    full_text: str, page_offsets: list[tuple[int, int]], source_file: str, drug_name: str
) -> list[Chunk]:
    chunks: list[Chunk] = []
    windows = _sentence_aware_windows(full_text, config.CHUNK_SIZE, config.CHUNK_OVERLAP)
    cursor = 0
    for i, w in enumerate(windows):
        offset = full_text.find(w, cursor)
        if offset == -1:
            offset = cursor
        cursor = offset
        chunks.append(
            Chunk(
                id=f"{drug_name.lower()}_{i}",
                source_file=source_file,
                drug_name=drug_name,
                section_title="İçerik",
                page_number=_page_for_offset(offset, page_offsets),
                text=w,
            )
        )
    return chunks


def chunk_document(pdf_path: Path) -> list[Chunk]:
    drug_name = derive_drug_name(pdf_path)
    source_file = pdf_path.name
    full_text, page_offsets = _build_full_text_with_page_offsets(pdf_path)

    headers = _all_headers(full_text)
    best_run = _find_best_run(headers)

    covers_enough = False
    if len(best_run) >= 3 and full_text.strip():
        span = best_run[-1].offset - best_run[0].offset
        covers_enough = (span / max(len(full_text), 1)) >= config.MIN_SECTION_RUN_COVERAGE

    if not covers_enough:
        return _sliding_window_chunks(full_text, page_offsets, source_file, drug_name)

    chunks: list[Chunk] = []
    chunk_idx = 0
    for i, header in enumerate(best_run):
        body_start = header.offset + len(header.title) + len(str(header.number)) + 2
        body_end = best_run[i + 1].offset if i + 1 < len(best_run) else len(full_text)
        body = full_text[body_start:body_end].strip()
        if not body:
            continue

        page_number = _page_for_offset(header.offset, page_offsets)
        for window in _sentence_aware_windows(body, config.CHUNK_SIZE, config.CHUNK_OVERLAP):
            chunks.append(
                Chunk(
                    id=f"{drug_name.lower()}_{chunk_idx}",
                    source_file=source_file,
                    drug_name=drug_name,
                    section_title=header.title,
                    page_number=page_number,
                    text=window,
                )
            )
            chunk_idx += 1

    return chunks
