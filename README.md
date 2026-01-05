# 🔬 Houshou Interactive Simulation (Virtual Lab)


![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)


**Houshou Interactive Simulation** adalah platform **"Virtual Lab"** lintas platform (Web & Mobile) yang dirancang untuk membantu siswa memahami konsep sains (Fisika, Kimia, dan Matematika) melalui simulasi interaktif yang aman, visual, dan dapat diakses kapan saja.

> 📚 Proyek ini dikembangkan sebagai tugas besar mata kuliah **II3140 Pengembangan Aplikasi Web dan Mobile** di Institut Teknologi Bandung.

---

## 🌟 Fitur Utama

Aplikasi ini menerapkan konsep **Systems Thinking** dengan siklus tertutup (*closed-loop system*) yang mencakup **Input**, **Process**, **Output**, dan **Feedback**.

### 📱 Multi-Platform Access

| Platform | Deskripsi |
|----------|-----------|
| **Web (Desktop-Optimized)** | Tampilan dashboard luas dengan panel kontrol dan grafik berdampingan untuk analisis mendalam |
| **Mobile (Android)** | Desain responsif (*touch-friendly*) dengan navigasi bottom tab yang memudahkan penggunaan satu tangan |

### 🧪 Simulasi Interaktif Real-time

| Kategori | Simulasi |
|----------|----------|
| **Fisika** | Simple Pendulum (Bandul Sederhana) & Projectile Motion (Gerak Parabola) |
| **Kimia** | pH Meter Simulation |
| **Matematika** | Function Graph (Grafik Fungsi) |

### ☁️ Cloud Synchronization

Simpan konfigurasi eksperimen di satu perangkat (misal: HP saat di kelas) dan buka kembali di perangkat lain (misal: Laptop saat membuat laporan) menggunakan akun yang terintegrasi via **Supabase**.

### 📊 Visualisasi Data

Grafik dinamis yang berubah secara instan saat parameter diubah tanpa perlu reload halaman (*Client-side processing*).

---

## 🛠️ Teknologi yang Digunakan

Proyek ini menggunakan arsitektur modern dengan satu basis kode logika yang beradaptasi di dua lingkungan berbeda.

### Frontend (Web)

| Teknologi | Keterangan |
|-----------|------------|
| Framework | React.js |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Deployment | Vercel |

### Mobile App

| Teknologi | Keterangan |
|-----------|------------|
| Framework | Expo (React Native) |
| Styling | NativeWind |
| Routing | Expo Router |

### Backend & Database

| Teknologi | Keterangan |
|-----------|------------|
| Platform | Supabase |
| Database | PostgreSQL |
| Auth | Supabase Auth (Email & Password) |

---

## 📂 Struktur Proyek

```
virtual-web-pawm/
├── frontend/       # Kode sumber aplikasi Web (React + Vite)
├── mobile/         # Kode sumber aplikasi Mobile (Expo)
└── supabase/       # Konfigurasi backend dan database
```

---

## 🚀 Cara Menjalankan (Installation)

> ⚠️ **Prasyarat:** Pastikan kamu sudah menginstal [Node.js](https://nodejs.org/) di komputermu.

### 1. Menjalankan Website (Frontend)

Masuk ke direktori `frontend` dan jalankan server pengembangan:

```bash
cd frontend
npm install
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

### 2. Menjalankan Aplikasi Mobile

Masuk ke direktori `mobile` dan jalankan Expo:

```bash
cd mobile
npm install
npx expo start
```

Scan QR code yang muncul menggunakan aplikasi **Expo Go** di Android/iOS atau gunakan Android Emulator.

### 3. Setup Backend (Supabase)

Pastikan kamu memiliki file `.env` di folder `frontend` dan `mobile` yang berisi kredensial Supabase kamu:

**Frontend (.env)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Mobile (.env)**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Seeding Database (Opsional)

Untuk mengisi database dengan data simulasi awal:

```bash
cd supabase
npm install
npx ts-node seed.ts
```

---

## 👥 Penulis

| Nama | NIM |
|------|-----|
| **Valereo Jibril Al Buchori** | 18223030 |
| **Mahesa Satria Prayata** | 18223082 |

---

**Institut Teknologi Bandung © 2026**

*II3140 Pengembangan Aplikasi Web dan Mobile*

