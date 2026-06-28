# Crawling Beta Test

Aplikasi dashboard Next.js untuk melakukan crawling berita, jurnal, preview artikel, ringkasan AI, dan pemantauan isu daerah secara realtime.

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

- Next.js
- Node.js
- Axios
- Cheerio
- xml2js
- Vercel AI SDK (`ai` + `@ai-sdk/google`)
- HTML, CSS, JavaScript vanilla

## Struktur File Penting

```text
server-next.js            Server Next.js untuk cPanel/hosting Node.js
next.config.js            Konfigurasi Next.js
app/                      Route App Router Next.js dan halaman TSX
app/page.tsx              Halaman utama crawling berita dan jurnal
app/isu-daerah/page.tsx   Halaman khusus pantau isu daerah
app/summarized-ai/page.tsx Halaman khusus ringkasan AI berita
app/api/*/route.js        API route App Router Next.js
lib/server/crawl-all.js   Logic server crawling
lib/server/preview.js     Logic server preview
lib/server/regional-issues.js Logic server isu daerah
lib/server/ai-news-summary.js Logic server ringkasan AI
src/header.js             Header/menu shared
src/header.css            Style header shared
public/                   Asset statis yang dibaca Next.js
package.json              Script dan dependency Node.js
vercel.json               Konfigurasi framework Next.js untuk Vercel
```

## Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan mode development:

```bash
npm run dev
```

Atau build dan jalankan mode production seperti server:

```bash
npm run build
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
Application startup file: server-next.js
```

Upload file project ke folder application root, lalu jalankan:

```bash
npm install
npm run build
```

Setelah itu klik **Restart** di Node.js App. Script `npm start` akan menjalankan Next.js lewat `server-next.js`.

Test:

```text
https://domainkamu.com/api/test
https://domainkamu.com/isu-daerah
https://domainkamu.com/summarized-ai
```

## Auto Deploy dari GitHub ke cPanel

Project ini sudah punya GitHub Actions workflow:

```text
.github/workflows/deploy-cpanel.yml
```

Setiap push ke branch `main` atau `master`, GitHub akan upload project ke cPanel lewat SSH, lalu menjalankan:

```bash
npm ci
npm run build
touch tmp/restart.txt
```

Buat Secrets ini di GitHub:

```text
CPANEL_HOST=host_ssh_cpanel
CPANEL_PORT=22
CPANEL_USER=username_cpanel
CPANEL_SSH_KEY=private_key_ssh
CPANEL_APP_DIR=/home/username_cpanel/path/aplikasi
```

File `.env` dan `.env.local` tidak ikut diupload dari GitHub. Isi environment production langsung di cPanel atau buat file `.env.local` manual di folder aplikasi server.

## Catatan Keamanan

Next.js tidak membuka seluruh root project sebagai static file. Yang dibuka untuk publik hanya route halaman, API, dan folder asset `public/`.

```text
public/src
public/image
```

File seperti `server.js` dan `package.json` seharusnya tidak bisa diakses publik.

## Deploy ke Vercel

Project ini sudah memakai framework Next.js. Untuk Vercel, cukup deploy repo ini dan isi environment variable yang diperlukan.

```text
vercel.json
```

Namun untuk menghindari limit serverless Vercel, deploy utama yang disarankan tetap hosting/cPanel yang mendukung Node.js.

## File yang Jangan Diupload Jika ZIP Manual

```text
node_modules/
.git/
```

Dependency cukup di-install ulang di server dengan:

```bash
npm install
```
