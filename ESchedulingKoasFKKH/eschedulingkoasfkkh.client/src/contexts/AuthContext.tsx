/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; role: string; fullName?: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const [user, setUser] = useState<{ username: string; role: string; fullName?: string } | null>(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName') || undefined;
    return username && role ? { username, role, fullName } : null;
  });

  // Restore state from localStorage on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    const loginTimestamp = localStorage.getItem('loginTimestamp');

    if (isAuth && username && role && loginTimestamp) {
      const now = new Date().getTime();
      const timeDiff = now - parseInt(loginTimestamp);
      
      // 10 minutes = 10 * 60 * 1000 = 600,000 ms
      if (timeDiff < 600000) {
        setIsAuthenticated(true);
        setUser({ username, role, fullName: fullName || undefined });
      } else {
        // Expired
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        localStorage.removeItem('fullName');
        localStorage.removeItem('token');
        localStorage.removeItem('loginTimestamp');
      }
    }
  }, []);

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
      
      if (token) {
        setIsAuthenticated(true);
        setUser({ username, role, fullName });
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);
        if (fullName) localStorage.setItem('fullName', fullName);
        localStorage.setItem('token', token);
        localStorage.setItem('loginTimestamp', new Date().getTime().toString());
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTimestamp');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
