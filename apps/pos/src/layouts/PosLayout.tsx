import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import {
  ShoppingCart, Grid3X3, UtensilsCrossed, LayoutDashboard, LogOut, ChefHat, Users,
} from 'lucide-react';

export function PosLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-blue-600">Restaurante POS</h1>
          <nav className="flex gap-1">
            <NavLink
              to="/pos"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <ShoppingCart size={18} /> Venta
            </NavLink>
            <NavLink
              to="/pos/tables"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Grid3X3 size={18} /> Mesas
            </NavLink>
            <NavLink
              to="/waiter"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <UtensilsCrossed size={18} /> Camarero
            </NavLink>
            <NavLink
              to="/kds"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <ChefHat size={18} /> Cocina
            </NavLink>
            {user?.role === 'admin' || user?.role === 'manager' ? (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <LayoutDashboard size={18} /> Admin
              </NavLink>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{user?.email}</span>
            <span className="ml-2 badge bg-blue-100 text-blue-700">{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost p-2 text-gray-500 hover:text-red-600">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
