import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
  ShoppingCart, Grid3X3, UtensilsCrossed, LayoutDashboard, LogOut, ChefHat, Bell
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
      {/* Top bar — hidden on mobile, shown on md+ */}
      <header className="hidden md:block sticky top-0 z-50 px-4 pt-3 pb-2">
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
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin') && (
                <NavItem to="/admin" icon={<LayoutDashboard size={17} />} label="Panel" />
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:bg-primary/5 hover:text-primary transition-all relative">
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-primary/20">
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-sm font-black text-secondary leading-none">{user?.firstName}</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.role}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all duration-300 group"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar — shown only on mobile */}
      <header className="md:hidden sticky top-0 z-50 px-3 pt-2 pb-1.5">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg rounded-2xl flex items-center justify-between py-2 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
              <UtensilsCrossed className="text-white" size={16} />
            </div>
            <h1 className="text-lg font-black tracking-tight text-secondary">
              Resto<span className="text-primary italic">POS</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-black text-[10px]">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg bg-error/10 text-error">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-3 md:px-4 pb-20 md:pb-4">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1.5">
          <BottomNavItem to="/pos" icon={<ShoppingCart size={20} />} label="Venta" end />
          <BottomNavItem to="/pos/tables" icon={<Grid3X3 size={20} />} label="Mesas" />
          <BottomNavItem to="/waiter" icon={<UtensilsCrossed size={20} />} label="Camarero" />
          <BottomNavItem to="/kds" icon={<ChefHat size={20} />} label="Cocina" />
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin') && (
            <BottomNavItem to="/admin" icon={<LayoutDashboard size={20} />} label="Panel" />
          )}
        </div>
      </nav>
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

function BottomNavItem({ to, icon, label, end = false }: { to: string, icon: React.ReactNode, label: string, end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
          isActive
            ? 'text-primary'
            : 'text-gray-400'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
