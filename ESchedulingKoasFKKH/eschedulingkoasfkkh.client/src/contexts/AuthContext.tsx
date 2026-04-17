import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);

  // Restore state from localStorage on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    const username = localStorage.getItem('username');
    if (isAuth && username) {
      setIsAuthenticated(true);
      setUser({ username });
    }
  }, []);

  const login = (username: string, password: string) => {
    // Simulasi login - dalam praktik nyata, hubungkan ke API backend
    if (username && password) {
      setIsAuthenticated(true);
      setUser({ username });
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', username);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
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
