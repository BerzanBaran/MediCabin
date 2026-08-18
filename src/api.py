from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import config, rag

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
