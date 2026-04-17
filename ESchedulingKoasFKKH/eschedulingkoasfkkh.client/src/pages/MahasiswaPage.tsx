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

export default function MahasiswaPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader 
          title="Kelola Mahasiswa" 
          description="Tambah, edit, atau hapus data mahasiswa"
          icon="👨‍🎓"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Button */}
          <div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
              + Tambah Mahasiswa
            </button>
          </div>
        </div>

        {/* Table/List Section */}
        <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Belum ada data mahasiswa</p>
            <p className="text-sm text-gray-400 mt-1">Mulai dengan menambah mahasiswa baru</p>
          </div>
        </div>
      </main>
    </div>
  );
}
