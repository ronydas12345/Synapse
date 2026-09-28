export type BadgeCategory = 'account' | 'creator' | 'community' | 'staff' | 'play';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
}

export const BADGE_CATALOG: BadgeDef[] = [
  {
    id: 'first_creation',
    name: 'First Creation',
    description: 'Published your first creation to the Synapse Workshop.',
    category: 'creator',
  },
  {
    id: 'uploads_10',
    name: '10 Uploads',
    description: 'Published 10 public Workshop creations.',
    category: 'creator',
  },
  {
    id: 'uploads_25',
    name: '25 Uploads',
    description: 'Published 25 public Workshop creations.',
    category: 'creator',
  },
  {
    id: 'uploads_100',
    name: '100 Uploads',
    description: 'Published 100 public Workshop creations.',
    category: 'creator',
  },
  {
    id: 'one_month',
    name: 'One Month',
    description: 'Account has been active for 30 days.',
    category: 'account',
  },
  {
    id: 'one_year',
    name: 'One Year',
    description: 'Account has been active for one year.',
    category: 'account',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Appointed Synapse Admin.',
    category: 'staff',
  },
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'Synapse owner.',
    category: 'staff',
  },
  {
    id: 'followers_10',
    name: '10 Followers',
    description: 'Reached 10 followers.',
    category: 'community',
  },
  {
    id: 'followers_100',
    name: '100 Followers',
    description: 'Reached 100 followers.',
    category: 'community',
  },
  {
    id: 'first_game',
    name: 'First Game',
    description: 'Finished a Playground game.',
    category: 'play',
  },
  {
    id: 'tokens_100',
    name: 'First 100 Tokens',
    description: 'Earned 100 tokens over the lifetime of the account.',
    category: 'play',
  },
  {
    id: 'tokens_1000',
    name: 'First 1,000 Tokens',
    description: 'Earned 1,000 tokens over the lifetime of the account.',
    category: 'play',
  },
  {
    id: 'game_explorer',
    name: 'Game Explorer',
    description: 'Completed five different Playground games.',
    category: 'play',
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Scored 100 on a Playground game.',
    category: 'play',
  },
];

const BY_ID = new Map(BADGE_CATALOG.map((badge) => [badge.id, badge]));

export function badgeDef(id: string): BadgeDef | undefined {
  return BY_ID.get(id);
}
