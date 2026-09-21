import { supabase, throwIfError } from '../supabase/client';
import { supabaseAnonKey, supabaseUrl } from '../supabase/config';
import { avatarPathFromPublicUrl } from '../cloud/avatar';
import { useAuthStore } from '../auth/authStore';
import { identityFromFields } from '../auth/identity';
import { asDate } from './dates';
import {
  httpsPhoto,
  type AccountStatus,
  type AuditEntry,
  type ModerationItem,
  type ModerationStatus,
  type ModerationType,
  type PlatformUser,
  type PublishedThemeDoc,
  type StaffRoleDoc,
  type SupportTicket,
  type TicketMessage,
  type TicketPriority,
  type TicketStatus,
} from './model';

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function bool(value: unknown): boolean {
  return value === true;
}

type ProfileRow = {
  uid: string;
  email: string;
  username: string;
  display_name: string;
  photo_url: string;
  status: string;
  email_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
};

type RoleRow = {
  uid: string;
  role: string;
  email: string;
  active: boolean;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
};

type TicketRow = {
  id: string;
  uid: string;
  email: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  assigned_admin_uid: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function platformUser(data: ProfileRow): PlatformUser | null {
  const uid = str(data.uid);
  const email = str(data.email).toLowerCase();
  const username = str(data.username);
  const displayName = str(data.display_name);
  if (!uid || !email || !username || !displayName) return null;
  const status = data.status === 'suspended' ? 'suspended' : 'active';
  return {
    uid,
    email,
    username,
    displayName,
    photoURL: httpsPhoto(str(data.photo_url)),
    status,
    emailVerified: bool(data.email_verified),
    createdAt: asDate(data.created_at),
    updatedAt: asDate(data.updated_at),
    lastSeenAt: asDate(data.last_seen_at),
  };
}

function roleDoc(data: RoleRow): StaffRoleDoc | null {
  if (data.role !== 'admin') return null;
  const uid = str(data.uid);
  const email = str(data.email).toLowerCase();
  if (!uid || !email) return null;
  return {
    uid,
    role: 'admin',
    email,
    active: data.active !== false,
    createdBy: str(data.created_by),
    createdAt: asDate(data.created_at),
    updatedAt: asDate(data.updated_at),
  };
}

function emptyToNull(value: string | undefined): string | null | undefined {
  if (value == null) return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function writeAudit(
  action: string,
  targetType: string,
  targetId: string,
  summary: string
): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user?.email) return;
  const { error } = await supabase.from('admin_audit').insert({
    actor_uid: user.uid,
    actor_email: user.email.toLowerCase(),
    action: action.slice(0, 80),
    target_type: targetType.slice(0, 40),
    target_id: targetId.slice(0, 128),
    summary: summary.slice(0, 300),
  });
  throwIfError(error);
}

export async function listUsers(): Promise<PlatformUser[]> {
  const { data, error } = await supabase.from('profiles').select('*').limit(500);
  throwIfError(error);
  return ((data ?? []) as ProfileRow[])
    .map((row) => platformUser(row))
    .filter((row): row is PlatformUser => row != null)
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function updateManagedUser(
  uid: string,
  patch: {
    username?: string;
    displayName?: string;
    photoURL?: string;
    status?: AccountStatus;
  }
): Promise<void> {
  const { data: current, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();
  throwIfError(readError);
  if (!current) throw new Error('That user is not in the database yet.');
  const row = current as ProfileRow;
  const identity = identityFromFields(
    patch.username ?? str(row.username),
    patch.displayName ?? str(row.display_name)
  );
  if (!identity) throw new Error('Username and display name are invalid.');
  const next: Record<string, unknown> = {
    username: identity.username,
    display_name: identity.displayName,
  };
  if (patch.photoURL != null) next.photo_url = httpsPhoto(patch.photoURL);
  if (patch.status) next.status = patch.status;
  const { error } = await supabase.from('profiles').update(next).eq('uid', uid);
  throwIfError(error);
  await writeAudit(
    'user.update',
    'user',
    uid,
    `Updated user ${uid}${patch.status ? ` (${patch.status})` : ''}`
  );
}

export async function sendUserPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
  await writeAudit(
    'user.password_reset',
    'user',
    email.toLowerCase(),
    `Sent password reset to ${email.toLowerCase()}`
  );
}

export async function listAdmins(): Promise<StaffRoleDoc[]> {
  const { data, error } = await supabase.from('roles').select('*');
  throwIfError(error);
  return ((data ?? []) as RoleRow[])
    .map((row) => roleDoc(row))
    .filter((row): row is StaffRoleDoc => row != null)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function promoteAdmin(
  uid: string,
  email: string,
  active = true
): Promise<void> {
  const actor = useAuthStore.getState().user;
  if (!actor) throw new Error('Sign in as superadmin first.');
  const { data: existing, error: readError } = await supabase
    .from('roles')
    .select('uid')
    .eq('uid', uid)
    .maybeSingle();
  throwIfError(readError);
  if (existing) {
    const { error } = await supabase
      .from('roles')
      .update({ email: email.toLowerCase(), active })
      .eq('uid', uid);
    throwIfError(error);
  } else {
    const { error } = await supabase.from('roles').insert({
      uid,
      role: 'admin',
      email: email.toLowerCase(),
      active,
      created_by: actor.uid,
    });
    throwIfError(error);
  }
  await writeAudit(
    active ? 'admin.promote' : 'admin.deactivate',
    'admin',
    uid,
    `${active ? 'Promoted' : 'Deactivated'} admin ${email.toLowerCase()}`
  );
}

export async function deleteAdmin(uid: string): Promise<void> {
  const { error } = await supabase.from('roles').delete().eq('uid', uid);
  throwIfError(error);
  await writeAudit('admin.delete', 'admin', uid, `Removed admin role ${uid}`);
}

export async function createAdminAccount(input: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}): Promise<string> {
  const identity = identityFromFields(input.username, input.displayName);
  if (!identity) throw new Error('Username and display name are required.');
  if (input.password.length < 6) {
    throw new Error('Use a password with at least 6 characters.');
  }
  const actor = useAuthStore.getState().user;
  if (!actor) throw new Error('Sign in as superadmin first.');

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      data: {
        display_name: identity.displayName,
        username: identity.username,
      },
    }),
  });
  const payload = (await response.json()) as {
    id?: string;
    user?: { id?: string };
    msg?: string;
    message?: string;
    error_description?: string;
    error?: string;
  };
  const uid = payload.id || payload.user?.id;
  if (!response.ok || !uid) {
    throw new Error(
      payload.msg ||
        payload.message ||
        payload.error_description ||
        payload.error ||
        'Could not create that admin account.'
    );
  }
  const email = input.email.trim().toLowerCase();
  const { error: profileError } = await supabase.from('profiles').insert({
    uid,
    email,
    username: identity.username,
    display_name: identity.displayName,
    photo_url: '',
    status: 'active',
    email_verified: false,
  });
  throwIfError(profileError);
  const { error: roleError } = await supabase.from('roles').insert({
    uid,
    role: 'admin',
    email,
    active: true,
    created_by: actor.uid,
  });
  throwIfError(roleError);
  await writeAudit('admin.create', 'admin', uid, `Created admin ${email}`);
  return uid;
}

function ticketFrom(row: TicketRow): SupportTicket | null {
  const status = row.status;
  const priority = row.priority;
  if (
    status !== 'open' &&
    status !== 'pending' &&
    status !== 'resolved' &&
    status !== 'closed'
  ) {
    return null;
  }
  if (
    priority !== 'low' &&
    priority !== 'normal' &&
    priority !== 'high' &&
    priority !== 'urgent'
  ) {
    return null;
  }
  return {
    id: str(row.id),
    uid: str(row.uid),
    email: str(row.email),
    subject: str(row.subject),
    body: str(row.body),
    status,
    priority,
    assignedAdminUid: str(row.assigned_admin_uid),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export async function listAllTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return ((data ?? []) as TicketRow[])
    .map(ticketFrom)
    .filter((row): row is SupportTicket => row != null);
}

export async function listOwnTickets(uid: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('uid', uid)
    .limit(100);
  throwIfError(error);
  return ((data ?? []) as TicketRow[])
    .map(ticketFrom)
    .filter((row): row is SupportTicket => row != null)
    .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
}

export async function createTicket(
  subject: string,
  body: string,
  priority: TicketPriority = 'normal'
): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user?.email) throw new Error('Sign in to send a ticket.');
  const { error } = await supabase.from('tickets').insert({
    uid: user.uid,
    email: user.email.toLowerCase(),
    subject: subject.trim().slice(0, 120),
    body: body.trim().slice(0, 4000),
    status: 'open',
    priority,
    assigned_admin_uid: null,
  });
  throwIfError(error);
}

export async function updateTicket(
  id: string,
  patch: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedAdminUid?: string;
  }
): Promise<void> {
  const next: Record<string, unknown> = {};
  if (patch.status) next.status = patch.status;
  if (patch.priority) next.priority = patch.priority;
  if (patch.assignedAdminUid !== undefined) {
    next.assigned_admin_uid = emptyToNull(patch.assignedAdminUid);
  }
  const { error } = await supabase.from('tickets').update(next).eq('id', id);
  throwIfError(error);
  await writeAudit('ticket.update', 'ticket', id, `Updated ticket ${id}`);
}

export async function listTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(200);
  throwIfError(error);
  return ((data ?? []) as { id: string; uid: string; body: string; created_at: string | null }[]).map(
    (row) => ({
      id: row.id,
      uid: str(row.uid),
      body: str(row.body),
      createdAt: asDate(row.created_at),
    })
  );
}

export async function replyToTicket(ticketId: string, body: string): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Sign in first.');
  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    uid: user.uid,
    body: body.trim().slice(0, 4000),
  });
  throwIfError(error);
  await writeAudit('ticket.reply', 'ticket', ticketId, `Replied to ticket ${ticketId}`);
}

export async function listModeration(): Promise<ModerationItem[]> {
  const { data, error } = await supabase
    .from('moderation')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (
    (data ?? []) as {
      id: string;
      type: string;
      target_uid: string;
      image_url: string;
      status: string;
      note: string;
      reviewer_uid: string | null;
      created_at: string | null;
      updated_at: string | null;
    }[]
  ).map((row) => {
    const type: ModerationType = row.type === 'overlay' ? 'overlay' : 'avatar';
    const status = (
      ['pending', 'approved', 'rejected', 'removed'] as ModerationStatus[]
    ).includes(row.status as ModerationStatus)
      ? (row.status as ModerationStatus)
      : 'pending';
    return {
      id: row.id,
      type,
      targetUid: str(row.target_uid),
      imageUrl: httpsPhoto(str(row.image_url)),
      status,
      note: str(row.note),
      reviewerUid: str(row.reviewer_uid),
      createdAt: asDate(row.created_at),
      updatedAt: asDate(row.updated_at),
    };
  });
}

export async function queueModeration(input: {
  type: ModerationType;
  targetUid: string;
  imageUrl: string;
  note?: string;
}): Promise<void> {
  const { error } = await supabase.from('moderation').insert({
    type: input.type,
    target_uid: input.targetUid,
    image_url: httpsPhoto(input.imageUrl),
    status: 'pending',
    note: (input.note || '').slice(0, 500),
    reviewer_uid: null,
  });
  throwIfError(error);
  await writeAudit(
    'moderation.queue',
    'moderation',
    input.targetUid,
    `Queued ${input.type} for ${input.targetUid}`
  );
}

export async function reviewModeration(
  id: string,
  status: Exclude<ModerationStatus, 'pending'>,
  note: string,
  imageUrl?: string
): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Sign in first.');
  const { data: item, error: readError } = await supabase
    .from('moderation')
    .select('type, target_uid, image_url')
    .eq('id', id)
    .maybeSingle();
  throwIfError(readError);
  const next: Record<string, unknown> = {
    status,
    note: note.slice(0, 500),
    reviewer_uid: user.uid,
  };
  if (imageUrl != null) next.image_url = httpsPhoto(imageUrl);
  const { error } = await supabase.from('moderation').update(next).eq('id', id);
  throwIfError(error);
  const targetUid = str(item?.target_uid);
  const currentUrl = httpsPhoto(imageUrl ?? item?.image_url);
  if (item?.type === 'avatar' && targetUid) {
    if (status === 'approved' && currentUrl) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ photo_url: currentUrl })
        .eq('uid', targetUid);
      throwIfError(profileError);
    }
    if (status === 'removed') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ photo_url: '' })
        .eq('uid', targetUid);
      throwIfError(profileError);
    }
    if ((status === 'removed' || status === 'rejected') && currentUrl) {
      const path = avatarPathFromPublicUrl(currentUrl);
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    }
  }
  await writeAudit('moderation.review', 'moderation', id, `Marked ${id} as ${status}`);
}

export async function listAudit(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('admin_audit')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  throwIfError(error);
  return (
    (data ?? []) as {
      id: string;
      actor_uid: string;
      actor_email: string;
      action: string;
      target_type: string;
      target_id: string;
      summary: string;
      created_at: string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    actorUid: str(row.actor_uid),
    actorEmail: str(row.actor_email),
    action: str(row.action),
    targetType: str(row.target_type),
    targetId: str(row.target_id),
    summary: str(row.summary),
    createdAt: asDate(row.created_at),
  }));
}

export async function listPublishedThemes(): Promise<PublishedThemeDoc[]> {
  const { data, error } = await supabase.from('published_themes').select('*');
  throwIfError(error);
  return (
    (data ?? []) as {
      theme_id: string;
      name: string;
      status: string;
      published_by: string;
      payload_json: string;
      created_at: string | null;
      updated_at: string | null;
    }[]
  ).map((row) => ({
    themeId: str(row.theme_id),
    name: str(row.name),
    status: row.status === 'archived' ? 'archived' : 'published',
    publishedBy: str(row.published_by),
    payloadJson: str(row.payload_json),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  }));
}

export async function publishTheme(input: {
  themeId: string;
  name: string;
  payloadJson: string;
  status?: 'published' | 'archived';
}): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Sign in as superadmin first.');
  const { data: existing, error: readError } = await supabase
    .from('published_themes')
    .select('theme_id')
    .eq('theme_id', input.themeId)
    .maybeSingle();
  throwIfError(readError);
  const payload = {
    theme_id: input.themeId,
    name: input.name.slice(0, 64),
    status: input.status || 'published',
    payload_json: input.payloadJson.slice(0, 50000),
  };
  if (existing) {
    const { error } = await supabase
      .from('published_themes')
      .update(payload)
      .eq('theme_id', input.themeId);
    throwIfError(error);
  } else {
    const { error } = await supabase.from('published_themes').insert({
      ...payload,
      published_by: user.uid,
    });
    throwIfError(error);
  }
  await writeAudit(
    'theme.publish',
    'theme',
    input.themeId,
    `${payload.status} theme ${input.name}`
  );
}
