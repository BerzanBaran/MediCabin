from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
PDFS_DIR = DATA_DIR / "pdfs"
INDEX_PATH = DATA_DIR / "index.json"

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100
MIN_SECTION_RUN_COVERAGE = 0.3  # header-based run must cover >=30% of doc text, else fall back to sliding window
MIN_OCR_TEXT_LEN = 20  # per-page threshold below which pdfplumber text is treated as "no text layer"

TOP_K = 5

FOUNDRY_CHAT_MODEL_ALIAS = "qwen2.5-1.5b"
FOUNDRY_EMBEDDING_MODEL_ALIAS = "qwen3-embedding-0.6b"
FOUNDRY_STARTUP_TIMEOUT_S = 30

CORS_ORIGINS = ["http://localhost:5173"]

DISCLAIMER = (
    "Bu asistan tıbbi tavsiye yerine geçmez; ilaç etkileşimleri ve dozaj için "
    "mutlaka eczacınıza veya doktorunuza danışın."
)

# Keywords (normalized, diacritics stripped) used to identify interaction/caution
# sections within a leaflet's chunks, for retrieval boosting.
INTERACTION_SECTION_KEYWORDS = ["dikkat", "kullanmadan once", "birlikte", "etkilesim"]
