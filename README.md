# Crawling Beta Test

Aplikasi dashboard Node.js untuk melakukan crawling berita, jurnal, preview artikel, dan pemantauan isu daerah secara realtime.

## Fitur

- Crawling berita dari Bing News RSS dan Google News RSS.
- Pencarian jurnal dari OpenAlex.
- Filter tanggal dan tipe konten.
- Preview artikel di panel kanan.
- Halaman khusus **Isu Daerah** di `/isu-daerah`.
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
- HTML, CSS, JavaScript vanilla

## Struktur File Penting

```text
server.js                 Server utama Express untuk cPanel/hosting Node.js
index.html                Halaman utama crawling berita dan jurnal
isu-daerah.html           Halaman khusus pantau isu daerah
api/crawl-all.js          API serverless untuk Vercel
api/preview.js            API preview serverless untuk Vercel
api/regional-issues.js    API isu daerah serverless untuk Vercel
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

## Deploy ke cPanel Node.js

Pastikan hosting punya fitur **Setup Node.js App**.

Setting umum:

```text
Node.js version: 18.x atau 20.x
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
