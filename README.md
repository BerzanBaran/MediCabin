# 💊 MediCabin

**Kişisel ilaç dolabınız için tamamen yerel, gizlilik odaklı bir yapay zeka asistanı.**

Prospektüslerinizi okur, sorularınızı kaynak göstererek yanıtlar, ilaç etkileşimlerini kontrol eder — ve bunların hiçbiri için internete çıkmaz. Yapay zeka modelleri [Foundry Local](https://learn.microsoft.com/azure/ai-foundry/foundry-local/) ile doğrudan kendi bilgisayarınızda çalışır.

<!-- Buraya ana sayfa ekran görüntüsünü ekleyin -->
![Ana Sayfa](docs/screenshots/ana-sayfa.png)

---

## ✨ Özellikler

| Özellik | Açıklama |
|---|---|
| 💬 **Soru-Cevap** | İlaçlarınız hakkında yazılı sorular sorun; yanıtlar yalnızca kendi prospektüs verilerinizden, kaynak gösterilerek üretilir (RAG) |
| ⚠️ **Etkileşim Kontrolü** | İki ilacı birlikte sorduğunuzda, sistem etkin madde bazında gerçek etkileşim taraması yapar ve kırmızı bir uyarı gösterir |
| 🩺 **Belirti Kontrolü** | Yazılı veya sesli olarak (yerel Whisper ile) bir belirti girin, hangi ilacınızın yan etkisi olabileceğini görün |
| 📷 **Fotoğrafla Analiz Et** | İlaç kutusunun fotoğrafını çekin veya yükleyin, Gemini Vision ile analiz edilip dolabınızdaki ilaçlarla eşleştirilsin |
| 🗓️ **Takvim** | Günlük doz saatlerinizi takip edin, aldığınız/alacağınız ilaçları işaretleyin |
| 📝 **Notlar & Yorumlar** | İlaç kullanım durumunuzu günlük olarak işaretleyin, memnuniyet/ciddiyet puanlı yorumlar ekleyin |
| 📊 **Analiz** | Kullanım verilerinizden otomatik grafikler ve yerel yapay zeka tarafından üretilen özet yorumlar |
| 👤 **Profilim** | Hastalık, alerji ve kişisel bilgilerinizi kaydedin |
| 🌐 **TR / EN** | Arayüzün tamamı Türkçe ve İngilizce olarak kullanılabilir |
| 🔒 **Giriş / Kayıt** | Tamamen yerel, demo amaçlı hesap sistemi — hiçbir bilgi sunucuya gönderilmez |

<!-- Buraya birkaç özellik ekran görüntüsü ekleyin -->
<p>
  <img src="docs/screenshots/soru-cevap.png" width="32%" alt="Soru-Cevap" />
  <img src="docs/screenshots/etkilesim.png" width="32%" alt="Etkileşim Uyarısı" />
  <img src="docs/screenshots/analiz.png" width="32%" alt="Analiz" />
</p>

---

## 🔐 Neden Tamamen Yerel?

İlaçlarınız ve sağlık bilgileriniz hassas verilerdir. Bu proje, bulut tabanlı bir yapay zeka servisine hiçbir soru veya belge göndermeden çalışacak şekilde tasarlandı:

- **Sohbet, embedding arama ve sesli girdi** → [Foundry Local](https://learn.microsoft.com/azure/ai-foundry/foundry-local/) ile cihazınızda çalışan modeller (Qwen2.5, Qwen3-Embedding, Whisper)
- **Fotoğrafla Analiz Et** → tek istisna; bu özellik görüntüyü analiz için Gemini API'ye gönderir (isteğe bağlı bir özelliktir)

İlk kurulumda modellerin indirilmesi için internet gerekir; bundan sonra sorgu/cevap akışı tamamen yerelde çalışır.

---

## 🛠️ Kullanılan Teknolojiler

**Backend:** Python, FastAPI, Foundry Local SDK, pdfplumber + Tesseract OCR (PDF/prospektüs okuma), Gemini API (fotoğraf analizi)

**Frontend:** React 19, TypeScript, Vite

---

## 🚀 Kurulum ve Çalıştırma

Detaylı kurulum adımları için **[RUN.md](RUN.md)** dosyasına bakın. Özetle:

```bash
# Backend bağımlılıklarını kurun
pip install -r requirements.txt

# Frontend bağımlılıklarını kurun
cd web && npm install
```

**Terminal 1 — backend:**
```bash
uvicorn src.api:app --port 8000
```

**Terminal 2 — web arayüzü:**
```bash
cd web && npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

> Fotoğrafla Analiz Et özelliğini kullanmak isterseniz, proje kök dizininde bir `.env` dosyası oluşturup `GEMINI_API_KEY=...` şeklinde kendi Gemini API anahtarınızı ekleyin (bkz. `.env.example`). Bu dosya `.gitignore`'dadır, asla depoya gönderilmez.

Yeni bir ilaç eklemek için PDF'i `data/pdfs/` klasörüne kopyalayıp şunu çalıştırın:

```bash
python -m src.ingest
```

---

## 📁 Proje Yapısı

```
├── src/                # FastAPI backend
│   ├── api.py           # API uç noktaları
│   ├── rag.py           # RAG sorgu/cevap, etkileşim & belirti taraması
│   ├── ingest.py         # PDF → parça → embedding işleme hattı
│   ├── foundry_client.py # Yerel model istemcisi (sohbet, embedding, ses)
│   └── gemini_client.py  # Fotoğraf analizi (Gemini)
├── data/pdfs/           # İlaç prospektüsleri
├── web/                 # React + Vite frontend
│   └── src/screens/      # Uygulama ekranları
└── RUN.md               # Detaylı çalıştırma rehberi
```

---

## ⚠️ Önemli Not

Bu proje **eğitim ve gösterim amaçlıdır**, tıbbi tavsiye yerine geçmez. İlaç kullanımı, dozaj ve etkileşimlerle ilgili kararlar için mutlaka bir doktora veya eczacıya danışın. Uygulama içindeki kişi profilleri ve yorumlar kurgusaldır, örnek veri amaçlıdır.

---

<p align="center">
  <sub>Yerel yapay zeka ile geliştirildi — verileriniz cihazınızdan çıkmaz.</sub>
</p>
