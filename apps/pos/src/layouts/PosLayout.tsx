import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
  ShoppingCart, Grid3X3, UtensilsCrossed, LayoutDashboard, LogOut, ChefHat, User
} from 'lucide-react';

export function PosLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-6 py-4">
        <div className="card-glass flex items-center justify-between !py-3 !px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-2xl flex items-center justify-center shadow-[0px_4px_12px_rgba(0,74,173,0.3)]">
                <UtensilsCrossed className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-black tracking-tight text-[var(--secondary)]">
                Resto<span className="text-[var(--primary)]">POS</span>
              </h1>
            </div>

            <nav className="flex gap-2">
              <NavItem to="/pos" icon={<ShoppingCart size={18} />} label="Venta" end />
              <NavItem to="/pos/tables" icon={<Grid3X3 size={18} />} label="Mesas" />
              <NavItem to="/waiter" icon={<UtensilsCrossed size={18} />} label="Camarero" />
              <NavItem to="/kds" icon={<ChefHat size={18} />} label="Cocina" />
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <NavItem to="/admin" icon={<LayoutDashboard size={18} />} label="Panel" />
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/50 rounded-2xl border border-white/50">
              <div className="w-8 h-8 bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-main)] leading-none">{user?.firstName}</span>
                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-[var(--error)] hover:bg-[var(--error)] hover:text-white transition-all duration-300 shadow-sm group"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-6 pb-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, end = false }: { to: string, icon: React.ReactNode, label: string, end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
          isActive 
            ? 'bg-[var(--primary)] text-white shadow-[0px_4px_12px_rgba(0,74,173,0.2)] scale-[1.02]' 
            : 'text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-white/50'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
