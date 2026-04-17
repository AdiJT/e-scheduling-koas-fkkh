# E-Scheduling Frontend Architecture

## 🏗️ Application Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     E-Scheduling App                         │
│                   (React + TypeScript)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               BrowserRouter (React Router v6)               │
├─────────────────────────────────────────────────────────────┤
│                          │                                   │
│                          │                                   │
├──────────────────────────┼──────────────────────────────────┤
│                          ▼                                   │
│               ┌──────────────────────┐                       │
│               │   AuthProvider       │                       │
│               │  (Context API)       │                       │
│               └──────────────────────┘                       │
│                          │                                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                  ▼
    ┌──────────────┐              ┌──────────────────┐
    │  Public      │              │  Protected       │
    │  Routes      │              │  Routes          │
    │              │              │                  │
    │ /login       │              │ /dashboard       │
    └──────────────┘              │ /mahasiswa       │
         │                        │ /dosen           │
         │                        │ /stase           │
         │                        │ /kelompok        │
         │                        │ /jadwal          │
         │                        └──────────────────┘
         │                              │
         ▼                              ▼
    ┌──────────────┐            ┌─────────────────┐
    │  LoginPage   │            │ Dashboard Page  │
    │              │            │ + Module Pages  │
    │ Form Input   │            │                 │
    │ Validation   │            │ (with navbar)   │
    │ Auth Store   │            └─────────────────┘
    └──────────────┘                    │
                                        ├────────────────┐
                                        │                │
                                        ▼                ▼
                                  ┌─────────────┐  ┌──────────────┐
                                  │ Data Pages  │  │ Empty States │
                                  │             │  │              │
                                  │ - Buttons   │  │ - Placeholder│
                                  │ - Tables*   │  │ - Add button │
                                  └─────────────┘  └──────────────┘
```

## 📊 Data Flow (Simplified)

```
User Input
    │
    ▼
React Component (Page)
    │
    ▼
Event Handler / Form Submit
    │
    ├─ Local Validation
    │
    ▼
Context API / State Update (AuthContext)
    │
    ├─ localStorage Update
    │
    ▼
Component Re-render
    │
    ▼
User Sees Result
```

## 🔐 Authentication Flow

```
START
  │
  ▼
App Mounts
  │
  ├─ Check localStorage for auth token
  │
  ├─ YES → Restore user session
  │
  └─ NO → Redirect to /login
  
At LoginPage:
  │
  ├─ User enters credentials
  │
  ├─ Click Login button
  │
  ├─ Validate inputs
  │
  ├─ Call login function (mock: just set state)
  │
  ├─ Store in localStorage
  │
  ├─ Update AuthContext
  │
  └─ Redirect to /dashboard

At ProtectedRoutes:
  │
  ├─ Check isAuthenticated
  │
  ├─ YES → Render component
  │
  └─ NO → Redirect to /login
```

## 🎨 Component Hierarchy

```
<App>
  ├─ <BrowserRouter>
  │   ├─ <AuthProvider>
  │   │   ├─ <Routes>
  │   │   │   ├─ <Route path="/login">
  │   │   │   │   └─ <LoginPage />
  │   │   │   │
  │   │   │   ├─ <Route path="/dashboard">
  │   │   │   │   ├─ <ProtectedRoute>
  │   │   │   │   │   └─ <DashboardPage />
  │   │   │   │   │       ├─ <PageHeader />
  │   │   │   │   │       └─ <MenuGrid />
  │   │   │   │   │           └─ <MenuButton /> x5
  │   │   │   │
  │   │   │   └─ <Route path="/mahasiswa|/dosen|/stase|/kelompok|/jadwal">
  │   │   │       ├─ <ProtectedRoute>
  │   │   │       │   └─ <ModulePage />
  │   │   │       │       ├─ <PageHeader />
  │   │   │       │       └─ <ActionButtons />
```

## 🗂️ Folder Structure Detail

```
src/
├── pages/
│   ├── LoginPage.tsx          # Login form page
│   ├── DashboardPage.tsx      # Main dashboard with menu
│   ├── MahasiswaPage.tsx      # Student management
│   ├── DosenPage.tsx          # Instructor management
│   ├── StasePage.tsx          # Stage/rotation management
│   ├── KelompokPage.tsx       # Group management
│   └── JadwalPage.tsx         # Schedule management
│
├── components/
│   └── ProtectedRoute.tsx     # Route protection wrapper
│
├── contexts/
│   └── AuthContext.tsx        # Authentication state & logic
│
├── utils/
│   └── (future helpers)
│
├── App.tsx                    # Main app component with routing
├── main.tsx                   # React entry point
└── index.css                  # Tailwind CSS + globals

```

## 📦 Dependencies Overview

### React Ecosystem
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing

### Styling
- `tailwindcss` - Utility-first CSS framework
- `@tailwindcss/forms` - Form styling plugin
- `autoprefixer` - PostCSS plugin for vendor prefixes
- `postcss` - CSS transformation tool

### Build Tools
- `vite` - Modern build tool
- `typescript` - Type safety
- `eslint` - Code linting

## 🔄 State Management Strategy

Currently using:
- **AuthContext (Context API)** - Authentication state
- **localStorage** - Persistence layer

Future options:
- Redux (for complex state)
- Zustand (lighter alternative)
- React Query (for API data)

## 🌐 API Integration Points (Ready)

1. **Login Endpoint** - `/api/auth/login`
   - Input: `{ username, password }`
   - Output: `{ token, user }`

2. **Mahasiswa CRUD** - `/api/mahasiswa/*`
   - GET, POST, PUT, DELETE

3. **Dosen CRUD** - `/api/dosen/*`
   - GET, POST, PUT, DELETE

4. **Stase CRUD** - `/api/stase/*`
   - GET, POST, PUT, DELETE

5. **Kelompok CRUD** - `/api/kelompok/*`
   - GET, POST, PUT, DELETE

6. **Jadwal Operations** - `/api/jadwal/*`
   - GET, POST, PUT, DELETE
   - POST `/api/jadwal/generate` - Auto-generate schedule

## 🎯 Current Status

✅ Frontend structure complete
✅ Routing system ready
✅ Authentication flow implemented
✅ UI components with Tailwind CSS
✅ Component templates for all modules

⏳ Todo:
- [ ] Connect to backend API
- [ ] Implement data tables
- [ ] Add form modals
- [ ] Error handling
- [ ] Loading states
- [ ] Notifications
