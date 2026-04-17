# 🚀 QUICK START - E-Scheduling Frontend

## 5 Menit Setup

### 1️⃣ Install Dependencies
```bash
cd eschedulingkoasfkkh.client
npm install
```

### 2️⃣ Jalankan Development Server
```bash
npm run dev
```

### 3️⃣ Buka di Browser
```
http://localhost:5173
```

### 4️⃣ Login (Test Akun)
- **Username**: `admin` (atau apapun)
- **Password**: `admin` (atau apapun)

### 5️⃣ Explore Dashboard
Klik salah satu dari 5 menu utama untuk explore setiap modul!

---

## 🎯 Apa yang Sudah Siap?

| Menu | Fitur | Status |
|------|-------|--------|
| 👨‍🎓 Kelola Mahasiswa | Tampil, Add, Edit, Delete | 🟢 Template Ready |
| 👨‍🏫 Kelola Dosen | Tampil, Add, Edit, Delete | 🟢 Template Ready |
| 🏥 Kelola Stase | Tampil, Add, Edit, Delete | 🟢 Template Ready |
| 👥 Kelola Kelompok | Buat, Edit, Delete | 🟢 Template Ready |
| 📅 Kelola Jadwal | Generate Auto, Manual Add | 🟢 Template Ready |

---

## 📱 Fitur yang Sudah Berjalan

✅ Login page dengan form validation
✅ Dashboard dengan 5 menu utama
✅ Protected routes (tidak bisa akses tanpa login)
✅ Auto-login on page refresh
✅ Modern minimalist design
✅ Responsive (mobile, tablet, desktop)
✅ Tailwind CSS styling
✅ Icon-based menu buttons

---

## 🛠️ Struktur File (Key Files)

```
eschedulingkoasfkkh.client/
├── src/
│   ├── pages/              # 7 page components
│   ├── components/         # Reusable components
│   ├── contexts/           # Auth state management
│   ├── App.tsx             # Main routing
│   ├── index.css           # Tailwind CSS
│   └── main.tsx            # Entry point
├── package.json            # Dependencies (updated)
├── tailwind.config.js      # NEW - Tailwind config
├── postcss.config.js       # NEW - PostCSS config
└── vite.config.ts          # Vite config
```

---

## 💡 Cara Menambah Fitur Baru

### 1. Tambah New Page
```bash
# Buat file baru di src/pages/NewPage.tsx
import { useNavigate } from 'react-router-dom';

export default function NewPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Your content */}
    </div>
  );
}
```

### 2. Add Route di App.tsx
```jsx
<Route
  path="/newpage"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### 3. Add Button di Dashboard
```jsx
{
  id: 'newmodule',
  label: 'New Module',
  icon: '🆕',
  path: '/newpage',
  description: 'Description',
  color: 'bg-blue-50 hover:bg-blue-100',
}
```

---

## 🔐 Auth System Cara Kerja

1. User buka app → diarahkan ke `/login` page
2. User masukkan username & password → click Login
3. AuthContext menyimpan state (login, user data)
4. Data disimpan di localStorage untuk persistence
5. User bisa akses protected routes
6. Kalau refresh page → auth state di-restore dari localStorage
7. Logout → hapus semua session data

---

## 🎨 Styling Tips (Tailwind CSS)

### Button Styles
```jsx
// Primary
<button className="bg-blue-600 hover:bg-blue-700 text-white">

// Secondary  
<button className="border border-gray-300 text-gray-700 hover:bg-gray-50">

// Danger
<button className="bg-red-600 hover:bg-red-700 text-white">
```

### Card Styles
```jsx
<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
```

### Color Scheme per Module
- Mahasiswa: Blue
- Dosen: Green  
- Stase: Purple
- Kelompok: Orange
- Jadwal: Red

---

## 📊 Next Steps (Untuk Produksi)

- [ ] Connect to backend API (C# .NET)
- [ ] Implement actual login validation
- [ ] Add data tables & forms
- [ ] Add search & filter functionality
- [ ] Add loading states & error handling
- [ ] Add success notifications
- [ ] Implement export to Excel/PDF
- [ ] Add role-based access control

---

## ⚠️ Troubleshooting

### Error: Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Error: Module not found
```bash
npm install
```

### Hot Reload not working
```bash
# Restart server
npm run dev
```

---

## 📚 Lihat Juga

- [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) - Dokumentasi lengkap
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [Vite Docs](https://vitejs.dev/)

---

**Happy Coding! 🎉**

Untuk pertanyaan atau issues, jangan ragu untuk bertanya!
