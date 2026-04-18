import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
  gradient: string;
  shadowColor: string;
}

interface StatCard {
  label: string;
  value: string;
  icon: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  gradient: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'mahasiswa',
    label: 'Kelola Mahasiswa',
    icon: '👨‍🎓',
    path: '/mahasiswa',
    description: 'Kelola data mahasiswa KOAS',
    gradient: 'from-blue-500 to-blue-600',
    shadowColor: 'shadow-glow-blue',
  },
  {
    id: 'dosen',
    label: 'Kelola Dosen',
    icon: '👨‍🏫',
    path: '/dosen',
    description: 'Kelola data dosen pembimbing',
    gradient: 'from-emerald-500 to-green-600',
    shadowColor: 'shadow-glow-green',
  },
  {
    id: 'stase',
    label: 'Kelola Stase',
    icon: '🏥',
    path: '/stase',
    description: 'Kelola rotasi klinik',
    gradient: 'from-purple-500 to-purple-600',
    shadowColor: 'shadow-glow-purple',
  },
  {
    id: 'kelompok',
    label: 'Kelola Kelompok',
    icon: '👥',
    path: '/kelompok',
    description: 'Kelola kelompok mahasiswa',
    gradient: 'from-orange-500 to-orange-600',
    shadowColor: 'shadow-glow-orange',
  },
  {
    id: 'jadwal',
    label: 'Kelola Jadwal',
    icon: '📅',
    path: '/jadwal',
    description: 'Generate & kelola jadwal',
    gradient: 'from-rose-500 to-red-600',
    shadowColor: 'shadow-glow-red',
  },
];

const statCards: StatCard[] = [
  { label: 'Total Mahasiswa', value: '156', icon: '👨‍🎓', change: '+12 bulan ini', changeType: 'up', gradient: 'from-blue-500 to-blue-600' },
  { label: 'Total Dosen', value: '24', icon: '👨‍🏫', change: '+2 bulan ini', changeType: 'up', gradient: 'from-emerald-500 to-green-600' },
  { label: 'Total Stase', value: '8', icon: '🏥', change: 'Stabil', changeType: 'neutral', gradient: 'from-purple-500 to-purple-600' },
  { label: 'Kelompok', value: '12', icon: '👥', change: '+3 bulan ini', changeType: 'up', gradient: 'from-orange-500 to-orange-600' },
];

const recentActivities = [
  { action: 'Jadwal Stase Bedah diperbarui', time: '2 menit lalu', icon: '📅', color: 'bg-blue-100 text-blue-600' },
  { action: 'Mahasiswa baru ditambahkan: Ahmad Fauzi', time: '15 menit lalu', icon: '👨‍🎓', color: 'bg-green-100 text-green-600' },
  { action: 'Kelompok 5 telah dibentuk', time: '1 jam lalu', icon: '👥', color: 'bg-orange-100 text-orange-600' },
  { action: 'Dosen Dr. Siti ditugaskan ke Stase Penyakit Dalam', time: '3 jam lalu', icon: '👨‍🏫', color: 'bg-purple-100 text-purple-600' },
  { action: 'Jadwal mingguan berhasil di-generate', time: '5 jam lalu', icon: '⚡', color: 'bg-cyan-100 text-cyan-600' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900 mb-1">
              {getGreeting()}, {user?.username || 'Admin'}! 👋
            </h1>
            <p className="text-slate-500">Berikut ringkasan sistem E-Scheduling KOAS hari ini</p>
          </div>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-soft border border-slate-100">
            <span className="text-lg">📅</span>
            <span className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 shadow-card border border-slate-100/80 hover:shadow-elevated transition-all duration-300 group animate-fade-in-up cursor-default"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                stat.changeType === 'up' ? 'bg-green-100 text-green-700' :
                stat.changeType === 'down' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-primary-900 mb-1">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
          Menu Utama
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              id={`menu-${item.id}`}
              onClick={() => navigate(item.path)}
              className={`group relative bg-white rounded-2xl p-5 border border-slate-100/80 
                shadow-card hover:shadow-elevated hover:-translate-y-1 
                transition-all duration-300 text-left animate-fade-in-up overflow-hidden`}
              style={{ animationDelay: `${(index + 4) * 80}ms` }}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 group-hover:${item.shadowColor} transition-all duration-300`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-primary-900 mb-1 group-hover:text-blue-700 transition-colors">{item.label}</h3>
              <p className="text-xs text-slate-400">{item.description}</p>
              <span className="absolute bottom-4 right-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 text-lg">
                →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-slate-100/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
              Aktivitas Terbaru
            </h2>
            <button className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
              Lihat Semua →
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivities.map((activity, index) => (
              <div key={index} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${activity.color} flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium truncate">{activity.action}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <div className="space-y-4">
          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-card border border-slate-100/80 p-5">
            <h3 className="text-sm font-bold text-primary-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
              Status Sistem
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Server', status: 'Online', color: 'bg-green-500' },
                { label: 'Database', status: 'Connected', color: 'bg-green-500' },
                { label: 'API', status: 'Active', color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="flex items-center gap-2 text-xs font-medium text-green-600">
                    <span className={`w-2 h-2 rounded-full ${item.color} animate-pulse-slow`} />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-gradient-to-br from-primary-900 to-blue-800 rounded-2xl shadow-dark p-5 text-white">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Jadwal Mendatang
            </h3>
            <div className="space-y-3">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-sm font-medium">Stase Bedah - Kelompok 3</p>
                <p className="text-xs text-blue-200/60 mt-1">Senin, 21 April 2026</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-sm font-medium">Stase Penyakit Dalam - Kelompok 1</p>
                <p className="text-xs text-blue-200/60 mt-1">Selasa, 22 April 2026</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/jadwal')} 
              className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-all border border-white/10 hover:border-white/20"
            >
              Lihat Semua Jadwal →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
