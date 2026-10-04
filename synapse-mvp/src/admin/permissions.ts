import type { AppPath } from '../app/routes';
import type { AuthRole } from '../auth/session';

export type StaffCapability =
  | 'userManagement'
  | 'supportTickets'
  | 'usageStatistics'
  | 'moderation'
  | 'adminManagement'
  | 'adminAudit'
  | 'themePublish'
  | 'systemPermissions';

const CAPABILITIES: Record<StaffCapability, ReadonlySet<AuthRole>> = {
  userManagement: new Set(['admin', 'superadmin']),
  supportTickets: new Set(['admin', 'superadmin']),
  usageStatistics: new Set(['admin', 'superadmin']),
  moderation: new Set(['admin', 'superadmin']),
  adminManagement: new Set(['superadmin']),
  adminAudit: new Set(['superadmin']),
  themePublish: new Set(['superadmin']),
  systemPermissions: new Set(['superadmin']),
};

export function canUse(role: AuthRole, capability: StaffCapability): boolean {
  return CAPABILITIES[capability].has(role);
}

export function canOpenAdmin(role: AuthRole): boolean {
  return role === 'admin';
}

export function canOpenSuperadmin(role: AuthRole): boolean {
  return role === 'superadmin';
}

export function dashboardPathForRole(role: AuthRole): AppPath {
  if (role === 'superadmin') return '/superadmin';
  if (role === 'admin') return '/admin';
  return '/edit';
}

export function canOpenPath(path: string, role: AuthRole): boolean {
  if (path === '/admin') return canOpenAdmin(role);
  if (path === '/superadmin') return canOpenSuperadmin(role);
  if (path === '/listen' || path.startsWith('/listen/')) return true;
  return (
    path === '/edit' ||
    path === '/settings' ||
    path === '/profile'
  );
}
