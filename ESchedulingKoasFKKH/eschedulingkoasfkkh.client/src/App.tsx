import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MahasiswaPage from './pages/MahasiswaPage';
import DosenPage from './pages/DosenPage';
import StasePage from './pages/StasePage';
import KelompokPage from './pages/KelompokPage';
import JadwalPage from './pages/JadwalPage';
import TambahMahasiswaPage from './pages/TambahMahasiswaPage';
import TambahDosenPage from './pages/TambahDosenPage';
import TambahStasePage from './pages/TambahStasePage';
import TambahKelompokPage from './pages/TambahKelompokPage';
import DetailKelompokPage from './pages/DetailKelompokPage';
import TambahJadwalPage from './pages/TambahJadwalPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected - Main Pages */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><DashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/mahasiswa" element={
                        <ProtectedRoute><MahasiswaPage /></ProtectedRoute>
                    } />
                    <Route path="/dosen" element={
                        <ProtectedRoute><DosenPage /></ProtectedRoute>
                    } />
                    <Route path="/stase" element={
                        <ProtectedRoute><StasePage /></ProtectedRoute>
                    } />
                    <Route path="/kelompok" element={
                        <ProtectedRoute><KelompokPage /></ProtectedRoute>
                    } />
                    <Route path="/jadwal" element={
                        <ProtectedRoute><JadwalPage /></ProtectedRoute>
                    } />

                    {/* Protected - Form Pages */}
                    <Route path="/mahasiswa/tambah" element={
                        <ProtectedRoute><TambahMahasiswaPage /></ProtectedRoute>
                    } />
                    <Route path="/dosen/tambah" element={
                        <ProtectedRoute><TambahDosenPage /></ProtectedRoute>
                    } />
                    <Route path="/stase/tambah" element={
                        <ProtectedRoute><TambahStasePage /></ProtectedRoute>
                    } />
                    <Route path="/kelompok/tambah" element={
                        <ProtectedRoute><TambahKelompokPage /></ProtectedRoute>
                    } />
                    <Route path="/kelompok/:id" element={
                        <ProtectedRoute><DetailKelompokPage /></ProtectedRoute>
                    } />
                    <Route path="/jadwal/tambah" element={
                        <ProtectedRoute><TambahJadwalPage /></ProtectedRoute>
                    } />

                    {/* Default */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;