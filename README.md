# 🥗 Kantin Sekolah PWA (Progressive Web App)

Aplikasi **PWA Pemesanan Kantin Sekolah** modern, cepat, dan responsif yang dibangun dengan **Next.js App Router (TypeScript)**, **Tailwind CSS**, **Firebase** (Authentication & Cloud Firestore), dan **Cloudinary**.

Aplikasi ini dirancang khusus untuk mempermudah siswa memesan makanan & minuman secara praktis tanpa antre, serta memberikan dashboard manajemen lengkap bagi pengelola kantin sekolah.

---

## 📱 Fitur Utama

### 1. Siswa / Pemesan (Mobile-First Experience)
- **Katalog Menu Interaktif**: Jelajahi makanan, minuman, dan snack dengan foto berkualitas tinggi dari Cloudinary.
- **Pencarian & Filter Kategori**: Filter cepat berdasarkan kantin, kategori menu, atau kata kunci pencarian.
- **Detail Menu & Ulasan**: Lihat deskripsi porsi, tingkat kepedasan, pilihan ukuran (*Regular*, *Jumbo*), serta ulasan siswa.
- **Keranjang Pintar**: Tambah/kurang porsi dengan pembatasan stok otomatis agar tidak melebihi stok yang tersedia.
- **Checkout & Transaksi Aman**:
  - Pilihan metode pembayaran **QRIS** (dilengkapi simulator kode QR dinamis) dan **Tunai** (bayar di kasir saat ambil makanan).
  - Validasi harga dan pemotongan stok secara atomik di sisi server untuk mencegah *overselling*.
- **Pelacakan Pesanan Real-time**: Pantau status pesanan (*Menunggu* ➔ *Dikonfirmasi* ➔ *Diproses* ➔ *Siap Diambil* ➔ *Selesai*).
- **Kode Pengambilan**: Setiap pesanan dilengkapi kode pesanan unik (contoh: `B001`) untuk verifikasi saat mengambil makanan.
- **Pembatalan Pesanan**: Pembatalan pesanan yang belum diproses akan secara otomatis mengembalikan stok makanan secara atomik.

### 2. Admin Pengelola Kantin (Dashboard Terintegrasi)
- **Ringkasan KPI Dashboard**:
  - Total pesanan hari ini.
  - Pesanan aktif yang sedang dimasak/siap diambil.
  - Total omset/pendapatan dari transaksi yang berhasil.
  - Jumlah gerai kantin dan menu aktif.
  - Peringatan stok menu yang hampir habis (*Low Stock Alert*).
- **Grafik Penjualan**: Kurva tren penjualan dan pendapatan mingguan interaktif.
- **Manajemen Menu (CRUD)**:
  - Tambah, edit, dan hapus menu makanan/minuman.
  - Upload gambar menu langsung ke Cloudinary menggunakan **Signed Upload** aman (API Secret tersimpan di server).
  - Pengaturan harga rupiah integer, kategori, stok, dan status ketersediaan.
- **Pemrosesan Pesanan**:
  - Pembaruan status pesanan (*Konfirmasi*, *Mulai Masak*, *Siap Diambil*, *Selesai*).
  - Verifikasi penerimaan pembayaran tunai dan QRIS.
- **Manajemen Data Siswa (Pemesan)**: Daftar profil siswa dan kontrol peran/role akun (*admin* vs *pemesan*).
- **Manajemen Kantin**: Kelola data tenant/gerai kantin sekolah.
- **Laporan Penjualan & Ekspor CSV**: Analisis penjualan berdasarkan tanggal, kantin, status, dan unduh laporan ke file CSV.
- **Pengaturan & Inisialisasi Data**: Tombol 1-klik untuk inisialisasi data awal (seeding) sesuai data Excel sekolah.

### 3. Progressive Web App (PWA)
- **Dapat Diinstal (Installable)**: Prompt banner untuk menambahkan aplikasi ke Layar Utama (*Home Screen*) HP atau desktop.
- **Manifest & Service Worker**: Konfigurasi `manifest.json` tema hijau segar (`#16a34a`) dan `sw.js` dengan proteksi keamanan cache (rute admin dan data privat tidak dicache).
- **Offline Fallback**: Halaman ramah pengguna ketika koneksi internet terputus.

---

## 🛠️ Arsitektur Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React Server Components & API Routes |
| **Bahasa** | TypeScript | Type-safe interfaces & strict validation |
| **Styling** | Tailwind CSS & Lucide Icons | Desain UI modern, fluid, dan mobile-first |
| **Autentikasi** | Firebase Authentication | Login email/password & Role-based Access |
| **Database** | Cloud Firestore | NoSQL Real-time database & Atomic transactions |
| **Server SDK** | Firebase Admin SDK | Operasi checkout atomik dan verifikasi server |
| **Penyimpanan Gambar** | Cloudinary | Signed upload langsung dari browser ke folder `kantin-sekolah/menu` |
| **Format QRIS** | QRCode generator | Pembuatan QR dinamis instan di frontend |
| **Deployment** | Vercel & GitHub | Continuous Integration & Global Edge Network |

---

## 🗄️ Struktur Database Cloud Firestore

Struktur koleksi database sesuai spesifikasi:

### 1. `users`
```typescript
{
  uid: string;              // UID Firebase Auth
  kodePemesan: string;      // Contoh: P001, P002
  namaPemesan: string;      // Nama lengkap siswa
  noTlp: string;            // Nomor telepon / WA
  alamatPemesan: string;    // Kelas siswa (e.g. XII IPA 1)
  email: string;            // Email siswa
  role: "admin" | "pemesan";// Role pengguna
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. `kantin`
```typescript
{
  id: string;               // ID dokumen
  kodeKantin: string;       // Contoh: K001
  namaKantin: string;       // Barokah Food
  alamatKantin: string;     // Jl. Rambutan, Blok A1
  noTlpKantin: string;      // Nomor kontak
  isActive: boolean;        // Status operasional
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `menu`
```typescript
{
  id: string;
  kodeMenu: string;          // Contoh: A001, A002
  namaMenu: string;          // Nasi Ayam Bakar
  deskripsi: string;         // Deskripsi menu
  kategori: string;          // Makanan, Minuman, Snack
  hargaMenu: number;         // Integer Rupiah (20000)
  stok: number;              // Sisa stok porsi
  gambarUrl: string;         // URL aman Cloudinary
  cloudinaryPublicId: string;// Public ID Cloudinary
  kantinId: string;          // Relasi ke kantin
  isAvailable: boolean;      // Status aktif
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4. `pesanan` & Subkoleksi `pesanan/{id}/items`
```typescript
// Dokumen Pesanan
{
  id: string;
  kodePesanan: string;            // Contoh: B001
  pemesanId: string;              // UID siswa
  namaPemesanSnapshot: string;    // Snapshot nama
  kantinId: string;
  namaKantinSnapshot: string;     // Snapshot kantin
  tanggalPemesanan: Timestamp;
  statusPesanan: "menunggu" | "dikonfirmasi" | "diproses" | "siap_diambil" | "selesai" | "dibatalkan";
  metodeTransaksi: "QRIS" | "tunai";
  statusTransaksi: "menunggu" | "berhasil" | "gagal" | "dikembalikan";
  subtotal: number;
  totalHarga: number;
  catatan?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subkoleksi: items
{
  menuId: string;
  namaMenuSnapshot: string;
  hargaMenuSnapshot: number;
  jumlahPesanan: number;
  subtotalItem: number;
  gambarUrlSnapshot: string;
}
```

### 5. `transaksi`
```typescript
{
  id: string;
  kodeTransaksi: string;          // Contoh: C001
  pesananId: string;
  pemesanId: string;
  metodeTransaksi: "QRIS" | "tunai";
  statusTransaksi: "menunggu" | "berhasil" | "gagal" | "dikembalikan";
  jumlahPembayaran: number;
  referensiPembayaran: string;
  waktuPembayaran: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/username/PesaananKantinSekolah.git
cd PesaananKantinSekolah
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu isi kredensial Firebase dan Cloudinary Anda (aplikasi juga menyediakan mode demo otomatis jika kredensial belum diisi).

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🔒 Konfigurasi Keamanan Firebase

1. **Deploy Aturan Keamanan (Security Rules)**:
   Gunakan Firebase CLI untuk menerapkan aturan `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **Deploy Indeks Firestore**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

---

## ☁️ Panduan Integrasi Cloudinary

1. Buat akun di [Cloudinary Console](https://cloudinary.com/console).
2. Salin **Cloud Name**, **API Key**, dan **API Secret**.
3. Masukkan ke `.env.local` pada server:
   ```env
   CLOUDINARY_CLOUD_NAME=nama_cloud_anda
   CLOUDINARY_API_KEY=1234567890
   CLOUDINARY_API_SECRET=rahasia_anda
   ```
4. Saat admin mengunggah gambar di halaman `/admin/menu`, endpoint `/api/cloudinary-sign` akan membuat tanda tangan digital aman sehingga browser mengunggah langsung ke folder `kantin-sekolah/menu` tanpa mengekspos API Secret.

---

## 🌐 Panduan Deployment ke Vercel

1. Push source code proyek Anda ke repositori GitHub.
2. Buka dashboard [Vercel](https://vercel.com) dan pilih **Add New Project**.
3. Hubungkan repositori GitHub Anda.
4. Pada bagian **Environment Variables**, tambahkan semua variabel dari `.env.example`.
5. Klik **Deploy**. Aplikasi PWA Kantin Sekolah Anda akan langsung aktif secara global!
