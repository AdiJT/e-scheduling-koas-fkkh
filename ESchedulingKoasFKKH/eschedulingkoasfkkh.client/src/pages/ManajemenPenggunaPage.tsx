import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  userManagementApi,
  type ManagedUser,
  type CreateManagedUserInput,
  type UpdateManagedUserInput,
} from '../services/api';
import {
  UsersIcon,
  SearchIcon,
  RefreshIcon,
  ShieldCheckIcon,
  UserIcon,
  LockIcon,
  EyeOffIcon,
  EditIcon,
  DeleteIcon,
} from '../components/Icons';
import Tooltip from '../components/Tooltip';

export default function ManajemenPenggunaPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'pengelola'>('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Add Form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'pengelola'>('pengelola');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Form state
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'pengelola'>('pengelola');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await userManagementApi.getAll();
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Stats calculation
  const totalUsers = users.length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;
  const totalPengelola = users.filter((u) => u.role === 'pengelola').length;

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setNewUsername('');
    setNewPassword('');
    setNewRole('pengelola');
    setShowAddPassword(false);
    setAddError('');
    setIsAddModalOpen(true);
  };

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setAddError('Username wajib diisi.');
      return;
    }
    if (newUsername.trim().length < 3) {
      setAddError('Username minimal 3 karakter.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setAddError('Password wajib diisi minimal 6 karakter.');
      return;
    }

    setSubmittingAdd(true);
    setAddError('');
    try {
      const payload: CreateManagedUserInput = {
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      };
      await userManagementApi.create(payload);
      setSuccessMsg(`Akun ${payload.role === 'admin' ? 'Administrator' : 'Pengelola'} "${payload.username}" berhasil dibuat!`);
      setIsAddModalOpen(false);
      await fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.errors && err.errors.username) {
        setAddError(err.errors.username);
      } else if (err.errors && err.errors.password) {
        setAddError(err.errors.password);
      } else {
        setAddError(err.message || 'Gagal menambahkan pengguna.');
      }
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPassword('');
    setShowEditPassword(false);
    setEditError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!editUsername.trim()) {
      setEditError('Username wajib diisi.');
      return;
    }
    if (editUsername.trim().length < 3) {
      setEditError('Username minimal 3 karakter.');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Password baru minimal 6 karakter jika ingin diubah.');
      return;
    }

    setSubmittingEdit(true);
    setEditError('');
    try {
      const payload: UpdateManagedUserInput = {
        username: editUsername.trim(),
        role: editRole,
        password: editPassword.trim() || undefined,
      };
      await userManagementApi.update(selectedUser.id, payload);
      setSuccessMsg(`Data akun "${payload.username}" berhasil diperbarui!`);
      setIsEditModalOpen(false);
      await fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      if (err.errors && err.errors.username) {
        setEditError(err.errors.username);
      } else if (err.errors && err.errors.role) {
        setEditError(err.errors.role);
      } else if (err.errors && err.errors.password) {
        setEditError(err.errors.password);
      } else {
        setEditError(err.message || 'Gagal memperbarui pengguna.');
      }
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete User
  const executeDelete = async (user: ManagedUser) => {
    if (user.isCurrentLoggedInUser) {
      setErrorMsg('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (user.role === 'admin' && totalAdmin <= 1) {
      setErrorMsg('Tidak dapat menghapus Admin terakhir. Sistem memerlukan minimal satu akun Administrator.');
      return;
    }

    setDeletingId(user.id);
    setErrorMsg('');
    try {
      await userManagementApi.delete(user.id);
      setSuccessMsg(`Akun "${user.username}" berhasil dihapus.`);
      await fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/[\s_-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl animate-fade-in">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-4">
            <UsersIcon className="w-64 h-64 sm:w-80 sm:h-80" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all border border-white/10 shadow-sm cursor-pointer shrink-0"
                title="Kembali ke Dashboard"
              >
                ←
              </button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Manajemen Pengguna</h1>
                <p className="text-xs sm:text-sm text-primary-100/90 leading-relaxed mt-0.5">
                  Kelola hak akses dan akun staf sistem dengan peranan Administrator dan Pengelola
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-100 self-start sm:self-center">
              <span>Total {totalUsers} Pengguna Staf</span>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="flex-1 font-medium">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="flex-1 font-medium">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600">×</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-fade-in-up">
          {/* Card 1: Total Staf */}
          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-card border border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                Total Staf
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 mt-0.5 sm:mt-1">
                {loading ? '...' : totalUsers}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 hidden sm:block">Admin & Pengelola</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 self-start sm:self-center">
              <UsersIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 2: Administrator */}
          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-card border border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                Administrator
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-purple-700 mt-0.5 sm:mt-1">
                {loading ? '...' : totalAdmin}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 hidden sm:block">Akses kontrol penuh</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 self-start sm:self-center">
              <ShieldCheckIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 3: Pengelola */}
          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-card border border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                Pengelola
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-teal-700 mt-0.5 sm:mt-1">
                {loading ? '...' : totalPengelola}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 hidden sm:block">Jadwal & akademik</p>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 self-start sm:self-center">
              <UserIcon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-3 sm:p-4 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search Input & Refresh Button on Mobile */}
            <div className="flex items-center gap-2 w-full md:max-w-md">
              <div className="relative flex-1">
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan username..."
                  className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 focus:bg-white transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <Tooltip content="Muat ulang data" position="bottom">
                <button
                  onClick={fetchUsers}
                  disabled={loading}
                  className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>
            </div>

            {/* Filter and Tambah Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
              {/* Role Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    roleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Semua ({totalUsers})
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    roleFilter === 'admin'
                      ? 'bg-white text-purple-700 shadow-sm font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Administrator ({totalAdmin})
                </button>
                <button
                  onClick={() => setRoleFilter('pengelola')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    roleFilter === 'pengelola'
                      ? 'bg-white text-teal-700 shadow-sm font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Pengelola ({totalPengelola})
                </button>
              </div>

              {/* Tambah Pengguna Button */}
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-glow-amber transition-all cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Pengguna</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table / List Section */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden animate-fade-in-up">
          {/* Table Header Info */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="text-primary-900 font-bold">{filteredUsers.length}</span> dari <span className="text-primary-900 font-bold">{totalUsers}</span> pengguna staf
            </p>
            <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                Administrator ({totalAdmin})
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
                Pengelola ({totalPengelola})
              </span>
            </div>
          </div>

          {/* Mobile View: Card List (Screens < md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-10 text-center text-slate-400">
                <div className="inline-flex items-center gap-2">
                  <RefreshIcon className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-xs">Memuat data pengguna...</span>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 px-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <UsersIcon className="w-10 h-10 text-slate-300" />
                  <p className="font-medium text-slate-600 text-sm">Tidak ada pengguna yang cocok.</p>
                  <p className="text-xs text-slate-400">
                    {search ? 'Coba kata kunci pencarian lain.' : 'Belum ada pengguna terdaftar.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredUsers.map((item) => {
                const isAdmin = item.role === 'admin';
                const isSelf = item.isCurrentLoggedInUser;
                const isLastAdmin = isAdmin && totalAdmin <= 1;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors ${
                      isSelf ? 'bg-primary-50/20' : ''
                    }`}
                  >
                    {/* Top row: Avatar + Username + Role Badge */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                              : 'bg-gradient-to-tr from-teal-500 to-emerald-600'
                          }`}
                        >
                          {getInitials(item.username)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm truncate">
                              {item.username}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{item.id}</span>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div className="shrink-0">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheckIcon className="w-3 h-3 text-purple-600" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <UserIcon className="w-3 h-3 text-teal-600" />
                            Pengelola
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle row: Scope description */}
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 mb-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {isAdmin ? 'Akses Penuh Sistem' : 'Pengelolaan Operasional'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {isAdmin
                          ? 'Kelola pengguna staf, broadcast pengumuman, data master, dan jadwal.'
                          : 'Kelola master data koas, kelompok, jadwal stase, dan broadcast.'}
                      </p>
                    </div>

                    {/* Bottom row: Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 active:scale-95 transition-all cursor-pointer"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmUser(item)}
                        disabled={isSelf || isLastAdmin || deletingId === item.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelf || isLastAdmin || deletingId === item.id
                            ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                            : 'text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 cursor-pointer'
                        }`}
                      >
                        {deletingId === item.id ? (
                          <RefreshIcon className="w-3.5 h-3.5 animate-spin text-red-500" />
                        ) : (
                          <DeleteIcon className="w-3.5 h-3.5" />
                        )}
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (Hidden on mobile, screens >= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white">
                  <th className="py-3.5 px-4 md:px-5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap w-16">No</th>
                  <th className="py-3.5 px-4 md:px-5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Pengguna</th>
                  <th className="py-3.5 px-4 md:px-5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Peranan (Role)</th>
                  <th className="py-3.5 px-4 md:px-5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Cakupan Izin</th>
                  <th className="py-3.5 px-4 md:px-5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Status Akun</th>
                  <th className="py-3.5 px-4 md:px-5 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <RefreshIcon className="w-5 h-5 animate-spin text-primary-600" />
                        <span>Memuat data pengguna...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UsersIcon className="w-12 h-12 text-slate-300" />
                        <p className="font-medium text-slate-600">Tidak ada pengguna yang cocok.</p>
                        <p className="text-xs text-slate-400">
                          {search ? 'Coba kata kunci pencarian lain.' : 'Belum ada pengguna terdaftar.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((item, index) => {
                    const isAdmin = item.role === 'admin';
                    const isSelf = item.isCurrentLoggedInUser;
                    const isLastAdmin = isAdmin && totalAdmin <= 1;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelf ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-4 px-4 md:px-5 text-xs font-medium text-slate-500">
                          {index + 1}
                        </td>

                        {/* User Info */}
                        <td className="py-4 px-4 md:px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0 ${
                                isAdmin
                                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                                  : 'bg-gradient-to-tr from-teal-500 to-emerald-600'
                              }`}
                            >
                              {getInitials(item.username)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">
                                  {item.username}
                                </span>
                                {isSelf && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700 border border-primary-200">
                                    Akun Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">ID User: #{item.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-4 md:px-5 whitespace-nowrap">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheckIcon className="w-3.5 h-3.5 text-purple-600" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                              <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                              Pengelola
                            </span>
                          )}
                        </td>

                        {/* Scope */}
                        <td className="py-4 px-4 md:px-5 text-xs text-slate-600 max-w-xs">
                          {isAdmin ? (
                            <div className="space-y-0.5">
                              <span className="font-medium text-purple-900 block">
                                Akses Penuh Sistem
                              </span>
                              <span className="text-slate-400 block">
                                Kelola pengguna, broadcast, data master, dan penjadwalan.
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-medium text-teal-900 block">
                                Pengelolaan Operasional
                              </span>
                              <span className="text-slate-400 block">
                                Kelola master data koas, kelompok, jadwal stase, dan broadcast.
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 md:px-5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 md:px-5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1">
                            <Tooltip content="Edit Pengguna" position="top">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-all duration-200 cursor-pointer"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            <Tooltip
                              content={
                                isSelf
                                  ? 'Anda tidak dapat menghapus akun Anda sendiri'
                                  : isLastAdmin
                                  ? 'Minimal harus ada 1 akun Administrator'
                                  : 'Hapus Pengguna'
                              }
                              position="top"
                            >
                              <button
                                onClick={() => setDeleteConfirmUser(item)}
                                disabled={isSelf || isLastAdmin || deletingId === item.id}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  isSelf || isLastAdmin || deletingId === item.id
                                    ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                                    : 'text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'
                                }`}
                              >
                                {deletingId === item.id ? (
                                  <RefreshIcon className="w-4 h-4 animate-spin text-red-500" />
                                ) : (
                                  <DeleteIcon className="w-4 h-4" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Note Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 sm:gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
            <LockIcon className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950 text-xs sm:text-sm">Informasi Keamanan Akun</h4>
            <p className="text-amber-800 leading-relaxed text-xs">
              Halaman ini diperuntukkan khusus untuk pengelolaan kredensial akun staf dengan role{' '}
              <strong>Administrator</strong> dan <strong>Pengelola</strong>. Akun Mahasiswa dan Dosen
              secara otomatis dikelola dan dihubungkan melalui modul <em>Data Master Mahasiswa</em> dan{' '}
              <em>Data Master Dosen</em>.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: Tambah Pengguna */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-primary-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">Tambah Pengguna Baru</h3>
                  <p className="text-[11px] sm:text-xs text-primary-200">Buat akun untuk Administrator atau Pengelola</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAdd} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              {addError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {addError}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: pengelola_stase"
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Digunakan untuk masuk ke dalam sistem (minimal 3 karakter).
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password Awal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <LockIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOffIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Peranan (Role) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Option: Pengelola */}
                  <label
                    className={`flex flex-col p-3 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      newRole === 'pengelola'
                        ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            newRole === 'pengelola'
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Pengelola</span>
                      </div>
                      <input
                        type="radio"
                        name="newRole"
                        checked={newRole === 'pengelola'}
                        onChange={() => setNewRole('pengelola')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal">
                      Mengelola jadwal, data stase, kelompok, dan broadcast.
                    </p>
                  </label>

                  {/* Option: Administrator */}
                  <label
                    className={`flex flex-col p-3 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      newRole === 'admin'
                        ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            newRole === 'admin'
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Administrator</span>
                      </div>
                      <input
                        type="radio"
                        name="newRole"
                        checked={newRole === 'admin'}
                        onChange={() => setNewRole('admin')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal">
                      Akses sistem penuh termasuk manajemen pengguna.
                    </p>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold transition text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary-900 to-indigo-900 hover:from-primary-800 hover:to-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50 text-center"
                >
                  {submittingAdd ? 'Menyimpan...' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Edit Pengguna */}
      {/* ======================================================== */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 to-primary-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">Edit Data Pengguna</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300">
                    ID #{selectedUser.id} - {selectedUser.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitEdit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              {editError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {editError}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Peranan (Role) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Option: Pengelola */}
                  <label
                    className={`flex flex-col p-3 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      editRole === 'pengelola'
                        ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            editRole === 'pengelola'
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Pengelola</span>
                      </div>
                      <input
                        type="radio"
                        name="editRole"
                        checked={editRole === 'pengelola'}
                        onChange={() => setEditRole('pengelola')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal">
                      Mengelola jadwal, data stase, kelompok, dan broadcast.
                    </p>
                  </label>

                  {/* Option: Administrator */}
                  <label
                    className={`flex flex-col p-3 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      editRole === 'admin'
                        ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            editRole === 'admin'
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Administrator</span>
                      </div>
                      <input
                        type="radio"
                        name="editRole"
                        checked={editRole === 'admin'}
                        onChange={() => setEditRole('admin')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal">
                      Akses sistem penuh termasuk manajemen pengguna.
                    </p>
                  </label>
                </div>

                {selectedUser.role === 'admin' && editRole !== 'admin' && totalAdmin <= 1 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    ⚠️ Peringatan: Ini adalah Administrator terakhir. Sistem tidak memperbolehkan mengubah role ini.
                  </p>
                )}
              </div>

              {/* Reset Password Optional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reset Password <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <LockIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    className="w-full pl-10 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOffIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Minimal 6 karakter jika password baru diisi.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold transition text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary-900 to-indigo-900 hover:from-primary-800 hover:to-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50 text-center"
                >
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Konfirmasi Hapus Pengguna */}
      {/* ======================================================== */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-up p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 sm:gap-3.5 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">Hapus Akun Pengguna</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-4 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-bold text-slate-900">{deleteConfirmUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="font-semibold text-slate-800 uppercase">{deleteConfirmUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID User:</span>
                <span className="font-mono text-slate-700">#{deleteConfirmUser.id}</span>
              </div>
            </div>

            <p className="text-xs text-red-600 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun ini? Akun yang dihapus tidak akan dapat masuk ke sistem lagi.
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-semibold transition text-center"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={async () => {
                  const userToDelete = deleteConfirmUser;
                  setDeleteConfirmUser(null);
                  if (userToDelete) await executeDelete(userToDelete);
                }}
                className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-md transition disabled:opacity-50 text-center"
              >
                {deletingId !== null ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
