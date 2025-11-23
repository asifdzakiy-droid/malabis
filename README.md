# malabis

Katalog produk busana — small static storefront.

This repository was initialized from the local project at `d:/nodejs/toi` and contains a lightweight product catalog UI that loads data from Google Sheets or a local Excel file.

Features included:
- Responsive product grid (2 cols mobile, 3 cols desktop)
- Cart sidebar with checkout via WhatsApp
- Product detail modal with quantity selector
- Category filtering and price sorting
- Wholesale pricing (uses `jual12` for qty >= 12)

How to run locally
1. Install dependencies (if needed): Node.js and git.
2. Start a simple static server from the project root, for example:

```powershell
npx http-server -p 8080
```

3. Open http://localhost:8080 in your browser.

Notes
- To push to GitHub, configure credentials or set up an SSH remote.
- The app expects product images under `PRODUK/GambarProduk/` and product data via Google Sheets or `PRODUK/database.xlsx`.

---
Generated initial README by automation.
# Katalog Produk Busana E-Commerce

Website katalog produk e-commerce sederhana dengan teknologi HTML, CSS, dan JavaScript murni (tanpa framework).

## Fitur
- Carousel homepage dengan gambar dummy (PRODUK/carousel1.jpg, carousel2.jpg, carousel3.jpg). Ganti dengan gambar busana sesuai kebutuhan.

✅ Layout responsif mobile-first  
✅ Daftar produk dengan nama, harga, gambar, deskripsi  
✅ Tombol "Tambah ke Keranjang" untuk setiap produk  
✅ Cart sidebar dengan:
   - Daftar item yang ditambahkan
   - Tombol tambah/kurang kuantitas
   - Total harga
   - Input nama pembeli dan catatan
✅ Checkout via WhatsApp dengan pesan otomatis  
✅ Data produk dibaca dari file Excel (`PRODUK/database.xlsx`)  
✅ Cart disimpan di localStorage  

## Cara Menggunakan

### Opsi 1: Menggunakan Google Sheets (Disarankan)

**Keuntungan:** Bisa diedit jarak jauh, update real-time, tidak perlu upload file

#### Langkah-langkah:

1. **Buat Google Sheets baru:**
   - Buka [Google Sheets](https://sheets.google.com)
   - Buat spreadsheet baru
   - Atur kolom sesuai struktur (lihat di bawah)

2. **Publish Google Sheets:**
   - Klik **File > Share > Publish to web**
   - Atau: **File > Share > Get link** (pilih "Anyone with the link can view")
   - Pilih sheet yang ingin dipublish
   - Pilih format: **CSV**
   - Klik **Publish**

3. **Dapatkan URL CSV:**
   - Copy URL yang muncul
   - URL akan berbentuk: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0`
   - Atau jika tidak ada parameter, tambahkan `/export?format=csv&gid=0` di akhir URL

4. **Konfigurasi di app.js:**
   - Buka file `app.js`
   - Edit baris 12, ganti `GOOGLE_SHEETS_URL` dengan URL Anda:
   ```javascript
   const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0';
   ```

5. **Selesai!** Website akan otomatis membaca data dari Google Sheets saat dibuka.

**Catatan:** Setiap kali Anda mengubah data di Google Sheets, website akan otomatis memuat data terbaru saat di-refresh.

### Opsi 2: Menggunakan Excel Lokal

**Keuntungan:** Offline, kontrol penuh, tidak perlu internet

#### Langkah-langkah:

1. **Kosongkan GOOGLE_SHEETS_URL:**
   - Buka file `app.js`
   - Pastikan baris 12: `const GOOGLE_SHEETS_URL = '';`

2. **Persiapan Data:**

Pastikan file Excel ada di `PRODUK/database.xlsx` dengan struktur kolom:
- **no** - Nomor urut
- **kode** - Kode produk (contoh: HPJYTD-0001)
- **kategori** - Kategori produk (contoh: HEM Dewasa)
- **bahan** - Bahan produk
- **variasi** - Variasi produk
- **jual1** - Harga jual satuan
- **jual12** - Harga grosir (opsional)
- **gambar1** - Nama file gambar (contoh: HPJYTD-0001.jpeg)
- **suplier** - Nama supplier (opsional)

### 2. Struktur Folder

```
toi/
├── index.html
├── style.css
├── app.js
└── PRODUK/
    ├── database.xlsx
    └── GambarProduk/
        ├── HPJYTD/
        │   ├── HPJYTD-0001.jpeg
        │   ├── HPJYTD-0002.jpeg
        │   └── ...
        ├── HPDPCA/
        │   ├── HPDPCA-0001.jpg
        │   └── ...
        └── ...
```

### 3. Konfigurasi WhatsApp

Edit file `app.js` baris 2, ganti nomor WhatsApp:
```javascript
const WHATSAPP_NUMBER = '62XXXXXXXXXX'; // Ganti dengan nomor Anda (tanpa +)
```

### 4. Menjalankan Website

**Penting:** Karena menggunakan `fetch()` untuk membaca file Excel, website harus dijalankan melalui web server lokal, bukan dibuka langsung di browser.

#### Opsi 1: Menggunakan Python (disarankan)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Lalu buka browser: `http://localhost:8000`

#### Opsi 2: Menggunakan Node.js (http-server)

```bash
npm install -g http-server
http-server
```

#### Opsi 3: Menggunakan Live Server (VS Code Extension)

Install extension "Live Server" di VS Code, lalu klik "Go Live"

### 5. Menggunakan Website

1. Buka website di browser
2. Data produk akan dimuat otomatis dari Excel
3. Klik "Tambah ke Keranjang" pada produk yang diinginkan
4. Klik tombol "Keranjang" untuk melihat isi keranjang
5. Atur kuantitas dengan tombol +/-
6. Isi nama pembeli dan catatan (opsional)
7. Klik "Checkout via WhatsApp" untuk mengirim pesan ke WhatsApp

## Format Pesan WhatsApp

Pesan yang dihasilkan otomatis:
```
Halo, saya ingin memesan:

1. Nama Produk A (Qty 2) = Rp130.000
2. Nama Produk B (Qty 1) = Rp65.000

Total = Rp195.000

Nama: [Nama Pembeli]
Catatan: [Catatan/Alamat]
```

## Catatan Teknis

- Data produk dibaca dari Excel menggunakan library **SheetJS (xlsx.js)**
- Cart disimpan di **localStorage** browser
- Gambar produk harus ada di folder sesuai kode produk
- Format gambar: `.jpeg` (default) atau `.jpg` (untuk folder HPDPCA)
- Website tidak memerlukan backend/server database

## Troubleshooting

**Data tidak muncul?**
- Pastikan file `PRODUK/database.xlsx` ada dan dapat diakses
- Jalankan website melalui web server lokal (bukan file://)
- Cek console browser untuk error message

**Gambar tidak muncul?**
- Pastikan file gambar ada di folder yang sesuai
- Nama file harus sesuai dengan kolom "gambar1" di Excel
- Path: `PRODUK/GambarProduk/{FOLDER}/{NAMA_FILE}`

**WhatsApp tidak terbuka?**
- Pastikan nomor WhatsApp sudah dikonfigurasi dengan benar
- Format: `62XXXXXXXXXX` (tanpa tanda +)

## Lisensi

Free to use.

