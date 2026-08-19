from __future__ import annotations

import io
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from . import config, foundry_client, gemini_client, matching, rag

_state: rag.IndexState | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _state
    _state = rag.load_index()
    yield


app = FastAPI(title="İlaç Dolabı Asistanı API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    top_k: int | None = None


class SymptomCheckRequest(BaseModel):
    symptom: str


class AnalysisSummaryRequest(BaseModel):
    total_drugs: int
    side_effect_count: int
    usage_note_count: int
    comment_count: int
    avg_severity: float
    avg_rating: float
    taken_count: int
    skipped_count: int
    delayed_count: int
    problem_count: int


class MedOut(BaseModel):
    drug_name: str
    source_file: str
    chunk_count: int


def _require_state() -> rag.IndexState:
    if _state is None:
        raise HTTPException(status_code=503, detail="Index henüz yüklenmedi.")
    return _state


@app.get("/health")
def health():
    return {"status": "ok", "index_loaded": _state is not None}


@app.get("/meds", response_model=list[MedOut])
def list_meds():
    state = _require_state()
    counts: dict[str, dict] = {}
    for chunk in state.chunks:
        key = chunk["drug_name"]
        if key not in counts:
            counts[key] = {"drug_name": key, "source_file": chunk["source_file"], "chunk_count": 0}
        counts[key]["chunk_count"] += 1
    return sorted(counts.values(), key=lambda m: m["drug_name"])


@app.post("/chat")
def chat(req: ChatRequest):
    state = _require_state()
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question boş olamaz.")
    top_k = req.top_k or config.TOP_K
    return rag.answer(state, req.question, top_k=top_k)


@app.get("/meds/safety-scan")
def safety_scan():
    state = _require_state()
    return rag.safety_scan(state)


@app.post("/symptom-check")
def symptom_check(req: SymptomCheckRequest):
    state = _require_state()
    if not req.symptom.strip():
        raise HTTPException(status_code=400, detail="symptom boş olamaz.")
    return rag.symptom_check(state, req.symptom)


@app.post("/analysis-summary")
def analysis_summary(req: AnalysisSummaryRequest):
    _require_state()
    return {"summary": rag.analysis_summary(req.model_dump())}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = Path(tmp.name)

    try:
        foundry_client.ensure_model_loaded(config.FOUNDRY_WHISPER_MODEL_ALIAS)
        text = foundry_client.transcribe_audio(tmp_path)
    except foundry_client.FoundryUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    finally:
        tmp_path.unlink(missing_ok=True)

    return {"text": text}


@app.post("/photo-analyze")
async def photo_analyze(photo: UploadFile = File(...)):
    state = _require_state()

    content_type = (photo.content_type or "").lower()
    if content_type not in config.GEMINI_ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Sadece resim dosyaları kabul edilir (JPEG, PNG, WEBP, HEIC).")

    data = await photo.read()
    if len(data) > config.GEMINI_MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Resim çok büyük (maksimum 8 MB).")

    # Verify the bytes are actually a decodable image, not just a file with a
    # spoofed image content-type — don't trust the client-supplied header alone.
    try:
        Image.open(io.BytesIO(data)).verify()
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Dosya geçerli bir resim değil.") from exc

    known_drugs = sorted({c["drug_name"] for c in state.chunks})

    try:
        result_text = gemini_client.analyze_photo(data, content_type, known_drugs)
    except gemini_client.GeminiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    registry = matching.build_drug_registry(known_drugs)
    matched_drugs = matching.detect_drugs(result_text, registry)

    return {"result": result_text, "matched_drugs": matched_drugs}
