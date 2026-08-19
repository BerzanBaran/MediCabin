"""Thin wrapper around the Gemini API for photo-based medicine analysis.

The API key lives only here on the backend (loaded from .env, never
committed — see config.GEMINI_API_KEY) and is never sent to the frontend.
Uses the plain REST endpoint directly rather than a Google SDK, since the
whole integration is a single call."""

from __future__ import annotations

import base64

import requests

from . import config

_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


class GeminiError(RuntimeError):
    pass


def _prompt(known_drugs: list[str]) -> str:
    drug_list = ", ".join(known_drugs) if known_drugs else "(bilinmiyor)"
    return (
        "Bu fotoğrafta bir ilaç kutusu, blisteri veya prospektüsü olabilir. "
        "Fotoğrafta gördüğün ilacı TÜRKÇE olarak tanımla: ilaç adı, varsa "
        "etkin madde ve dozaj bilgisi. Ardından, kullanıcının ilaç dolabındaki "
        f"şu ilaçlardan biriyle eşleşip eşleşmediğini belirt: {drug_list}. "
        "Eşleşme varsa tam olarak hangi isimle eşleştiğini net şekilde yaz. "
        "Fotoğrafta okunaklı bir ilaç göremiyorsan bunu açıkça söyle, "
        "uydurma bilgi verme. Cevabın 3-5 cümleyi geçmesin."
    )


def analyze_photo(image_bytes: bytes, mime_type: str, known_drugs: list[str]) -> str:
    if not config.GEMINI_API_KEY:
        raise GeminiError("GEMINI_API_KEY ayarlanmamış (.env dosyasını kontrol edin).")

    url = _ENDPOINT.format(model=config.GEMINI_MODEL)
    body = {
        "contents": [
            {
                "parts": [
                    {"text": _prompt(known_drugs)},
                    {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}},
                ]
            }
        ]
    }

    try:
        response = requests.post(
            url, params={"key": config.GEMINI_API_KEY}, json=body, timeout=30
        )
    except requests.RequestException as exc:
        raise GeminiError(f"Gemini API'ye ulaşılamadı: {exc}") from exc

    if response.status_code != 200:
        detail = response.json().get("error", {}).get("message", response.text) if response.content else response.text
        raise GeminiError(f"Gemini API hatası ({response.status_code}): {detail}")

    data = response.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise GeminiError("Gemini bir yanıt döndürmedi.")

    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise GeminiError("Gemini boş bir yanıt döndürdü.")
    return text
