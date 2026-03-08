import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, DollarSign,
  ArrowLeft, LogOut, User
} from 'lucide-react';

const navItems = [
  { to: '/cashier', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { to: '/pos/tables', icon: Grid3X3, label: 'Mesas' },
  { to: '/cashier/register', icon: DollarSign, label: 'Caja' },
];

export function CashierLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex bg-[#F4F7FE] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col z-20 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-3">
              <span className="text-white font-black text-xl italic">R</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-secondary tracking-tight leading-none">Resto<span className="text-primary italic">POS</span></h1>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">Cajero</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-50 mx-6 mb-6 opacity-50" />

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-300 group ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-text-secondary hover:text-secondary hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} className="group-hover:scale-110 transition-transform" />
              <span className="uppercase tracking-[0.05em]">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-gray-50 rounded-[32px] p-5 space-y-3">
            <button
              onClick={() => navigate('/pos')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-secondary hover:bg-white hover:shadow-sm transition-all uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Ir al POS
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-widest"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
          <div className="mt-6 flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <User className="text-gray-500" size={20} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-secondary truncate uppercase">{user?.firstName || 'Cajero'} {user?.lastName}</p>
              <p className="text-[10px] font-bold text-text-secondary truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
