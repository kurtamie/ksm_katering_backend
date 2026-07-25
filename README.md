# KSM Katering Backend — REST API & Content Management

REST API dan sistem manajemen konten untuk **Sistem Pemesanan Katering KSM Katering Batam**, dibangun di atas **Strapi CMS**. Menyediakan endpoint untuk menu, pesanan, pelanggan, pembayaran, dan autentikasi berbasis OTP WhatsApp.

---

## 🚀 Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | Strapi 5 |
| Language | TypeScript |
| Database | MySQL (production) / SQLite (development) |
| Auth | JWT + OTP WhatsApp |
| Runtime | Node.js ≥ 18 |

---

## ⚙️ Instalasi & Menjalankan Aplikasi

### Prasyarat

- **Node.js** v18 — v22
- **npm** v6 atau lebih baru
- **MySQL** (untuk production) atau biarkan SQLite untuk development

### Langkah Instalasi

**1. Clone repository**
```bash
git clone <url-repo-ini>
cd ksm_katering_backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Konfigurasi environment variables**

Salin file contoh environment dan sesuaikan isinya:
```bash
cp .env.example .env
```

Isi nilai berikut di file `.env`:

| Variable | Keterangan |
|----------|-----------|
| `HOST` | Host server (default: `0.0.0.0`) |
| `PORT` | Port server (default: `1337`) |
| `APP_KEYS` | Random string keys untuk enkripsi sesi |
| `API_TOKEN_SALT` | Salt untuk API token |
| `ADMIN_JWT_SECRET` | Secret JWT untuk admin panel |
| `JWT_SECRET` | Secret JWT untuk user API |
| `DATABASE_CLIENT` | `mysql` atau `sqlite` |
| `DATABASE_HOST` | Host database MySQL |
| `DATABASE_NAME` | Nama database |
| `DATABASE_USERNAME` | Username database |
| `DATABASE_PASSWORD` | Password database |

**4. Jalankan development server**
```bash
npm run dev
```

Buka [http://localhost:1337/admin](http://localhost:1337/admin) untuk mengakses admin panel.

### Perintah Lainnya

```bash
npm run build    # Build admin panel untuk production
npm run start    # Jalankan production server
npm run develop  # Sama dengan npm run dev (dengan auto-reload)
```

---

## 📁 Struktur Folder

```
ksm_katering_backend/
├── config/
│   ├── database.ts        # Konfigurasi koneksi database
│   ├── middlewares.ts     # CORS, security, & middleware lainnya
│   ├── server.ts          # Konfigurasi server
│   └── admin.ts           # Konfigurasi admin panel
├── src/
│   ├── api/               # Content Types & REST endpoint
│   │   ├── customer/      # Data pelanggan
│   │   ├── dish/          # Menu & hidangan
│   │   ├── invoice/       # Invoice pembayaran
│   │   ├── order/         # Data pesanan
│   │   ├── order-detail/  # Detail item pesanan
│   │   ├── order-menu/    # Menu per pesanan
│   │   ├── otp/           # OTP WhatsApp
│   │   ├── package/       # Paket layanan katering
│   │   └── staff/         # Data staf
│   ├── extensions/        # Override plugin bawaan Strapi
│   │   └── users-permissions/ # Kustomisasi autentikasi
│   └── index.ts           # Entry point aplikasi
└── database/              # Migrasi database
```

---

## 👥 Kontributor

| Nama | Peran |
|------|-------|
| Kurtamie | Full-stack Developer |
