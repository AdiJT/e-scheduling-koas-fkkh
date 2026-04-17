/*import { useState, useEffect } from 'react';*/
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

function App() {

    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected */}
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

                    {/* Default */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;