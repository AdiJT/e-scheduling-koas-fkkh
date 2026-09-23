import { useState } from 'react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import NavbarProfile from './NavbarProfile';
import logoUndana from '../assets/logo_undana.png';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 bg-mesh print:bg-white print:bg-none print:min-h-0">
      <div className="print:hidden">
        <Sidebar 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-primary-900 text-white px-4 py-3 print:hidden sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/10 p-0.5">
            <img className="w-full h-full object-contain" src={logoUndana} alt="Logo Undana" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">E-Scheduling</h1>
            <p className="text-[10px] text-white/70">FKKH Universitas Nusa Cendana</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-slate-800">
            <NotificationBell />
          </div>
          <div className="text-slate-800">
            <NavbarProfile />
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 -mr-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} print:ml-0 flex flex-col min-h-screen`}>
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sistem Informasi Penjadwalan Koas
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <NavbarProfile />
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 print:p-0 animate-fade-in-up w-full overflow-x-hidden flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
