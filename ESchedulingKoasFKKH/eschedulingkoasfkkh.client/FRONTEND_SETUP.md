# E-Scheduling Koas FKKH - Frontend

Sistem aplikasi web untuk penjadwalan koas (clinical rotation) yang membagi kelompok mahasiswa dan jadwal stase secara otomatis.

## 📋 Fitur Utama

- ✅ **Login Page** - Autentikasi user
- ✅ **Dashboard** - Menu utama dengan 5 modul
- ✅ **Kelola Mahasiswa** - Manage data mahasiswa
- ✅ **Kelola Dosen** - Manage data dosen pembimbing
- ✅ **Kelola Stase** - Manage data stase/rotasi klinik
- ✅ **Kelola Kelompok** - Buat dan manage kelompok mahasiswa
- ✅ **Kelola Jadwal** - Generate dan manage jadwal stase otomatis

## 🎨 Desain

- **Tema**: Modern Minimalis
- **Warna Utama**: Putih background dengan tombol berwarna menarik
- **Framework**: Tailwind CSS
- **Responsive**: Mobile-friendly design

## 🚀 Teknologi yang Digunakan

- **React 19** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Context API** - State management (Auth)

## 📁 Struktur Folder

```
src/
├── pages/
│   ├── LoginPage.tsx          # Halaman login
│   ├── DashboardPage.tsx      # Dashboard/menu utama
│   ├── MahasiswaPage.tsx      # Manage mahasiswa
│   ├── DosenPage.tsx          # Manage dosen
│   ├── StasePage.tsx          # Manage stase
│   ├── KelompokPage.tsx       # Manage kelompok
│   └── JadwalPage.tsx         # Manage jadwal
├── components/
│   └── ProtectedRoute.tsx     # Route protection untuk login
├── contexts/
│   └── AuthContext.tsx        # Auth state management
├── utils/                      # Utility functions (future)
├── App.tsx                     # Main routing setup
├── main.tsx                    # Entry point
└── index.css                   # Tailwind CSS + global styles
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16 atau lebih tinggi)
- npm atau yarn

### Steps

1. **Masuk ke directory client**
```bash
cd eschedulingkoasfkkh.client
```

2. **Install dependencies**
```bash
npm install
```

3. **Jalankan development server**
```bash
npm run dev
```

4. **Buka browser**
```
http://localhost:5173
```

## 📝 Akun Login (Untuk Testing)

Aplikasi ini menggunakan simulasi login. Masukkan username dan password apapun untuk login:
- Username: `admin` (atau apapun)
- Password: `admin` (atau apapun)

> **Note**: Untuk production, koneksikan dengan API backend yang sebenarnya

## 🔨 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build       # Build for production
npm run preview    # Preview production build

# Linting
npm run lint       # Run ESLint
```

## 📱 Responsive Design

Aplikasi ini fully responsive dan bekerja optimal di:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 🖥️ Desktop (1024px+)

## 🔐 Autentikasi

- Login state disimpan di localStorage
- User tetap login setelah refresh page
- Logout menghapus semua session data
- Protected routes mencegah akses tanpa login

## 🎯 Roadmap (Future Features)

- [ ] Integrasi dengan API backend C#
- [ ] CRUD operations lengkap untuk semua modul
- [ ] Modal forms untuk add/edit data
- [ ] Data table dengan search & filter
- [ ] Pagination
- [ ] Export jadwal ke Excel/PDF
- [ ] Role-based access control
- [ ] Notification system
- [ ] Dark mode

## 📚 Component Details

### LoginPage
- Form login modern dengan validasi
- Error handling
- Redirect ke dashboard setelah login

### DashboardPage
- Welcome message dengan username
- 5 action buttons untuk main modules
- Quick statistics
- Logout button

### Module Pages (Mahasiswa, Dosen, Stase, Kelompok)
- Back button ke dashboard
- Add/Create button
- Empty state placeholder
- Ready for data table integration

### JadwalPage
- Generate otomatis button
- Manual add button
- Schedule view placeholder

## 🎨 Tailwind CSS Color Scheme

- Primary Blue: `#3B82F6`
- Secondary Dark Blue: `#1E40AF`
- White Background: Default
- Gray: `#6B7280` (text), `#E5E7EB` (borders)
- Status Colors: Green (success), Red (danger), etc.

## 🐛 Troubleshooting

### Port 5173 sudah digunakan
```bash
npm run dev -- --port 3000
```

### Dependencies issue
```bash
rm -rf node_modules
npm install
```

### Cache issue
```bash
npm run build
npm run preview
```

## 📞 Support

Untuk pertanyaan atau masalah, silakan buka issue di repository ini.

## 📄 License

© 2026 E-Scheduling Koas FKKH

---

**Dibuat dengan ❤️ untuk FKKH**
