# İlaç Dolabı Asistanı — Web Arayüzü Planı (React)

> **Not (varsayım):** "Veri setlerinin pdflerini ben yükleyeceğim" ifadesini,
> web arayüzünde **gerçek bir yükleme (upload) özelliği** istediğiniz şeklinde
> yorumladım — yani PDF'leri sürükle-bırak/dosya seçici ile tarayıcıdan
> yükleyeceksiniz, ben `data/pdfs/` klasörüne elle kopyalamanıza gerek
> kalmayacak. Bu, zaten planlanmış ama henüz yapılmamış olan **"Task 15 —
> Kişisel ilaç dolabı yönetimi"** ile birebir örtüşüyor, o yüzden bu iki işi
> birleştiriyorum. Eğer aslında sadece "PDF'leri ben (siz) `data/pdfs/`
> klasörüne koyacağım, sen kod tarafını hallet" demek istediyseniz, aşağıdaki
> plandaki **Bölüm 3 (Yükleme Özelliği)** kısmını atlayıp sadece Bölüm 2, 4,
> 5, 6'yı uygulamamı söylemeniz yeterli — geri kalan her şey aynı kalır.

---

## 1. Neden Web'e Geçiyoruz

Mobil uygulama (Expo/React Native) teknik olarak tamamlandı ve çalışıyor,
ancak Windows'ta Wi-Fi/tunnel/ngrok kaynaklı ağ sorunları video çekimini
riske atıyordu. Web arayüzü bu sorunu ortadan kaldırıyor:

- Telefon + PC aynı Wi-Fi'da olma zorunluluğu yok (tarayıcı doğrudan
  `localhost`'a bağlanır).
- QR kod okutma, Expo Go kurulumu, tunnel/ngrok derdi yok.
- Video çekimi için ekran kaydı çok daha basit: tek bir tarayıcı penceresi.
- Backend (`src/api.py`, Foundry Local, RAG mantığı) **hiç değişmiyor** —
  zaten bir REST API olduğu için hem mobil hem web istemciyle uyumlu.
  Yani şu ana kadarki tüm iş (Task 1-17) korunuyor, sadece istemci
  (mobile/ klasörü) yerine yeni bir web/ klasörü ekliyoruz.

`mobile/` klasörünü silmiyoruz — isterseniz ileride geri dönebilirsiniz,
ama artık video için web arayüzünü kullanacağız.

---

## 2. Mimari (Güncellenmiş)

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   Tarayıcı (React web app)  │  HTTP   │   PC'nizde çalışan backend    │
│   web/  (Vite + React + TS) │ ───────▶│   src/api.py (FastAPI)        │
│   http://localhost:5173     │ ◀───────│   http://localhost:8000       │
└─────────────────────────────┘         │   Foundry Local (yerel LLM)   │
                                         │   data/pdfs/, data/index.json │
                                         └──────────────────────────────┘
```

- Web app da backend de **aynı PC'de** çalışır → `localhost` üzerinden
  konuşurlar, ağ/firewall/Wi-Fi derdi yok.
- Video çekerken tek terminal grubu: (1) backend, (2) web dev server —
  ikisi de aynı makinede, iki terminal penceresi yeterli.
- Gemini fotoğraf-tanıma özelliği web'de de opsiyonel olarak kalabilir
  (tarayıcıdan dosya seçip gönderme) — mobildeki kamera yerine "dosya seç"
  kullanılır. İsterseniz bu özelliği v1'de atlayıp sonraya bırakabiliriz.

---

## 3. Yeni Özellik: Tarayıcıdan PDF Yükleme

Şu an backend'de sadece `python -m src.ingest` (komut satırından, elle)
ile PDF'ler işleniyor. Web arayüzü için bunu bir UI akışına bağlıyoruz:

### Backend'e eklenecek yeni endpoint'ler (`src/api.py`)

| Endpoint | Açıklama |
|---|---|
| `POST /meds/upload` | Çoklu PDF dosyası kabul eder (`multipart/form-data`), `data/pdfs/` altına kaydeder |
| `POST /meds/reindex` | Yeni yüklenen PDF'leri parse edip chunk'layıp yeniden embed'ler, `data/index.json`'ı günceller, modelleri bellekte tazeler |
| `GET /meds/upload-status` | Reindex işlemi arka planda sürerken ilerlemeyi göstermek için (basit: "işleniyor" / "hazır") |
| `DELETE /meds/{source_file}` | Yanlış yüklenen bir ilacı dolaptan çıkarma (opsiyonel, v1'de atlanabilir) |

### Neden ayrı bir `/reindex` adımı var?

Embedding çıkarma (Foundry Local ile) birkaç saniye sürebilir, bu yüzden
yükleme (dosya kaydetme, anında biter) ile işleme (embedding, biraz
sürer) ayrılıyor. Web UI, yükleme bitince "İşleniyor..." göstergesi
gösterip `/reindex` tamamlanınca "9 ilaç hazır" gibi bir mesaja geçer.

### Web tarafı akışı

1. Kullanıcı "İlaç Dolabım" sekmesinde "PDF Yükle" butonuna basar veya
   dosyaları sürükleyip bırakır.
2. Seçilen PDF'ler `POST /meds/upload` ile gönderilir.
3. Yükleme bitince otomatik olarak `POST /meds/reindex` tetiklenir.
4. UI, "İşleniyor..." spinner'ı gösterir, bitince ilaç listesi otomatik
   yenilenir (mevcut `GET /meds` çağrısıyla).

Bu akış, video için de güzel bir "canlı demo" anı olur: siz PDF'i
sürükleyip bırakırsınız, sistem canlı olarak işler ve yeni ilaç listede
belirir — Foundry Local'in yerel/gerçek zamanlı çalıştığını görsel olarak
kanıtlar.

---

## 4. Web Klasör Yapısı (planlanan)

```
web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # sekme yönlendirme (mobile/App.tsx'in web karşılığı)
│   ├── lib/
│   │   ├── api.ts                # fetch tabanlı API istemcisi (mobile/lib/api.ts'in portu)
│   │   ├── storage.ts            # localStorage yerine basit in-memory/serverUrl sabiti
│   │   └── matching.ts           # normalize_tr() portu (mobile/lib/matching.ts'in kopyası)
│   ├── components/
│   │   ├── ChatBubble.tsx
│   │   ├── InteractionBanner.tsx
│   │   ├── MedCard.tsx
│   │   └── UploadDropzone.tsx    # YENİ — sürükle-bırak PDF yükleme
│   └── screens/
│       ├── ChatScreen.tsx
│       ├── MedsScreen.tsx        # + UploadDropzone entegre
│       └── SettingsScreen.tsx    # sunucu adresi genelde localhost:8000 sabit, göstermek yeterli
└── README.md
```

Not: `serverUrl` konsepti web'de basitleşiyor — aynı PC'de çalıştığı için
varsayılan `http://localhost:8000` çoğu zaman yeterli, yine de Ayarlar
sekmesinde değiştirilebilir bırakıyoruz (esneklik için).

---

## 5. Teknoloji Seçimleri

- **Vite + React + TypeScript** — Create React App yerine Vite (daha
  hızlı, daha az bağımlılık sorunu, güncel standart).
- **Sade CSS (veya Tailwind)** — büyük bir UI kütüphanesine gerek yok,
  proje küçük ve amaç net; sade, okunaklı bir arayüz yeterli.
- **fetch API** — ekstra HTTP kütüphanesi (axios vb.) gerekmiyor, native
  `fetch` yeterli.
- Mobil (`mobile/lib/`) içindeki iş mantığı (API sözleşmesi, normalize_tr
  portu) doğrudan web'e taşınacak — sıfırdan yazılmayacak, sadece
  React Native bileşenleri yerine HTML/CSS kullanılacak.

---

## 6. Uygulama Adımları (Task Listesi)

| Task | Açıklama |
|---|---|
| **21** | Backend'e `/meds/upload`, `/meds/reindex`, `/meds/upload-status` endpoint'lerini ekle + testler |
| **22** | `web/` klasörünü Vite ile scaffold et (`npm create vite@latest web -- --template react-ts`) |
| **23** | `lib/api.ts`, `lib/matching.ts` portlarını yaz (mobilden adapte) |
| **24** | `ChatScreen`, `MedsScreen`, `SettingsScreen` bileşenlerini yaz |
| **25** | `UploadDropzone` bileşenini yaz, `MedsScreen`'e entegre et, uçtan uca test et |
| **26** | Video çekimi için basitleştirilmiş `RUN-WEB.md` kurulum rehberi yaz (mobil kadar karmaşık değil — Wi-Fi/QR/tunnel adımları yok) |
| **27** | (Opsiyonel) Gemini fotoğraf-tanıma özelliğini web'e taşı ("dosya seç" ile) |

Bu sırayla ilerleyeceğiz — her task bitince test edip bir sonrakine
geçeceğiz, tıpkı backend'de yaptığımız gibi.

---

## 7. Video Akışı İçin Beklenen Son Hal

1. Terminal 1: `uvicorn src.api:app --host 0.0.0.0 --port 8000` (backend)
2. Terminal 2: `cd web && npm run dev` (web arayüzü, `http://localhost:5173`)
3. Tarayıcıda `localhost:5173` açılır.
4. **İlaç Dolabım** sekmesinde PDF sürükle-bırak ile bir ilaç eklenir,
   canlı olarak işlenip listeye eklenir (Foundry Local'in yerelliğini
   gösteren güçlü bir demo anı).
5. **Sohbet** sekmesinde örnek etkileşim sorusu sorulur (örn. "Coumadin
   ile Nurofen'i birlikte alabilir miyim?") → kırmızı uyarı banner'ı,
   kaynaklar, gizlilik notu gösterilir.
6. Tüm bunlar internete hiç çıkmadan, tamamen yerelde çalışır — bu
   projenin ana tezi.

---

## 8. Onay Bekleyen Noktalar

Devam etmeden önce kısaca teyit edelim:

1. Yukarıdaki varsayım doğru mu — gerçek bir "PDF yükle" özelliği mi
   istiyorsunuz, yoksa PDF'leri siz elle `data/pdfs/`'e koyup bana sadece
   web arayüzünü mü yaptırmak istiyorsunuz?
2. Gemini fotoğraf-tanıma özelliğini web'de de ister misiniz (Task 27),
   yoksa v1'de atlayıp sadece sohbet + ilaç dolabı ile mi devam edelim?
3. Tailwind gibi bir CSS kütüphanesi kullanmamı ister misiniz, yoksa sade
   el yazımı CSS yeterli mi?

Onay verince Task 21'den başlayıp adım adım ilerleyelim.
