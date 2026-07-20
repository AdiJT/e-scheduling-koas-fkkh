import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import logoUndana from '../assets/logo_undana.png';
import {
  DashboardIcon,
  TahunAjaranIcon,
  MahasiswaIcon,
  DosenIcon,
  StaseIcon,
  KelompokIcon,
  JadwalIcon,
  LogoutIcon,
  HistoryIcon,
} from './Icons';

interface NavItem {
  id: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections = (isMahasiswaOrDosen: boolean): NavSection[] => {
  if (isMahasiswaOrDosen) {
    return [
      {
        title: 'Menu Utama',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' }
        ]
      },
      {
        title: 'Akademik',
        items: [
          { id: 'stase', label: 'Stase', icon: StaseIcon, path: '/stase' }
        ]
      },
      {
        title: 'Penjadwalan',
        items: [
          { id: 'kelompok', label: 'Kelompok', icon: KelompokIcon, path: '/kelompok' },
          { id: 'jadwal', label: 'Jadwal', icon: JadwalIcon, path: '/jadwal' },
          { id: 'riwayat-kelompok', label: 'Riwayat Kelompok', icon: HistoryIcon, path: '/riwayat-kelompok' }
        ]
      }
    ];
  }

  return [
    {
      title: 'Menu Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' }
      ]
    },
    {
      title: 'Data Master',
      items: [
        { id: 'tahun-ajaran', label: 'Tahun Ajaran', icon: TahunAjaranIcon, path: '/tahun-ajaran' },
        { id: 'mahasiswa', label: 'Mahasiswa', icon: MahasiswaIcon, path: '/mahasiswa' },
        { id: 'dosen', label: 'Dosen', icon: DosenIcon, path: '/dosen' },
        { id: 'stase', label: 'Stase', icon: StaseIcon, path: '/stase' }
      ]
    },
    {
      title: 'Penjadwalan',
      items: [
        { id: 'kelompok', label: 'Kelompok', icon: KelompokIcon, path: '/kelompok' },
        { id: 'jadwal', label: 'Jadwal', icon: JadwalIcon, path: '/jadwal' },
        { id: 'riwayat-kelompok', label: 'Riwayat Kelompok', icon: HistoryIcon, path: '/riwayat-kelompok' }
      ]
    }
  ];
};

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
  const { user, logout, updateUser } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const handleOpenProfile = () => {
    setNewUsername(user?.username || '');
    setNewPassword('');
    setConfirmPassword('');
    setProfileError(null);
    setProfileSuccess(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setProfileError('Username tidak boleh kosong');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('Konfirmasi password tidak cocok');
      return;
    }

    try {
      setUpdating(true);
      setProfileError(null);
      setProfileSuccess(null);
      await userApi.updateProfile({
        newUsername: newUsername.trim(),
        newPassword: newPassword || undefined
      });
      updateUser(newUsername.trim());
      setProfileSuccess('Profil berhasil diperbarui!');
      setTimeout(() => {
        setShowProfileModal(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message || 'Gagal memperbarui profil. Username mungkin sudah digunakan.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
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
  const isDosen = user?.role?.toLowerCase() === 'dosen';
  const isMahasiswaOrDosen = isMahasiswa || isDosen;

  const activeSections = navSections(isMahasiswaOrDosen);

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
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out flex flex-col bg-primary-900 text-white shadow-dark
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`p-4 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12'} transition-all duration-300 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}>
              <img className="w-full h-full object-contain" src={logoUndana} alt="Logo Undana" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in overflow-hidden whitespace-nowrap">
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">E-Scheduling</h1>
                <p className="text-[10px] text-blue-300/80 font-semibold">FKKH UNDANA</p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <button 
              className="md:hidden text-white/70 hover:text-white p-1 ml-auto"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary-800 border-2 border-primary-600 text-white/60 hover:text-white hover:bg-primary-700 items-center justify-center text-xs transition-all shadow-lg z-50"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>

        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {activeSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <p className="text-[10px] font-bold text-blue-300/40 uppercase tracking-wider px-3 mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
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
                    <span className={`flex-shrink-0 transition-transform duration-200 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    {!collapsed && (
                      <span className="animate-fade-in truncate">{item.label}</span>
                    )}
                    {!collapsed && isActive(item.path) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-slow" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div 
            onClick={handleOpenProfile}
            title="Klik untuk edit profil"
            className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
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
            className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold text-[#ff4b60] bg-[#27141e] hover:bg-[#3b1826] transition-all duration-200 ${collapsed ? 'justify-center px-2' : ''}`}
            title="Logout"
          >
            <span className="text-lg flex items-center">
              <LogoutIcon className="w-5 h-5" />
            </span>
            {!collapsed && <span className="animate-fade-in">Keluar Akun</span>}
          </button>
        </div>
      </aside>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-3xl shadow-elevated p-6 w-full max-w-sm animate-scale-in flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-primary-900">Edit Profil</h3>
                <p className="text-xs text-slate-500">Sesuaikan kredensial login Anda.</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:bg-slate-150 p-2 rounded-full transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 mb-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Username Baru</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all text-slate-800 font-semibold"
                  placeholder="Masukkan username baru"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="Isi jika ingin ganti password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="Ketik ulang password baru"
                />
              </div>

              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium">
                  {profileSuccess}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                disabled={updating}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updating}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-650 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md text-xs disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {updating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
