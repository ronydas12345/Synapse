import type { AuthRole } from '../auth/session';

export type AccountStatus = 'active' | 'suspended';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ModerationType = 'avatar' | 'overlay';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type ThemePublishStatus = 'published' | 'archived';

export type AdminSection = 'users' | 'tickets' | 'stats' | 'moderation';
export type SuperadminSection = AdminSection | 'admins' | 'themes' | 'audit';

export const ADMIN_SECTIONS: { id: AdminSection; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'stats', label: 'Statistics' },
  { id: 'moderation', label: 'Moderation' },
];

export const SUPERADMIN_SECTIONS: { id: SuperadminSection; label: string }[] = [
  ...ADMIN_SECTIONS,
  { id: 'admins', label: 'Admins' },
  { id: 'themes', label: 'Themes' },
  { id: 'audit', label: 'Admin history' },
];

export interface PlatformUser {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  status: AccountStatus;
  emailVerified: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  lastSeenAt: Date | null;
}

export interface StaffRoleDoc {
  uid: string;
  role: 'admin';
  email: string;
  active: boolean;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SupportTicket {
  id: string;
  uid: string;
  email: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedAdminUid: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface TicketMessage {
  id: string;
  uid: string;
  body: string;
  createdAt: Date | null;
}

export interface ModerationItem {
  id: string;
  type: ModerationType;
  targetUid: string;
  imageUrl: string;
  status: ModerationStatus;
  note: string;
  reviewerUid: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AuditEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: Date | null;
}

export interface PublishedThemeDoc {
  themeId: string;
  name: string;
  status: ThemePublishStatus;
  publishedBy: string;
  payloadJson: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function roleLabel(role: AuthRole): string {
  if (role === 'superadmin') return 'Superadmin';
  if (role === 'admin') return 'Admin';
  return 'User';
}

export function httpsPhoto(url: string | null | undefined): string {
  const value = String(url || '').trim();
  if (value.startsWith('https://') && value.length <= 2048) return value;
  return '';
}
