# BugSnap Dashboard

> **BugSnap - From Click to Fix**  
> Modern web workspace for video captures, screenshots, and collaborative bug reporting.

BugSnap Dashboard adalah platform web kolaboratif untuk mengelola rekaman layar, tangkapan gambar, dan log diagnostik pengujian dari ekstensi Chrome BugSnap.

---

## 🚀 Fitur Utama

### 📊 Workspace & Activity Overview
- **Ringkasan Aktivitas**: Pantau total tangkapan layar, rekaman video, serta tren pelaporan bug tim secara terpusat.
- **Grafik Aktivitas**: Visualisasi aktivitas pelaporan terkini untuk memantau produktivitas dan status pengujian tim.

### 🗂️ Manajemen & Organisasi Captures
- **Galeri Lengkap**: Tampilan grid terpadu untuk semua screenshot dan rekaman video.
- **Pencarian & Filter Cepat**: Temukan laporan dengan cepat berdasarkan tipe media, tag, dan status investigasi.
- **Metadata Editor**: Sesuaikan judul, deskripsi, tag, dan status penyelesaian bug kapan saja.

### 🔍 Interactive Bug Viewer & Developer Diagnostics
- **High-Definition Media Player**: Pemutar video responsif dan viewer gambar resolusi tinggi dengan kemampuan zoom detail.
- **Technical Diagnostics Panel**:
  - **Console Logs**: Tampilan pesan error dan warning JavaScript.
  - **Network Requests**: Riwayat request HTTP lengkap dengan status code, timing, dan kemudahan salin sebagai cURL.
  - **User Interaction Steps**: Alur klik dan navigasi pengguna sebelum masalah terjadi.
  - **Environment Context**: Informasi otomatis mengenai sistem operasi, browser, ukuran layar, dan URL terkait.
- **✨ AI Bug Summary**: Ringkasan cerdas yang merangkum masalah utama dan langkah reproduksi untuk mempercepat waktu perbaikan.

### 🤝 Kolaborasi & Berbagi Fleksibel
- **Instant Public Share Link**: Bagikan link laporan kepada rekan tim atau klien dengan cepat.
- **Keamanan & Privasi**: Dukungan perlindungan kata sandi (*password-protected*) serta pengaturan masa kedaluwarsa tautan (*link expiry*).
- **Diskusi & Komentar Interaktif**: Komentar langsung pada halaman laporan untuk mempercepat komunikasi antar tim.
- **Integrasi Webhook**: Notifikasi instan ke platform komunikasi tim seperti Slack, Discord, atau Zapier.
- **Custom Branding**: Personalisasi tampilan workspace dengan nama dan logo brand tim Anda.

---

## 🛠️ Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` pada browser Anda.

### Environment Variables

Buat file `.env.local` dengan konfigurasi dasar berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## 🚀 Deployment

Platform ini siap dideploy ke layanan cloud modern seperti Vercel:
1. Hubungkan repository ke platform hosting Anda (misalnya Vercel).
2. Konfigurasikan Environment Variables pada dashboard project.
3. Deploy!
