import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
  ShoppingCart, Grid3X3, UtensilsCrossed, LayoutDashboard, LogOut, ChefHat, User, Bell
} from 'lucide-react';

export function PosLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-4 pt-3 pb-2">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg rounded-2xl flex items-center justify-between py-2.5 px-5">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 rotate-2">
                <UtensilsCrossed className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-black tracking-tight text-secondary">
                Resto<span className="text-primary italic">POS</span>
              </h1>
            </div>

            {/* Nav */}
            <nav className="flex gap-1.5">
              <NavItem to="/pos" icon={<ShoppingCart size={17} />} label="Venta" end />
              <NavItem to="/pos/tables" icon={<Grid3X3 size={17} />} label="Mesas" />
              <NavItem to="/waiter" icon={<UtensilsCrossed size={17} />} label="Camarero" />
              <NavItem to="/kds" icon={<ChefHat size={17} />} label="Cocina" />
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <NavItem to="/admin" icon={<LayoutDashboard size={17} />} label="Panel" />
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification */}
            <button className="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:bg-primary/5 hover:text-primary transition-all relative">
              <Bell size={18} />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-primary/20">
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-black text-secondary leading-none">{user?.firstName}</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.role}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-300 group"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-4 pb-4">
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
        `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
          isActive
            ? 'bg-primary text-white shadow-md shadow-primary/25'
            : 'text-text-secondary hover:text-primary hover:bg-primary/5'
        }`
      }
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </NavLink>
  );
}
