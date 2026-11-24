import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireActiveMahasiswa?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, requireActiveMahasiswa = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, mahasiswaAccess, mahasiswaAccessLoading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireActiveMahasiswa && user?.role?.toLowerCase() === 'mahasiswa') {
    if (mahasiswaAccessLoading && !mahasiswaAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Memeriksa status periode KOAS...</p>
          </div>
        </div>
      );
    }

    if (!mahasiswaAccess || !mahasiswaAccess.canViewJadwalDanKelompok) {
      const fallbackPath = mahasiswaAccess?.sudahSelesaiAtauTerlewat ? '/riwayat-kelompok' : '/dashboard';
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}
