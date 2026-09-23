import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import { ChevronDownIcon, LogoutIcon, LockIcon, UserIcon } from './Icons';

export default function NavbarProfile() {
  const { user, logout, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Profile modal state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenEditModal = () => {
    setIsOpen(false);
    setNewUsername(user?.username || '');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setErrorMsg('Username tidak boleh kosong');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok');
      return;
    }

    try {
      setUpdating(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await userApi.updateProfile({
        newUsername: newUsername.trim(),
        newPassword: newPassword || undefined,
      });
      updateUser(newUsername.trim());
      setSuccessMsg('Profil dan password berhasil diperbarui!');
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memperbarui profil. Username mungkin sudah digunakan.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const getRoleDisplay = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'administrator') return 'Administrator';
    if (role === 'pengelola') return 'Pengelola';
    if (role === 'mahasiswa') return 'Mahasiswa';
    if (role === 'dosen') return 'Dosen Pembimbing';
    return role || 'Pengguna';
  };

  const initials = getInitials(user?.fullName || user?.username || 'User');
  const displayName = user?.fullName || user?.username || 'Pengguna';
  const roleName = getRoleDisplay();

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-xl hover:bg-slate-100/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 group"
        title="Menu Profil Pengguna"
        aria-label="Menu Profil"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 group-hover:shadow transition-shadow">
          {initials}
        </div>

        <div className="text-left hidden sm:block">
          <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-primary-700 transition-colors truncate max-w-[130px]">
            {displayName}
          </p>
          <p className="text-[10px] font-semibold text-primary-600">
            {roleName}
          </p>
        </div>

        <ChevronDownIcon
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-scale-in origin-top-right">
          {/* User Info Header */}
          <div className="p-4 bg-gradient-to-br from-slate-50 via-primary-50/20 to-white border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  @{user?.username}
                </p>
                <div className="mt-1">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                    {roleName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="p-2 space-y-1">
            {/* Edit Profil / Ubah Password */}
            <button
              onClick={handleOpenEditModal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                <LockIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  Ubah Password & Profil
                </p>
                <p className="text-[10px] text-slate-400">
                  Sesuaikan username dan kata sandi
                </p>
              </div>
            </button>

            {/* Divider */}
            <div className="h-[1px] bg-slate-100 my-1 mx-2" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-rose-50 transition-colors group text-rose-600"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                <LogoutIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-600">
                  Keluar Akun
                </p>
                <p className="text-[10px] text-rose-400">
                  Akhiri sesi login saat ini
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile / Change Password Modal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in z-[99999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-sm animate-scale-in flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 my-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ubah Password & Profil</h3>
                  <p className="text-xs text-slate-500">Sesuaikan kredensial login Anda.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 mb-4 overflow-y-auto pr-1 flex-1 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Username Baru
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                  placeholder="Masukkan username baru"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="Kosongkan jika tidak diubah"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="Ketik ulang password baru"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                  {successMsg}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={updating}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updating}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md text-xs disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {updating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
