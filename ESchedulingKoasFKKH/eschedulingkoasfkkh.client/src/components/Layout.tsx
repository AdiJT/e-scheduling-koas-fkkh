import { useState } from 'react';
import Sidebar from './Sidebar';

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
      <div className="md:hidden flex items-center justify-between bg-primary-900 text-white p-4 print:hidden sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-sm font-bold shadow-glow-blue flex-shrink-0">
              ES
            </div>
            <h1 className="text-sm font-bold tracking-tight">E-Scheduling</h1>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      <div className={`transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} print:ml-0`}>
        <main className="p-4 md:p-6 lg:p-8 print:p-0 animate-fade-in-up w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
