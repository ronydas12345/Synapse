export type BadgeCategory = 'account' | 'creator' | 'community' | 'staff';
export type BadgeTier = 1 | 2 | 3 | 4 | 5;

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
}

export const BADGE_CATALOG: BadgeDef[] = [
  {
    id: 'first_creation',
    name: 'First Creation',
    description: 'Published your first creation to the Synapse Workshop.',
    category: 'creator',
    tier: 1,
  },
  {
    id: 'uploads_10',
    name: '10 Uploads',
    description: 'Published 10 public Workshop creations.',
    category: 'creator',
    tier: 2,
  },
  {
    id: 'uploads_25',
    name: '25 Uploads',
    description: 'Published 25 public Workshop creations.',
    category: 'creator',
    tier: 3,
  },
  {
    id: 'uploads_100',
    name: '100 Uploads',
    description: 'Published 100 public Workshop creations.',
    category: 'creator',
    tier: 4,
  },
  {
    id: 'one_month',
    name: 'One Month',
    description: 'Account has been active for 30 days.',
    category: 'account',
    tier: 2,
  },
  {
    id: 'one_year',
    name: 'One Year',
    description: 'Account has been active for one year.',
    category: 'account',
    tier: 4,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Appointed Synapse Admin.',
    category: 'staff',
    tier: 4,
  },
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'Synapse owner.',
    category: 'staff',
    tier: 5,
  },
  {
    id: 'followers_10',
    name: '10 Followers',
    description: 'Reached 10 followers.',
    category: 'community',
    tier: 1,
  },
  {
    id: 'followers_100',
    name: '100 Followers',
    description: 'Reached 100 followers.',
    category: 'community',
    tier: 3,
  },
];

const BY_ID = new Map(BADGE_CATALOG.map((badge) => [badge.id, badge]));

export function badgeDef(id: string): BadgeDef | undefined {
  return BY_ID.get(id);
}

export function badgeClass(id: string, extra = ''): string {
  const tier = badgeDef(id)?.tier ?? 1;
  return ['synapse-badge', `synapse-badge-t${tier}`, extra]
    .filter(Boolean)
    .join(' ');
}

export function isRoleBadge(id: string): boolean {
  return badgeDef(id)?.category === 'staff';
}

export function formatBadgeAwardedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
