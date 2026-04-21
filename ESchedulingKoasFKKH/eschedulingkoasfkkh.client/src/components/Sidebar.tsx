import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { id: 'mahasiswa', label: 'Mahasiswa', icon: '👨‍🎓', path: '/mahasiswa' },
  { id: 'dosen', label: 'Dosen', icon: '👨‍🏫', path: '/dosen' },
  { id: 'stase', label: 'Stase', icon: '🏥', path: '/stase' },
  { id: 'kelompok', label: 'Kelompok', icon: '👥', path: '/kelompok' },
  { id: 'jadwal', label: 'Jadwal', icon: '📅', path: '/jadwal' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({ 
  mobileOpen = false, 
  setMobileOpen = () => {}, 
  collapsed = false, 
  setCollapsed = () => {} 
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false); // Close mobile menu after navigation
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const isMahasiswa = user?.role?.toLowerCase() === 'mahasiswa';
  
  const filteredNavItems = navItems.filter(item => {
    if (isMahasiswa) {
      return ['dashboard', 'stase', 'kelompok', 'jadwal'].includes(item.id);
    }
    return true;
  });

  const getRoleDisplay = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'administrator') return 'Administrator';
    if (role === 'pengelola') return 'Pengelola';
    if (role === 'mahasiswa') return 'Mahasiswa';
    if (role === 'dosen') return 'Dosen';
    return role || 'Guest';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out flex flex-col bg-primary-900 text-white shadow-dark
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-lg font-bold shadow-glow-blue flex-shrink-0">
              ES
            </div>
            {!collapsed && (
              <div className="animate-fade-in overflow-hidden whitespace-nowrap">
                <h1 className="text-lg font-bold tracking-tight">E-Scheduling</h1>
                <p className="text-xs text-blue-300/70">KOAS FKKH</p>
              </div>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden text-white/70 hover:text-white p-1"
            onClick={() => setMobileOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toggle Button (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary-800 border-2 border-primary-600 text-white/60 hover:text-white hover:bg-primary-700 items-center justify-center text-xs transition-all shadow-lg z-50"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="text-xs font-semibold text-blue-300/50 uppercase tracking-wider px-3 mb-3">
              Menu Utama
            </p>
          )}
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-white shadow-glow-blue/20 border border-blue-400/20'
                  : 'text-blue-100/60 hover:text-white hover:bg-white/5'
                }`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`text-xl flex-shrink-0 transition-transform duration-200 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
              {!collapsed && isActive(item.path) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-slow" />
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold shadow-md flex-shrink-0">
              {getInitials(user?.fullName || user?.username || 'Admin')}
            </div>
            {!collapsed && (
              <div className="animate-fade-in flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username || 'Admin'}</p>
                <p className="text-xs text-blue-300/50">
                  {getRoleDisplay()}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            id="btn-logout"
            className={`mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span className="animate-fade-in">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
