export interface DecorationDef {
  id: string;
  name: string;
  description: string;
  cssClass: string;
}

export const DECORATION_CATALOG: DecorationDef[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard profile frame.',
    cssClass: 'synapse-deco-default',
  },
  {
    id: 'one_month',
    name: 'One Month',
    description: 'Unlocked with the One Month badge.',
    cssClass: 'synapse-deco-one-month',
  },
  {
    id: 'one_year',
    name: 'One Year',
    description: 'Unlocked with the One Year badge.',
    cssClass: 'synapse-deco-one-year',
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Unlocked after publishing a Workshop creation.',
    cssClass: 'synapse-deco-creator',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Staff decoration for Admins.',
    cssClass: 'synapse-deco-admin',
  },
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'Staff decoration for the owner.',
    cssClass: 'synapse-deco-superadmin',
  },
];

const BY_ID = new Map(DECORATION_CATALOG.map((item) => [item.id, item]));

export function decorationDef(id: string | null | undefined): DecorationDef {
  return BY_ID.get(id || '') || DECORATION_CATALOG[0];
}

export function decorationClass(id: string | null | undefined): string {
  return `synapse-deco ${decorationDef(id).cssClass}`;
}
