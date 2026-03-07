export const RoleName = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  DRIVER: 'driver',
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const Permission = {
  // Orders
  ORDERS_CREATE: 'orders.create',
  ORDERS_VIEW: 'orders.view',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_VOID: 'orders.void',
  ORDERS_DISCOUNT: 'orders.discount',

  // Tables
  TABLES_VIEW: 'tables.view',
  TABLES_MANAGE: 'tables.manage',

  // KDS
  KDS_VIEW: 'kds.view',
  KDS_UPDATE: 'kds.update',

  // Menu
  MENU_VIEW: 'menu.view',
  MENU_MANAGE: 'menu.manage',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',

  // Cash Register
  CASH_VIEW: 'cash.view',
  CASH_MANAGE: 'cash.manage',

  // Users
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',

  // Reports
  REPORTS_VIEW: 'reports.view',

  // CRM
  CRM_VIEW: 'crm.view',
  CRM_MANAGE: 'crm.manage',

  // Promotions
  PROMOTIONS_VIEW: 'promotions.view',
  PROMOTIONS_MANAGE: 'promotions.manage',

  // Delivery
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_MANAGE: 'delivery.manage',

  // Suppliers
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_MANAGE: 'suppliers.manage',

  // Branches
  BRANCHES_MANAGE: 'branches.manage',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const RolePermissions: Record<RoleName, Permission[]> = {
  admin: Object.values(Permission) as Permission[],
  manager: [
    Permission.ORDERS_CREATE, Permission.ORDERS_VIEW, Permission.ORDERS_EDIT, Permission.ORDERS_VOID, Permission.ORDERS_DISCOUNT,
    Permission.TABLES_VIEW, Permission.TABLES_MANAGE,
    Permission.KDS_VIEW, Permission.KDS_UPDATE,
    Permission.MENU_VIEW, Permission.MENU_MANAGE,
    Permission.INVENTORY_VIEW, Permission.INVENTORY_MANAGE,
    Permission.CASH_VIEW, Permission.CASH_MANAGE,
    Permission.USERS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.CRM_VIEW, Permission.CRM_MANAGE,
    Permission.PROMOTIONS_VIEW, Permission.PROMOTIONS_MANAGE,
    Permission.DELIVERY_VIEW, Permission.DELIVERY_MANAGE,
    Permission.SUPPLIERS_VIEW, Permission.SUPPLIERS_MANAGE,
  ],
  cashier: [
    Permission.ORDERS_CREATE, Permission.ORDERS_VIEW, Permission.ORDERS_EDIT, Permission.ORDERS_DISCOUNT,
    Permission.TABLES_VIEW,
    Permission.CASH_VIEW, Permission.CASH_MANAGE,
    Permission.CRM_VIEW,
  ],
  waiter: [
    Permission.ORDERS_CREATE, Permission.ORDERS_VIEW, Permission.ORDERS_EDIT,
    Permission.TABLES_VIEW, Permission.TABLES_MANAGE,
    Permission.MENU_VIEW,
  ],
  kitchen: [
    Permission.KDS_VIEW, Permission.KDS_UPDATE,
    Permission.ORDERS_VIEW,
  ],
  driver: [
    Permission.DELIVERY_VIEW, Permission.DELIVERY_MANAGE,
    Permission.ORDERS_VIEW,
  ],
};
