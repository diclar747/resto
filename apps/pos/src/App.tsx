import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { getRoleDefaultPath } from './utils/role-routing';
import { RoleGuard } from './components/RoleGuard';

// Layouts
import { PosLayout } from './layouts/PosLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { KdsLayout } from './layouts/KdsLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { CashierLayout } from './layouts/CashierLayout';
import { DeliveryLayout } from './layouts/DeliveryLayout';

// Auth
import { LoginPage } from './views/auth/LoginPage';
import { PinLoginPage } from './views/auth/PinLoginPage';

// POS
import { PosPage } from './views/pos/PosPage';
import { TablesPage } from './views/tables/TablesPage';

// Waiter
import { WaiterDashboard } from './views/waiter/WaiterDashboard';

// KDS
import { KdsPage } from './views/kds/KdsPage';

// Admin
import { DashboardPage } from './views/admin/dashboard/DashboardPage';
import { MenuManagementPage } from './views/admin/menu-management/MenuManagementPage';
import { InventoryPage } from './views/admin/inventory/InventoryPage';
import { ReportsPage } from './views/admin/reports/ReportsPage';
import { UsersPage } from './views/admin/users/UsersPage';
import { CashRegisterPage } from './views/admin/cash-register/CashRegisterPage';
import { SettingsPage } from './views/admin/settings/SettingsPage';

// Super Admin
import { SuperAdminDashboard } from './views/superadmin/SuperAdminDashboard';
import { RestaurantsPage } from './views/superadmin/RestaurantsPage';
import { SuperAdminUsersPage } from './views/superadmin/SuperAdminUsersPage';
import { GlobalReportsPage } from './views/superadmin/GlobalReportsPage';
import { AuditLogPage } from './views/superadmin/AuditLogPage';

// Manager
import { ManagerDashboard } from './views/manager/ManagerDashboard';

// Cashier
import { CashierDashboard } from './views/cashier/CashierDashboard';

// Delivery
import { DeliveryDashboard } from './views/delivery/DeliveryDashboard';
import { DeliveryDetailPage } from './views/delivery/DeliveryDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleDefaultPath(user?.role || '')} replace />;
}

function AdminDashboardRouter() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'manager') return <ManagerDashboard />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pin" element={<PinLoginPage />} />

        {/* Super Admin */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['superadmin']}>
                <SuperAdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="users" element={<SuperAdminUsersPage />} />
          <Route path="reports" element={<GlobalReportsPage />} />
          <Route path="audit" element={<AuditLogPage />} />
        </Route>

        {/* Admin / Manager */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'manager']}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardRouter />} />
          <Route path="menu" element={<MenuManagementPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="cash-register" element={<CashRegisterPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Cashier */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'cashier']}>
                <CashierLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<CashierDashboard />} />
          <Route path="register" element={<CashRegisterPage />} />
        </Route>

        {/* POS (accessible to admin, manager, cashier, waiter) */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'manager', 'cashier', 'waiter']}>
                <PosLayout />
              </RoleGuard>
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
              <RoleGuard allowedRoles={['admin', 'waiter']}>
                <PosLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<WaiterDashboard />} />
        </Route>

        {/* KDS / Kitchen */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'kitchen']}>
                <KdsLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<KdsPage />} />
        </Route>

        {/* Delivery */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin', 'driver']}>
                <DeliveryLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<DeliveryDashboard />} />
          <Route path="history" element={<DeliveryDashboard />} />
          <Route path=":id" element={<DeliveryDetailPage />} />
        </Route>

        {/* Default - Role-based redirect */}
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
