# 🏥 Sistem E-Commerce Apotek Klinik Makmur Jaya

Sistem E-Commerce Penjualan Obat dan Alat Kesehatan untuk Klinik Makmur Jaya. Proyek ini dibangun untuk memenuhi standar **Uji Kompetensi Web Developer BNSP**.

Aplikasi ini menggunakan arsitektur **Full-Stack JavaScript (MERN-style dengan SQLite)**, memisahkan backend (API) dan frontend (Antarmuka Pengguna) untuk skalabilitas dan pemeliharaan yang lebih baik.

---

## 🌟 Fitur Utama

1. **Role-Based Access Control (RBAC)**
   Sistem membatasi akses fitur berdasarkan 4 peran pengguna:
   * **Admin**: Kontrol penuh sistem, manajemen pengguna, monitoring log server, dan laporan analitik.
   * **Apoteker**: Manajemen inventaris obat (CRUD, Import CSV) dan laporan ketersediaan stok.
   * **Kasir**: Modul Point of Sales (POS), validasi resep offline, dan manajemen transaksi offline/online.
   * **Pasien**: Melihat katalog, menambahkan ke keranjang, unggah resep dokter, dan melakukan *checkout*.

2. **Manajemen Transaksi ACID**
   Transaksi menggunakan `sequelize.transaction()` untuk mencegah race-condition. Stok hanya akan terpotong secara permanen jika seluruh proses transaksi (termasuk penyimpanan item) berhasil (*atomic*).

3. **Logika Bisnis Obat Resep**
   Obat dengan kategori "Obat Resep" mewajibkan pengguna (Pasien) untuk mengunggah bukti foto resep dokter, atau mewajibkan verifikasi manual (Kasir) sebelum dapat di-checkout.

4. **Real-time Notifications (WebSocket)**
   Peringatan stok menipis (*low-stock*), peringatan batas kadaluarsa (*expiry-alert*), dan notifikasi pesanan masuk yang *real-time* ke dashboard Admin & Apoteker menggunakan `Socket.io`.

5. **Monitoring Server & Logs**
   *Dashboard* khusus Admin untuk memantau performa server (RAM, CPU), melihat *Error Logs*, dan melacak rekam jejak aktivitas pengguna (*Audit Logs*).

6. **Desain UI/UX Premium & Responsif**
   Antarmuka modern yang bersih dengan palet warna khusus Farmasi (Teal & Mint Green) serta tipografi modern, *micro-animations*, dan layout yang menyesuaikan perangkat (*responsive*).

---

## 🛠️ Teknologi yang Digunakan

### Backend (`/backend`)
* **Node.js & Express.js**: RESTful API server.
* **Sequelize ORM**: Menjembatani logika database.
* **SQLite3**: Database SQL ringan dan *serverless*.
* **Socket.io**: WebSockets untuk notifikasi *real-time*.
* **JSON Web Token (JWT) & bcryptjs**: Autentikasi dan hashing keamanan password.
* **Helmet & CORS**: Lapisan keamanan HTTP dan komunikasi lintas domain.
* **Multer**: Menangani *upload* file (foto resep, gambar obat).
* **Fast-CSV**: Batch import data obat dari file CSV.
* **PDFKit**: Ekspor laporan penjualan dalam format PDF.

### Frontend (`/frontend`)
* **React.js & Vite**: Library UI dan bundler yang sangat cepat.
* **React Router DOM**: Manajemen *routing* dan navigasi *Single Page Application* (SPA).
* **Axios**: HTTP Client untuk komunikasi dengan Backend API (beserta Interceptors untuk proteksi token JWT).
* **Socket.io-Client**: Penerima pesan notifikasi *real-time*.
* **Recharts**: Rendering grafik interaktif (*Bar Chart*, *Area Chart*, *Pie Chart*).
* **React-Hot-Toast**: Sistem notifikasi aksi yang cantik (berhasil, gagal).
* **Vanilla CSS (Design System)**: Desain kustom CSS Global dengan *CSS Variables* untuk fleksibilitas styling tingkat tinggi tanpa ketergantungan library luar (Tailwind/Bootstrap).

---

## 🚀 Cara Menjalankan Aplikasi di Lokal

### Prasyarat
Pastikan Anda sudah menginstal **Node.js** (versi 16 atau lebih baru) di komputer Anda.

### 1. Menjalankan Backend
Buka terminal dan arahkan ke folder `backend`:
```bash
cd backend
npm install
```

*(Opsional) Jika database belum di-seed, jalankan perintah:*
```bash
npm run seed
```

Jalankan server backend:
```bash
npm start
```
*Backend akan berjalan di `http://localhost:5000`.*

### 2. Menjalankan Frontend
Buka tab terminal baru dan arahkan ke folder `frontend`:
```bash
cd frontend
npm install
npm run dev
```
*Frontend akan berjalan di `http://localhost:5173`.*

---

## 🔐 Akun Demo (Default Seeder)
Gunakan salah satu dari akun berikut untuk login dan menguji sistem:

| Jabatan | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@1234` |
| **Apoteker** | `apoteker` | `Apo@12345` |
| **Kasir** | `kasir` | `Kasir@123` |
| **Pasien** | `pasien` | `Pasien@123` |

---

## 📁 Struktur Direktori

```text
klinikmakmurjaya_new/
├── backend/
│   ├── src/
│   │   ├── config/       # Konfigurasi Database
│   │   ├── controllers/  # Logika API
│   │   ├── middleware/   # Auth, Role Guard, Logger, Error Handler
│   │   ├── models/       # Schema Database (Sequelize)
│   │   ├── routes/       # Endpoint Routing API
│   │   ├── seeders/      # Script Inisialisasi Database
│   │   ├── socket/       # Logika WebSocket Real-time
│   │   ├── app.js        # Konfigurasi Express
│   │   └── server.js     # Entry point Node.js
│   ├── database.sqlite   # File Database
│   └── uploads/          # Folder file statis (Gambar & Resep)
│
└── frontend/
    ├── src/
    │   ├── api/          # Konfigurasi Axios & Endpoints
    │   ├── components/   # Komponen UI Reusable (Header, Sidebar, dsb)
    │   ├── context/      # React Context (Auth, Cart, Socket, Toast)
    │   ├── pages/        # Halaman Utama (Login, Dashboard, dsb)
    │   ├── App.jsx       # Routing dan Layout Master
    │   └── index.css     # Global Design System (CSS Variables)
    └── index.html        # Entry point DOM
```

---
*Dibuat oleh Tim Klinik Makmur Jaya untuk sertifikasi Web Developer BNSP.*
