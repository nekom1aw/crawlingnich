# Crawling Beta Test

Aplikasi dashboard Next.js untuk melakukan crawling berita, jurnal, preview artikel, ringkasan AI, dan pemantauan isu daerah secara realtime.

## Patch Update / Report Harian

Bagian ini dipakai untuk mencatat update aplikasi per tanggal, supaya mudah dibuat laporan progres.

### 03 Juli 2026

- Layout aplikasi dirapikan menjadi struktur shared: `app/layout.tsx` berisi navbar dan footer, sedangkan halaman crawling dan isu daerah fokus ke isi halaman.
- Navbar disatukan lewat komponen `app/_components/AppNavbar.tsx`, sehingga menu `Crawling`, `Isu Daerah`, dan `Admin` memakai tampilan yang sama.
- Tampilan light/dark dibuat lebih konsisten dengan gaya hitam-putih, termasuk hover tombol minimize panel kiri dan kanan.
- Halaman crawling ditambahkan tombol cancel untuk menghentikan proses crawling yang sedang berjalan.
- Filter tanggal crawling dibuat default dari 1 Januari tahun berjalan sampai hari ini.
- Hasil crawling dideduplikasi berdasarkan judul berita agar judul yang sama tidak tampil berulang.
- Label `PRIORITAS` diganti menjadi `Media Terpercaya`.
- Crawler ditingkatkan untuk mencari sumber internasional seperti BBC dan The Guardian, tetapi tetap memfilter relevansi keyword agar berita tidak melebar konteksnya.
- Sumber Betahita diprioritaskan, tetapi validasi keyword sekarang membaca isi artikel utama agar keyword dari bagian rekomendasi bawah halaman tidak ikut dihitung.
- Preview artikel diperbaiki agar mengambil konten artikel utama dan membuang bagian seperti `Berita lainnya`, `Artikel terkait`, `Baca juga`, rekomendasi, populer, dan latest.
- Link Google News ditangani lewat resolver agar diarahkan ke URL publisher asli ketika memungkinkan.
- Download CSV diperbarui untuk kebutuhan data orangutan dengan kolom: `tanggal temuan`, `kematian/kelahiran`, `inisial`, `Liar/Jinak`, `Jenis kelamin`, `umur/Thn`, `Kelas Umur`, `Penyebab Kematian`, `Desa`, `Kecamatan`, `Kabupaten`, `Provinsi`, `N`, `E`, `Keterangan`, dan `Sumber`.
- Ekstraksi CSV diarahkan membaca isi artikel untuk mencari tanggal kejadian, bukan hanya tanggal publikasi berita.
- Cache crawling dibuat 1 jam untuk keyword dan filter yang sama.
- Log crawling ditambahkan untuk mencatat riwayat crawl, jumlah hasil, cache hit, durasi, dan user.
- Halaman `/admin` ditambahkan untuk melihat riwayat crawling dan status cache.
- Status berita terbaca dibuat per user/browser dan otomatis kedaluwarsa setelah 1 jam agar tidak bercampur antar user.
- Halaman `Isu Daerah` dirapikan agar hasil per daerah lebih rapi, bisa discroll, dan tetap stabil ketika jumlah berita banyak.

Template update berikutnya:

```text
### DD NamaBulan YYYY

- Ringkasan update 1.
- Ringkasan update 2.
- Bug yang diperbaiki.
- Catatan testing: command yang dijalankan dan hasilnya.
```

## Fitur

- Crawling berita dari Bing News RSS dan Google News RSS.
- Pencarian jurnal dari OpenAlex.
- Filter tanggal dan tipe konten.
- Preview artikel di panel kanan.
- Halaman khusus **Isu Daerah** di `/isu-daerah`.
- Halaman khusus **Admin** di `/admin`.
- Halaman khusus **Summarized AI** di `/summarized-ai`.
- Ringkasan AI dari kumpulan berita berdasarkan pertanyaan bebas.
- Output isu daerah dikelompokkan per daerah, misalnya `Riau`, `Kalimantan Timur`, `Papua`.
- Hasil isu daerah diurutkan dari berita terbaru.
- Filter untuk menghindari isu kesehatan yang konteksnya artis/selebriti/hiburan.
- Navbar dan footer shared melalui komponen React di `app/_components`.

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
app/layout.tsx            Layout shared berisi navbar, konten, dan footer
app/_components/          Komponen shared seperti AppNavbar dan AppFooter
app/page.tsx              Halaman utama crawling berita dan jurnal
app/isu-daerah/page.tsx   Halaman khusus pantau isu daerah
app/admin/                Halaman admin untuk log crawling dan cache
app/summarized-ai/page.tsx Halaman khusus ringkasan AI berita
app/api/*/route.js        API route App Router Next.js
lib/server/crawl-all.js   Logic server crawling
lib/server/preview.js     Logic server preview
lib/server/admin-crawl-logs.js Logic server log crawling admin
lib/server/regional-issues.js Logic server isu daerah
lib/server/ai-news-summary.js Logic server ringkasan AI
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
http://localhost:3000/admin
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

### Admin Log Crawling

```text
GET /api/admin/crawl-logs
```

Endpoint ini dipakai halaman `/admin` untuk membaca riwayat crawling dan status cache.

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

Provider NVIDIA GLM juga didukung lewat endpoint OpenAI-compatible dari NVIDIA Build:

```text
NVIDIA_API_KEY=isi_api_key_nvidia
NVIDIA_MODEL=z-ai/glm-5.2
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

Jika `NVIDIA_API_KEY` tersedia, aplikasi akan memakai `z-ai/glm-5.2` terlebih dahulu.

```text
AI_GATEWAY_API_KEY=isi_api_key_vercel_ai_gateway
```

Untuk lokal, bisa taruh di `.env.local`:

```text
AI_GATEWAY_API_KEY=isi_api_key_vercel_ai_gateway
AI_GATEWAY_MODEL=anthropic/claude-haiku-4.5
NVIDIA_API_KEY=isi_api_key_nvidia
NVIDIA_MODEL=z-ai/glm-5.2
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
NVIDIA GLM -> Vercel AI Gateway -> Direct Gemini SDK -> OpenAI -> direct Gemini REST -> fallback judul berita
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
