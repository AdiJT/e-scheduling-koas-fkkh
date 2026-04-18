import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 bg-mesh">
      <Sidebar />
      <div className="ml-64 transition-all duration-300">
        <main className="p-6 lg:p-8 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
