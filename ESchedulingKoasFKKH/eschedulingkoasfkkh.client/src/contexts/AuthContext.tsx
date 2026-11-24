/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import { mahasiswaApi, type MahasiswaAccessStatus } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; role: string; fullName?: string; profileId?: number } | null;
  mahasiswaAccess: MahasiswaAccessStatus | null;
  mahasiswaAccessLoading: boolean;
  refreshMahasiswaAccess: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (username: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredMahasiswaAccess(): MahasiswaAccessStatus | null {
  try {
    const raw = localStorage.getItem('mahasiswaAccess');
    return raw ? (JSON.parse(raw) as MahasiswaAccessStatus) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    if (isAuth && loginTimestamp) {
      const timeDiff = new Date().getTime() - parseInt(loginTimestamp);
      return timeDiff < 600000; // 10 minutes
    }
    return false;
  });

  const [user, setUser] = useState<{ username: string; role: string; fullName?: string; profileId?: number } | null>(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName') || undefined;
    const profileId = localStorage.getItem('profileId');
    return username && role ? { username, role, fullName, profileId: profileId ? parseInt(profileId) : undefined } : null;
  });

  const [mahasiswaAccess, setMahasiswaAccess] = useState<MahasiswaAccessStatus | null>(() => {
    const role = localStorage.getItem('role')?.toLowerCase();
    return role === 'mahasiswa' ? readStoredMahasiswaAccess() : null;
  });
  const [mahasiswaAccessLoading, setMahasiswaAccessLoading] = useState(false);

  const refreshMahasiswaAccess = useCallback(async () => {
    const role = localStorage.getItem('role')?.toLowerCase();
    const token = localStorage.getItem('token');
    if (role !== 'mahasiswa' || !token) {
      setMahasiswaAccess(null);
      localStorage.removeItem('mahasiswaAccess');
      return;
    }

    try {
      setMahasiswaAccessLoading(true);
      const access = await mahasiswaApi.getMyAccess();
      setMahasiswaAccess(access);
      localStorage.setItem('mahasiswaAccess', JSON.stringify(access));
    } catch (err) {
      console.error('Failed to refresh mahasiswa access:', err);
    } finally {
      setMahasiswaAccessLoading(false);
    }
  }, []);

  // Restore state from localStorage on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    const profileId = localStorage.getItem('profileId');
    const loginTimestamp = localStorage.getItem('loginTimestamp');

    if (isAuth && username && role && loginTimestamp) {
      const now = new Date().getTime();
      const timeDiff = now - parseInt(loginTimestamp);
      
      // 10 minutes = 10 * 60 * 1000 = 600,000 ms
      if (timeDiff < 600000) {
        setIsAuthenticated(true);
        setUser({ username, role, fullName: fullName || undefined, profileId: profileId ? parseInt(profileId) : undefined });
        if (role.toLowerCase() === 'mahasiswa') {
          void refreshMahasiswaAccess();
        }
      } else {
        // Expired
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('fullName');
        localStorage.removeItem('profileId');
        localStorage.removeItem('token');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('mahasiswaAccess');
        setMahasiswaAccess(null);
      }
    }
  }, [refreshMahasiswaAccess]);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: username, password })
      });

      if (!response.ok) {
        throw new Error('Login gagal. Periksa username dan password Anda.');
      }

      const data = await response.json();
      const token = data.token;
      const role = data.role || data.Role;
      const fullName = data.fullName;
      const profileId = data.profileId;
      const mhsAccess: MahasiswaAccessStatus | null = data.mahasiswaAccess || null;
      
      if (token) {
        setIsAuthenticated(true);
        setUser({ username, role, fullName, profileId });
        setMahasiswaAccess(mhsAccess);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);
        if (fullName) localStorage.setItem('fullName', fullName);
        if (profileId) localStorage.setItem('profileId', profileId.toString());
        if (mhsAccess) {
          localStorage.setItem('mahasiswaAccess', JSON.stringify(mhsAccess));
        } else {
          localStorage.removeItem('mahasiswaAccess');
        }
        localStorage.setItem('token', token);
        localStorage.setItem('loginTimestamp', new Date().getTime().toString());

        if (role?.toLowerCase() === 'mahasiswa' && !mhsAccess) {
          await refreshMahasiswaAccess();
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setMahasiswaAccess(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('profileId');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('mahasiswaAccess');
  };

  const updateUser = (username: string) => {
    setUser(prev => prev ? { ...prev, username } : null);
    localStorage.setItem('username', username);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        mahasiswaAccess,
        mahasiswaAccessLoading,
        refreshMahasiswaAccess,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
