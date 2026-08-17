"""PDF -> per-page text extraction, with an OCR fallback for scanned pages."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pdfplumber

from . import config


@dataclass
class PageText:
    page_number: int  # 1-indexed
    text: str
    used_ocr: bool


_TESSERACT_FALLBACK_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]


def _ocr_page(page: "pdfplumber.page.Page") -> str:
    import shutil

    import pytesseract

    if shutil.which("tesseract") is None:
        for candidate in _TESSERACT_FALLBACK_PATHS:
            if Path(candidate).exists():
                pytesseract.pytesseract.tesseract_cmd = candidate
                break

    image = page.to_image(resolution=300).original
    return pytesseract.image_to_string(image, lang="tur+eng")


def extract_pages(pdf_path: Path) -> list[PageText]:
    pages: list[PageText] = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            used_ocr = False
            if len(text.strip()) < config.MIN_OCR_TEXT_LEN:
                ocr_text = _ocr_page(page)
                if len(ocr_text.strip()) > len(text.strip()):
                    text = ocr_text
                    used_ocr = True
            pages.append(PageText(page_number=i, text=text, used_ocr=used_ocr))
    return pages
