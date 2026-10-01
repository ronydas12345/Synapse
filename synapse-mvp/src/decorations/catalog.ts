export type DecorationOrnament = 'none' | 'ring' | 'laurel' | 'star' | 'crown';

export interface DecorationDef {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  ornament: DecorationOrnament;
}

export const DECORATION_CATALOG: DecorationDef[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard profile frame.',
    cssClass: 'synapse-deco-default',
    ornament: 'none',
  },
  {
    id: 'one_month',
    name: 'One Month',
    description: 'Silver ring unlocked with the One Month badge.',
    cssClass: 'synapse-deco-one-month',
    ornament: 'ring',
  },
  {
    id: 'one_year',
    name: 'One Year',
    description: 'Gold filigree unlocked with the One Year badge.',
    cssClass: 'synapse-deco-one-year',
    ornament: 'ring',
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Laurel wreath unlocked after publishing a Workshop creation.',
    cssClass: 'synapse-deco-creator',
    ornament: 'laurel',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Staff star for Admins.',
    cssClass: 'synapse-deco-admin',
    ornament: 'star',
  },
  {
    id: 'superadmin',
    name: 'Superuser',
    description: 'Owner crown for the Superadmin account.',
    cssClass: 'synapse-deco-superadmin',
    ornament: 'crown',
  },
];

const BY_ID = new Map(DECORATION_CATALOG.map((item) => [item.id, item]));

export function decorationDef(id: string | null | undefined): DecorationDef {
  return BY_ID.get(id || '') || DECORATION_CATALOG[0];
}

export function decorationClass(id: string | null | undefined): string {
  return `synapse-deco ${decorationDef(id).cssClass}`;
}

export function nameplateClass(id: string | null | undefined): string {
  const key = decorationDef(id).id;
  if (key === 'superadmin') return 'synapse-nameplate synapse-nameplate-superuser';
  if (key === 'admin') return 'synapse-nameplate synapse-nameplate-admin';
  if (key === 'creator') return 'synapse-nameplate synapse-nameplate-creator';
  if (key === 'one_year') return 'synapse-nameplate synapse-nameplate-gold';
  return '';
}

export function decorationFromRole(role: string | null | undefined): string {
  if (role === 'superadmin') return 'superadmin';
  if (role === 'admin') return 'admin';
  return 'default';
}
