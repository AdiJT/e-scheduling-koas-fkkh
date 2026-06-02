/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    // Check saved credentials
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      await login(username, password);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login gagal. Silakan coba lagi.');
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
          <div className="mb-8 inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-glow-blue animate-bounce-gentle">
              <span className="text-4xl font-black text-white">ES</span>
            </div>
          </div>

          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            E-Scheduling
            <span className="block text-gradient text-3xl font-bold mt-2">KOAS PPDH</span>
          </h1>
          <p className="text-blue-200/70 text-lg leading-relaxed mb-10">
            Sistem Penjadwalan Koas Otomatis untuk program Pendidikan Profesi Dokter Hewan
          </p>

          {/* Feature highlights */}
          <div className="space-y-4 text-left">
            {[
              { icon: '⚡', title: 'Penjadwalan Otomatis', desc: 'Generate jadwal stase otomatis' },
              { icon: '📊', title: 'Dashboard Interaktif', desc: 'Monitor data mahasiswa dan dosen real-time' },
              { icon: '🔒', title: 'Aman & Terpercaya', desc: 'Data terenkripsi dan akses terkontrol' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-700 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                style={{ transitionDelay: `${(i + 1) * 200}ms` }}
              >
                <span className="text-2xl mt-0.5">{feature.icon}</span>
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-900 to-blue-800 flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
              <span className="text-2xl font-black text-white">ES</span>
            </div>
            <h1 className="text-2xl font-bold text-primary-900">E-Scheduling KOAS</h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary-900 mb-2">Selamat Datang! 👋</h2>
            <p className="text-slate-500">Silakan masuk untuk melanjutkan ke dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-3 animate-scale-in shadow-sm">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  👤
                </span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 
                    focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-glow-blue/20 
                    transition-all duration-300 text-sm"
                  placeholder="Masukkan username Anda"
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
                  🔒
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
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
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
              <button
                type="button"
                className="text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors hover:underline"
                id="forgot-password"
                onClick={() => alert('Fitur reset password akan segera hadir!')}
              >
                Lupa Password?
              </button>
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

          {/* Divider */}
          {/*<div className="flex items-center gap-3 my-6">*/}
          {/*  <div className="flex-1 h-px bg-slate-200" />*/}
          {/*  <span className="text-xs text-slate-400 font-medium">atau</span>*/}
          {/*  <div className="flex-1 h-px bg-slate-200" />*/}
          {/*</div>*/}

          {/* SSO Button (decorative) */}
          {/*<button*/}
          {/*  type="button"*/}
          {/*  className="w-full py-3 px-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-600 */}
          {/*    hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 */}
          {/*    flex items-center justify-center gap-3 shadow-soft"*/}
          {/*  onClick={() => alert('SSO Login akan segera tersedia!')}*/}
          {/*  id="btn-sso"*/}
          {/*>*/}
          {/*  <span className="text-lg">🏫</span>*/}
          {/*  Masuk dengan SSO Universitas*/}
          {/*</button>*/}

          {/* Help Section */}
          <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <p className="text-xs text-slate-500 text-center">
              Butuh bantuan? Hubungi{' '}
              <button className="text-blue-500 font-medium hover:underline" onClick={() => alert('Fitur hubungi admin akan segera hadir!')}>
                Administrator
              </button>{' '}
              atau baca{' '}
              <button className="text-blue-500 font-medium hover:underline" onClick={() => alert('Panduan pengguna akan segera hadir!')}>
                Panduan Pengguna
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            © 2026 E-Scheduling KOAS PPDH. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
