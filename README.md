# Crawling Beta Test

Aplikasi dashboard Node.js untuk melakukan crawling berita, jurnal, preview artikel, dan pemantauan isu daerah secara realtime.

## Fitur

- Crawling berita dari Bing News RSS dan Google News RSS.
- Pencarian jurnal dari OpenAlex.
- Filter tanggal dan tipe konten.
- Preview artikel di panel kanan.
- Halaman khusus **Isu Daerah** di `/isu-daerah`.
- Halaman khusus **Summarized AI** di `/summarized-ai`.
- Ringkasan AI dari kumpulan berita berdasarkan pertanyaan bebas.
- Output isu daerah dikelompokkan per daerah, misalnya `Riau`, `Kalimantan Timur`, `Papua`.
- Hasil isu daerah diurutkan dari berita terbaru.
- Filter untuk menghindari isu kesehatan yang konteksnya artis/selebriti/hiburan.
- Header shared melalui `src/header.js` dan `src/header.css`.

## Teknologi

- Node.js
- Express
- Axios
- Cheerio
- xml2js
- Vercel AI SDK (`ai` + `@ai-sdk/google`)
- HTML, CSS, JavaScript vanilla

## Struktur File Penting

```text
server.js                 Server utama Express untuk cPanel/hosting Node.js
index.html                Halaman utama crawling berita dan jurnal
isu-daerah.html           Halaman khusus pantau isu daerah
summarized-ai.html        Halaman khusus ringkasan AI berita
api/crawl-all.js          API serverless untuk Vercel
api/preview.js            API preview serverless untuk Vercel
api/regional-issues.js    API isu daerah serverless untuk Vercel
api/ai-news-summary.js    API ringkasan AI serverless untuk Vercel
src/header.js             Header/menu shared
src/header.css            Style header shared
package.json              Script dan dependency Node.js
vercel.json               Konfigurasi deploy Vercel
```

## Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan server:

```bash
npm start
```

Buka:

```text
http://localhost:3000
http://localhost:3000/isu-daerah
http://localhost:3000/summarized-ai
```

Test API:

```text
http://localhost:3000/api/test
```

## Endpoint

### Test Server

```text
GET /api/test
```

### Crawling Berita dan Jurnal

```text
POST /api/crawl-all
```

Payload:

```json
{
  "primaryKeywords": ["orangutan"],
  "secondaryKeywords": ["konflik", "perdagangan"],
  "startDate": "2026-06-01",
  "endDate": "2026-06-21"
}
```

### Preview Artikel

```text
GET /api/preview?url=URL_ARTIKEL
```

### Isu Daerah

```text
POST /api/regional-issues
```

Payload:

```json
{
  "regions": ["Riau", "Kalimantan Timur", "Papua"]
}
```

Payload opsional dengan batas hasil:

```json
{
  "regions": ["Riau"],
  "maxPerRegion": 20
}
```

Jika `maxPerRegion` tidak dikirim, aplikasi mengambil semaksimal mungkin dari feed RSS yang tersedia.

### Summarized AI

```text
POST /api/ai-news-summary
```

Payload:

```json
{
  "query": "carikan berita terbaru tentang konflik orangutan dan perdagangan satwa"
}
```

Endpoint ini mencari berita dari RSS, lalu membuat ringkasan gabungan. Mode utama memakai **Vercel AI SDK + AI Gateway**. Buat API key di Vercel AI Gateway, lalu set environment variable:

```text
AI_GATEWAY_API_KEY=isi_api_key_vercel_ai_gateway
```

Untuk lokal, bisa taruh di `.env.local`:

```text
AI_GATEWAY_API_KEY=isi_api_key_vercel_ai_gateway
AI_GATEWAY_MODEL=anthropic/claude-haiku-4.5
```

Opsional:

```text
AI_GATEWAY_MODEL=anthropic/claude-haiku-4.5
```

Provider yang tampil jika aktif:

```text
vercel-ai-gateway:anthropic/claude-haiku-4.5
```

Alternatif fallback jika ingin memakai Gemini langsung:

```text
GEMINI_API_KEY=isi_api_key_gemini
GEMINI_MODEL=gemini-flash-lite-latest
```

Alternatif fallback jika ingin memakai OpenAI:

```text
OPENAI_API_KEY=isi_api_key_openai
OPENAI_MODEL=gpt-4.1-mini
```

Urutan provider:

```text
Vercel AI Gateway -> Direct Gemini SDK -> OpenAI -> direct Gemini REST -> fallback judul berita
```

Jika semua API/model belum tersedia, aplikasi tetap menampilkan ringkasan fallback dari judul berita yang ditemukan.

## Deploy ke cPanel Node.js

Pastikan hosting punya fitur **Setup Node.js App**.

Setting umum:

```text
Node.js version: 20.x atau lebih baru
Application mode: Production
Application root: crawling
Application startup file: server.js
```

Upload file project ke folder application root, lalu jalankan:

```bash
npm install
```

Setelah itu klik **Restart** di Node.js App.

Test:

```text
https://domainkamu.com/api/test
https://domainkamu.com/isu-daerah
https://domainkamu.com/summarized-ai
```

## Catatan Keamanan

Server tidak lagi membuka seluruh root project sebagai static file. Yang dibuka untuk publik hanya route halaman, API, dan folder asset tertentu seperti:

```text
/src
/image
```

File seperti `server.js` dan `package.json` seharusnya tidak bisa diakses publik.

## Deploy ke Vercel

Project ini juga masih memiliki konfigurasi Vercel melalui:

```text
vercel.json
api/*.js
```

Namun untuk menghindari limit serverless Vercel, deploy utama yang disarankan adalah hosting/cPanel yang mendukung Node.js.

## File yang Jangan Diupload Jika ZIP Manual

```text
node_modules/
.git/
```

Dependency cukup di-install ulang di server dengan:

```bash
npm install
```
