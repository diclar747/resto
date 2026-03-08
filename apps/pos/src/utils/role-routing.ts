export function getRoleDefaultPath(role: string): string {
  const routes: Record<string, string> = {
    superadmin: '/superadmin',
    admin: '/admin',
    manager: '/admin',
    cashier: '/cashier',
    waiter: '/waiter',
    kitchen: '/kds',
    driver: '/delivery',
  };
  return routes[role] || '/pos';
}
