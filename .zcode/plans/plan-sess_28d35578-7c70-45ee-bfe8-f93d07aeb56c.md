## Rencana Penerapan Theme (Light | Dark | System) Terintegrasi DB

Autentikasi dan database sudah tersinkronisasi. Agar tema tersimpan di lintas device dan tidak ada contrast tabrakan (seperti kotak putih `bg-white` menyala di dark mode), kita akan menerapkan CSS variables adaptive.

### 1. Database & Schema Migration
- Buat migration `025_add_theme_to_users.sql`:
  - Tambahkan kolom `theme` ke tabel `public.users` dengan tipe `text`, default `'system'`, dan constraint `check (theme in ('light', 'dark', 'system'))`.
  - Update trigger `handle_new_user` agar default theme baru selalu `'system'`.
  - Buat RPC `update_user_theme(p_theme text)` (security definer) agar user bisa update tema mereka sendiri secara aman.
- Terapkan migration ke remote database menggunakan `npx supabase db push`.

### 2. CSS Adaptive Variables & Tailwind Dark Mode
- Di `tailwind.config.ts`, aktifkan `darkMode: "class"`.
- Di `src/app/globals.css`, definisikan `.dark` overrides untuk seluruh variabel standard:
  ```css
  .dark {
    --background: #0f0f0f;       /* Gelap pekat */
    --foreground: #f9fafb;       /* Putih terang */
    --border: #1f2937;           /* Border abu gelap */
    --subtle: #111827;           /* Card bg / sidebar bg */
    --muted: #9ca3af;            /* Text abu soft */
    --accent: #818cf8;           /* Indigo terang */
    --accent-hover: #6366f1;
  }
  ```
- **Hapus `bg-white` / `bg-white/90`** pada container utama di layout, captures grid, settings panel, admin, dan devtools panel, lalu ganti dengan semantic token `bg-background` (untuk halaman utama) atau `bg-subtle` (untuk card/sidebar) agar transisi warna otomatis bekerja tanpa ada "kotak putih contrast".

### 3. Theme Provider & Script (Mencegah FOUC / Flicker)
- Buat Client Component `ThemeProvider` yang:
  - Menyediakan global state `theme` dan fungsi `setTheme`.
  - Saat load pertama, membaca tema dari profile user di database.
  - Menerapkan / menghapus class `dark` ke `document.documentElement`.
  - Jika tema `'system'`, dengarkan media query `(prefers-color-scheme: dark)` untuk otomatis sync.
  - Untuk mencegah *flash* putih sebelum hydration selesai, sisipkan inline script kecil di `<head>` root layout (`src/app/layout.tsx`) yang membaca theme awal dari cookie/session jika memungkinkan, atau default ke media query system.

### 4. UI Selector di Settings -> Account Tab
- Di halaman `/settings` pada tab **Account**, tambahkan opsi radio/button group ber-icon (Sun, Moon, Monitor) untuk memilih tema:
  - **Light Mode**
  - **Dark Mode**
  - **System Default**
- Klik opsi tema langsung memanggil RPC `update_user_theme` dan merubah state global di client.

### 5. Validasi
- Jalankan `npm run typecheck` dan `npm run build`.
- Restart `npm run dev` setelah selesai coding.

→ skipped: penggunaan lib `next-themes` pihak ketiga; build dengan custom react context manual lebih presisi dan menghindari FOUC hydration mismatch di Next.js 14 App Router.