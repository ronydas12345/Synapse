import { describe, expect, it } from 'vitest';
import {
  canOpenAdmin,
  canOpenPath,
  canOpenSuperadmin,
  canUse,
  dashboardPathForRole,
} from './permissions';

describe('staff permissions', () => {
  it('keeps admin tools away from superadmin-only modules', () => {
    expect(canUse('admin', 'userManagement')).toBe(true);
    expect(canUse('admin', 'supportTickets')).toBe(true);
    expect(canUse('admin', 'adminManagement')).toBe(false);
    expect(canUse('admin', 'adminAudit')).toBe(false);
    expect(canUse('admin', 'themePublish')).toBe(false);
    expect(canUse('admin', 'systemPermissions')).toBe(false);
    expect(canUse('superadmin', 'adminManagement')).toBe(true);
    expect(canUse('user', 'userManagement')).toBe(false);
  });

  it('routes staff to separate dashboards', () => {
    expect(dashboardPathForRole('user')).toBe('/edit');
    expect(dashboardPathForRole('admin')).toBe('/admin');
    expect(dashboardPathForRole('superadmin')).toBe('/superadmin');
    expect(canOpenAdmin('admin')).toBe(true);
    expect(canOpenAdmin('superadmin')).toBe(false);
    expect(canOpenAdmin('user')).toBe(false);
    expect(canOpenSuperadmin('admin')).toBe(false);
    expect(canOpenSuperadmin('superadmin')).toBe(true);
    expect(canOpenPath('/superadmin', 'admin')).toBe(false);
    expect(canOpenPath('/admin', 'superadmin')).toBe(false);
    expect(canOpenPath('/edit', 'admin')).toBe(true);
  });
});
