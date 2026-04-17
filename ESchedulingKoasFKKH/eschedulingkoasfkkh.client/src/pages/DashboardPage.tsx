import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
  color: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'mahasiswa',
    label: 'Kelola Mahasiswa',
    icon: '👨‍🎓',
    path: '/mahasiswa',
    description: 'Manage student data',
    color: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'dosen',
    label: 'Kelola Dosen',
    icon: '👨‍🏫',
    path: '/dosen',
    description: 'Manage instructor data',
    color: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'stase',
    label: 'Kelola Stase',
    icon: '🏥',
    path: '/stase',
    description: 'Manage rotation stages',
    color: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    id: 'kelompok',
    label: 'Kelola Kelompok',
    icon: '👥',
    path: '/kelompok',
    description: 'Manage student groups',
    color: 'bg-orange-50 hover:bg-orange-100',
  },
  {
    id: 'jadwal',
    label: 'Kelola Jadwal',
    icon: '📅',
    path: '/jadwal',
    description: 'Manage schedules',
    color: 'bg-red-50 hover:bg-red-100',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">E-Scheduling Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Sistem Penjadwalan Koas Otomatis - FKKH</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Selamat datang,</p>
              <p className="text-sm text-gray-600">{user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Menu Utama</h2>
          <p className="text-gray-600">Pilih menu untuk mengelola data sistem</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`p-6 rounded-xl border border-gray-200 transition duration-300 transform hover:scale-105 hover:shadow-lg ${item.color}`}
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.label}</h3>
              <p className="text-xs text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Mahasiswa</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Dosen</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Stase</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Kelompok</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
