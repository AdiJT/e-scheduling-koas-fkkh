import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: string;
}

function PageHeader({ title, description, icon }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-gray-200 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          ← Kembali
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </header>
  );
}

export default function JadwalPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title="Kelola Jadwal" 
          description="Buat dan kelola jadwal stase untuk kelompok mahasiswa"
          icon="📅"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Button */}
          <div>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition">
              🤖 Generate Jadwal Otomatis
            </button>
          </div>
          {/* Add Manual Button */}
          <div>
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition">
              + Tambah Jadwal Manual
            </button>
          </div>
        </div>

        {/* Calendar/Schedule Section */}
        <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Belum ada jadwal yang dibuat</p>
            <p className="text-sm text-gray-400 mt-1">Generate jadwal otomatis atau tambah jadwal secara manual</p>
          </div>
        </div>
      </main>
    </div>
  );
}
