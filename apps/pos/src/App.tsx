import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { PosLayout } from './layouts/PosLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { KdsLayout } from './layouts/KdsLayout';
import { LoginPage } from './views/auth/LoginPage';
import { PinLoginPage } from './views/auth/PinLoginPage';
import { PosPage } from './views/pos/PosPage';
import { TablesPage } from './views/tables/TablesPage';
import { KdsPage } from './views/kds/KdsPage';
import { WaiterDashboard } from './views/waiter/WaiterDashboard';
import { DashboardPage } from './views/admin/dashboard/DashboardPage';
import { MenuManagementPage } from './views/admin/menu-management/MenuManagementPage';
import { InventoryPage } from './views/admin/inventory/InventoryPage';
import { ReportsPage } from './views/admin/reports/ReportsPage';
import { UsersPage } from './views/admin/users/UsersPage';
import { CashRegisterPage } from './views/admin/cash-register/CashRegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pin" element={<PinLoginPage />} />

        {/* POS */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <PosLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PosPage />} />
          <Route path="tables" element={<TablesPage />} />
        </Route>

        {/* Waiter */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute>
              <PosLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WaiterDashboard />} />
        </Route>

        {/* KDS */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute>
              <KdsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<KdsPage />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="menu" element={<MenuManagementPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="cash-register" element={<CashRegisterPage />} />
        </Route>

        {/* Default */}
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
