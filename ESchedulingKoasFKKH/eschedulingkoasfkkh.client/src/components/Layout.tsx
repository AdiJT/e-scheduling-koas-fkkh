import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 bg-mesh print:bg-white print:bg-none print:min-h-0">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="ml-64 print:ml-0 transition-all duration-300">
        <main className="p-6 lg:p-8 print:p-0 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
