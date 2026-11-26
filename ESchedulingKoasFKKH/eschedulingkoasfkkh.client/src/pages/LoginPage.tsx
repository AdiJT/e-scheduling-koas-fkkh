/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InfoIcon, MahasiswaIcon, DetailIcon as EyeIcon, EyeOffIcon, StethoscopeIcon, BookIcon, UserIcon, LockIcon, GoogleIcon, PhoneIcon, MailIcon, MapPinIcon, ClockIcon } from '../components/Icons';
import { pengaturanSistemApi, type FaqItemDto, type KontakSettingDto } from '../services/api';
import logo from "../assets/logo_undana.png";

const DEFAULT_FAQ_LIST: FaqItemDto[] = [
  {
    id: 1,
    pertanyaan: 'Email Google apa yang dapat saya gunakan untuk masuk?',
    jawaban: 'Anda wajib menggunakan akun Google dengan email yang sudah terhubung atau terdaftar pada profil akun SIADIKNONA Anda. Sistem akan mencocokkan email Google dengan data SIADIKNONA.',
    urutan: 1,
    isAktif: true,
  },
  {
    id: 2,
    pertanyaan: 'Bagaimana jika email saya belum terhubung ke SIADIKNONA?',
    jawaban: 'Silakan perbarui data email aktif Anda pada portal SIADIKNONA atau koordinasikan dengan bagian akademik/admin FKKH UNDANA agar data email Anda dapat disinkronkan ke dalam sistem penjadwalan.',
    urutan: 2,
    isAktif: true,
  },
  {
    id: 3,
    pertanyaan: 'Apakah saya masih bisa login dengan email dan password manual?',
    jawaban: 'Ya, Anda tetap dapat login secara manual. Cukup masukkan email terdaftar Anda dan password pada form input di bawah tombol Google.',
    urutan: 3,
    isAktif: true,
  },
  {
    id: 4,
    pertanyaan: 'Bagaimana jika saya lupa password akun manual saya?',
    jawaban: 'Jika email Anda terdaftar di SIADIKNONA, Anda bisa langsung masuk menggunakan opsi "Masuk dengan Google". Atau, Anda dapat menghubungi Administrator FKKH UNDANA untuk bantuan reset password akun manual.',
    urutan: 4,
    isAktif: true,
  },
  {
    id: 5,
    pertanyaan: 'Muncul pesan "Akun Belum Terdaftar" saat login Google, apa penyebabnya?',
    jawaban: 'Pesan ini muncul jika email akun Google yang Anda pilih belum tercatat pada data SIADIKNONA di sistem penjadwalan. Pastikan Anda memilih akun Google yang benar sesuai email di SIADIKNONA.',
    urutan: 5,
    isAktif: true,
  },
];

const DEFAULT_KONTAK: KontakSettingDto = {
  id: 0,
  judul: 'Kontak Administrator',
  subJudul: 'Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA',
  lokasi: 'Gedung Dekanat FKKH Universitas Nusa Cendana',
  email: 'fkkh@undana.ac.id',
  telepon: null,
  whatsApp: null,
  jamPelayanan: 'Senin - Jumat, 08:00 - 16:00 WITA',
  catatan: null,
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [mounted, setMounted] = useState(false);
  const [unregisteredModal, setUnregisteredModal] = useState<{ open: boolean; email?: string; message?: string }>({ open: false });
  const [showPanduanModal, setShowPanduanModal] = useState(false);
  const [panduanTab, setPanduanTab] = useState<'login' | 'faq'>('login');
  const [showContactModal, setShowContactModal] = useState(false);
  const [faqList, setFaqList] = useState<FaqItemDto[]>(DEFAULT_FAQ_LIST);
  const [kontakInfo, setKontakInfo] = useState<KontakSettingDto>(DEFAULT_KONTAK);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    // Check saved credentials
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }

    fetch('/api/user/google-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { clientId?: string } | null) => {
        if (data?.clientId) {
          setGoogleClientId(data.clientId);
        }
      })
      .catch(() => {
        // Non-fatal: tombol Google akan menampilkan pesan saat diklik jika config belum siap
      });

    Promise.all([
      pengaturanSistemApi.getFaqPublic().catch(() => null),
      pengaturanSistemApi.getKontak().catch(() => null),
    ]).then(([faqData, kontakData]) => {
      if (Array.isArray(faqData)) {
        setFaqList(faqData);
      }
      if (kontakData && kontakData.email) {
        setKontakInfo(kontakData);
      }
    });
  }, []);

  const handleGoogleLogin = () => {
    setError('');
    if (!googleClientId) {
      setError('Konfigurasi Google Login belum tersedia di server.');
      return;
    }
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) {
      setError('Layanan Google Sign-In sedang dimuat atau terblokir browser. Silakan muat ulang halaman.');
      return;
    }

    setIsGoogleLoading(true);
    const tokenClient = oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          setIsGoogleLoading(false);
          if (tokenResponse.error && tokenResponse.error !== 'access_denied') {
            setError(tokenResponse.error_description || 'Gagal otorisasi akun Google.');
          }
          return;
        }

        try {
          await loginWithGoogle(tokenResponse.access_token);
          navigate('/dashboard');
        } catch (err: unknown) {
          const apiErr = err as { status?: number; code?: string; email?: string; message?: string };
          if (apiErr?.status === 404 || apiErr?.code === 'ACCOUNT_NOT_REGISTERED') {
            setUnregisteredModal({
              open: true,
              email: apiErr.email,
              message: apiErr.message,
            });
          } else {
            setError(apiErr?.message || 'Gagal masuk menggunakan akun Google.');
          }
        } finally {
          setIsGoogleLoading(false);
        }
      },
      error_callback: () => {
        setIsGoogleLoading(false);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      await login(username.trim(), password);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username.trim());
      } else {
        localStorage.removeItem('rememberedUser');
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left Side - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary-900 via-primary-800 to-blue-900 relative items-center justify-center p-12">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/4 right-10 w-60 h-60 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className={`relative z-10 max-w-lg text-center transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Logo */}
          <div className="mb-6 inline-flex">
            {/*Update Logo*/}
            <div className="w-50 rounded-3xl flex items-center justify-center animate-bounce-gentle">
              <img className="h-40 object-cover ..." src={logo} />
            </div>
          </div>

          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            E-Scheduling
            <span className="block text-gradient text-3xl font-bold mt-2">FKKH UNDANA</span>
          </h1>
          <p className="text-blue-200/70 text-lg leading-relaxed mb-10">
            Sistem Penjadwalan FKKH Universitas Nusa Cendana
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left">
            {[
              { icon: <StethoscopeIcon className="w-6 h-6 text-blue-300" />, title: 'Manajemen Rotasi Klinis', desc: 'Sistematisasi rotasi stase Fakultas Kedokteran dan Kedokteran Hewan' },
              { icon: <MahasiswaIcon className="w-6 h-6 text-blue-300" />, title: 'E-Monitoring Akademik', desc: 'Pemantauan progress kelompok koas dan pembimbing secara terpadu' },
              { icon: <BookIcon className="w-6 h-6 text-blue-300" />, title: 'Transparansi Informasi', desc: 'Akses jadwal stase dan info klinis bagi seluruh civitas akademika' },
            ].map((feature, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                style={{ transitionDelay: `${(i + 1) * 200}ms` }}
              >
                <span className="mt-0.5 flex items-center justify-center shrink-0">{feature.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                  <p className="text-blue-200/50 text-xs mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-mesh opacity-30" />

        <div className={`w-full max-w-md relative z-10 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <img className="h-16 object-cover ..." src={logo} />
            </div>
            <h1 className="text-2xl font-bold text-primary-900">E-Scheduling FKKH</h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-primary-900 mb-2">Selamat Datang! 👋</h2>
            <p className="text-slate-500">Silakan masuk untuk melanjutkan ke dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-3 animate-scale-in shadow-sm">
              <InfoIcon className="w-5 h-5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Button (Opsi Atas) */}
          <button
            type="button"
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-semibold text-slate-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-soft hover:shadow active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            {isGoogleLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-slate-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memverifikasi Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">atau masuk dengan email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Login Form (Input Manual di Bawah) */}
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <UserIcon className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 
                    focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-glow-blue/20 
                    transition-all duration-300 text-sm"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <LockIcon className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 
                    focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-glow-blue/20 
                    transition-all duration-300 text-sm"
                  placeholder="Masukkan password Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  id="toggle-password"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer group" htmlFor="remember-me">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-2 border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                  Ingat saya
                </span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              id="btn-login"
              className="w-full bg-gradient-to-r from-primary-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 
                text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 
                shadow-elevated hover:shadow-glow-blue active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-elevated
                flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sedang masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <p className="text-xs text-slate-500 text-center">
              Butuh bantuan? Hubungi{' '}
              <button
                type="button"
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
                onClick={() => setShowContactModal(true)}
              >
                Administrator
              </button>{' '}
              atau baca{' '}
              <button
                type="button"
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
                onClick={() => {
                  setPanduanTab('login');
                  setShowPanduanModal(true);
                }}
              >
                Panduan Pengguna
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            © 2026 Universitas Nusa Cendana. All rights reserved.
          </p>
        </div>
      </div>

      {/* Modal Panduan Pengguna */}
      {showPanduanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/60 to-white">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-primary-900 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                  <BookIcon className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">Panduan Pengguna</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sistem Informasi E-Scheduling KOAS FKKH UNDANA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPanduanModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation (Panduan Login & FAQ) */}
            <div className="flex border-b border-slate-200/80 px-6 bg-slate-50/80 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPanduanTab('login')}
                className={`pb-3 px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  panduanTab === 'login'
                    ? 'border-primary-900 text-primary-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <LockIcon className="w-4 h-4" />
                <span>Panduan Login</span>
              </button>
              <button
                type="button"
                onClick={() => setPanduanTab('faq')}
                className={`pb-3 px-4 font-semibold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  panduanTab === 'faq'
                    ? 'border-primary-900 text-primary-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <InfoIcon className="w-4 h-4" />
                <span>FAQ (Tanya Jawab)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
              {panduanTab === 'login' ? (
                <div className="space-y-4">
                  {/* Cara 1: Login dengan Akun Google */}
                  <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-soft space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          <GoogleIcon className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">1. Masuk Menggunakan Akun Google</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Opsi Cepat & Praktis
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Anda dapat masuk langsung ke sistem E-Scheduling dalam satu kali klik menggunakan akun Google tanpa perlu mengetikkan password.
                    </p>

                    <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <span>⚠️ Ketentuan Email Google:</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Akun Google yang Anda gunakan <strong>harus merupakan email yang sudah terhubung (ter-connect) ke sistem SIADIKNONA</strong>. Data mahasiswa dan dosen di sistem ini tersinkronisasi otomatis dengan email yang terdaftar di SIADIKNONA.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Langkah Masuk:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li>Klik tombol <strong>"Masuk dengan Google"</strong> pada bagian atas halaman login.</li>
                        <li>Pilih akun Google Anda yang terhubung dengan akun SIADIKNONA.</li>
                        <li>Jika email terverifikasi sesuai, Anda akan langsung diarahkan ke Dashboard.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Cara 2: Login Manual dengan Email & Password */}
                  <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-soft space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4 text-slate-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">2. Masuk Manual dengan Email & Password</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Opsi Manual
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Bagi pengguna yang ingin masuk tanpa akun Google, Anda dapat menggunakan kombinasi <strong>Email</strong> terdaftar dan <strong>Password</strong> akun Anda.
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Langkah Masuk:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li>Ketikkan alamat <strong>Email</strong> Anda yang terdaftar pada sistem pada kolom input Email.</li>
                        <li>Ketikkan <strong>Password</strong> akun Anda pada kolom input Password.</li>
                        <li>Centang <strong>"Ingat saya"</strong> jika ingin menyimpan sesi login di perangkat ini.</li>
                        <li>Klik tombol <strong>"Masuk ke Dashboard →"</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab FAQ */
                <div className="space-y-3">
                  {faqList.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                      Belum ada daftar FAQ yang tersedia saat ini.
                    </div>
                  ) : (
                    faqList.map((item, idx) => (
                      <div key={item.id ?? idx} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1.5">
                        <p className="font-semibold text-xs sm:text-sm text-slate-800 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{item.pertanyaan}</span>
                        </p>
                        <p className="text-xs text-slate-600 pl-7 leading-relaxed whitespace-pre-line">
                          {item.jawaban}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPanduanModal(false);
                  setShowContactModal(true);
                }}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Butuh Bantuan Lain? Hubungi Admin</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPanduanModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kontak Administrator */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-scale-up">
            <div className="w-13 h-13 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary-900 shadow-soft">
              <UserIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{kontakInfo.judul || 'Kontak Administrator'}</h3>
            <p className="text-xs text-slate-500 mb-4">
              {kontakInfo.subJudul || 'Layanan Bantuan Sistem E-Scheduling KOAS FKKH UNDANA'}
            </p>

            <div className="bg-slate-50 rounded-2xl p-3.5 text-left text-xs space-y-2.5 border border-slate-100 mb-5">
              <div className="flex items-start gap-2.5">
                <MapPinIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lokasi Sekretariat</span>
                  <span className="text-slate-700 font-medium">{kontakInfo.lokasi}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MailIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Akademik</span>
                  <a href={`mailto:${kontakInfo.email}`} className="text-blue-600 font-medium font-mono hover:underline">
                    {kontakInfo.email}
                  </a>
                </div>
              </div>
              {kontakInfo.telepon && (
                <div className="flex items-start gap-2.5">
                  <PhoneIcon className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Telepon</span>
                    <span className="text-slate-700 font-medium">{kontakInfo.telepon}</span>
                  </div>
                </div>
              )}
              {kontakInfo.whatsApp && (() => {
                const digits = kontakInfo.whatsApp.replace(/\D/g, '');
                const waUrl = digits ? `https://wa.me/${digits.startsWith('0') ? `62${digits.slice(1)}` : digits}` : '';
                return (
                  <div className="flex items-start gap-2.5">
                    <PhoneIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">WhatsApp</span>
                      {waUrl ? (
                        <a href={waUrl} target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline">
                          {kontakInfo.whatsApp}
                        </a>
                      ) : (
                        <span className="text-slate-700 font-medium">{kontakInfo.whatsApp}</span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="flex items-start gap-2.5">
                <ClockIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Jam Pelayanan</span>
                  <span className="text-slate-700 font-medium">{kontakInfo.jamPelayanan}</span>
                </div>
              </div>
              {kontakInfo.catatan && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800">
                  {kontakInfo.catatan}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-primary-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Popup Akun Google Belum Terdaftar di Sistem */}
      {unregisteredModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-scale-up">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-soft">
              <GoogleIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Akun Belum Terdaftar</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {unregisteredModal.email ? (
                <>
                  Email <span className="font-semibold text-slate-800">{unregisteredModal.email}</span> belum terdaftar di sistem E-Scheduling FKKH UNDANA. Silakan hubungi administrator atau gunakan akun email yang sudah terdaftar.
                </>
              ) : (
                unregisteredModal.message || 'Akun Google Anda belum terdaftar di sistem E-Scheduling FKKH UNDANA. Silakan hubungi administrator.'
              )}
            </p>
            <button
              type="button"
              onClick={() => setUnregisteredModal({ open: false })}
              className="w-full py-3 bg-gradient-to-r from-primary-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
