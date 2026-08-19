# MediCabin — Çalıştırma Rehberi

## Gereksinimler (bir kere kurulur)

- Python 3.13, Node.js/npm
- [Foundry Local](https://learn.microsoft.com/azure/ai-foundry/foundry-local/) CLI (`foundry`) kurulu ve çalışır durumda
- Tesseract OCR (Türkçe dil paketiyle) — taranmış/görüntü PDF'ler için gerekir
- `pip install -r requirements.txt`
- `cd web && npm install`

## Yeni ilaç eklemek

PDF prospektüsünü `data/pdfs/` klasörüne kopyalayın, sonra:

```bash
python -m src.ingest
```

Bu komut tüm PDF'leri yeniden işler ve `data/index.json`'ı günceller.

## Uygulamayı çalıştırma

**Terminal 1 — backend:**

```bash
uvicorn src.api:app --port 8000
```

**Terminal 2 — web arayüzü:**

```bash
cd web
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## Notlar

- İlk çalıştırmada Foundry Local'in kullandığı modeller (`qwen2.5-1.5b` sohbet,
  `qwen3-embedding-0.6b` embedding, toplam ~1.8 GB) internetten indirilir. Bu
  indirmeden sonra tüm sorgu/cevap işlemleri tamamen yerelde çalışır, internete
  çıkmaz.
- Foundry Local daemon'ı arka planda otomatik başlar/kullanılır
  (`foundry server status` ile kontrol edilebilir).
- `data/index.json` içinde `embedding_backend` alanı `foundry:...` değilse (yani
  `tfidf-fallback` ise), Foundry Local embedding modeline erişilemedi demektir —
  yanıt kalitesi düşebilir ama sistem yine de çalışmaya devam eder.
