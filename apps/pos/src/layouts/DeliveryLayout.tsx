import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { LayoutDashboard, Clock, LogOut, Bike } from 'lucide-react';

const tabs = [
  { to: '/delivery', icon: LayoutDashboard, label: 'Entregas', end: true },
  { to: '/delivery/history', icon: Clock, label: 'Historial' },
];

export function DeliveryLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F4F7FE]">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 rotate-3">
            <Bike className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-secondary tracking-tight leading-none">Resto<span className="text-purple-600 italic">Delivery</span></h1>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">
              {user?.firstName || 'Repartidor'} {user?.lastName}
            </p>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Outlet />
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-around shrink-0 safe-bottom">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all ${isActive
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
