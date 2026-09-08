# Panduan & Konvensi Agent BugSnap

## 1. Aturan Wajib: Internasionalisasi (i18n)
- **Wajib Pake i18n**: Seluruh teks antarmuka, label form, pesan status, modal, banner, dan komponen UI di BugSnap **WAJIB** menggunakan sistem i18n (`src/lib/i18n.ts`, `I18nProvider`, `useT()`).
- **Penyesuaian Otomatis**: Bahasa harus otomatis mendeteksi locale browser pengguna (`navigator.language.startsWith('id')` → `"id"`, selain itu `"en"`), atau mengikuti preferensi bahasa yang disimpan (`BugSnap.locale`).
- **Kamus Dwibahasa**: Setiap penambahan key baru harus selalu disertakan pada kamus `en` (English) dan `id` (Bahasa Indonesia) di `src/lib/i18n.ts`.
- **Tidak Boleh Hardcode**: Dilarang menulis teks UI langsung (*hardcoded string*) tanpa melalui fungsi translasi `t("key")`.

## 2. Aturan Git & Deployment
- **Jangan Push Otomatis**: Dilarang melakukan `git commit` atau `git push` sebelum ada instruksi eksplisit dari pengguna.
- **Etika Produk**: Dilarang keras membanding-bandingkan produk dengan kompetitor.
- **Desain**: Gunakan warna solid (tanpa gradient berlebihan), bersih, dan mendukung mode gelap/terang.
