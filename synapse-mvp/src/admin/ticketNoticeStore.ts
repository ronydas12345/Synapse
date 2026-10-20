import { create } from 'zustand';
import { supabase, isMissingSchema, isSchemaCacheError } from '../supabase/client';
import { asDate } from './dates';
import { isUnreadStaffReply } from './ticketNotice';

const LOCAL_SEEN_KEY = 'synapse_ticket_staff_seen';
const LOCAL_SEEN_BOOT = 'synapse_ticket_staff_seen_boot';

function missingNoticeColumns(error: { message: string; code?: string } | null): boolean {
  if (!error) return false;
  if (isMissingSchema(error) || isSchemaCacheError(error)) return true;
  return /last_staff_reply_at|staff_reply_seen_at|PGRST204|42703/i.test(
    `${error.code || ''} ${error.message || ''}`
  );
}

function readLocalSeen(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    );
  } catch {
    return {};
  }
}

function writeLocalSeen(ticketId?: string, ticketIds: string[] = []): void {
  const next = readLocalSeen();
  const now = new Date().toISOString();
  if (ticketId) next[ticketId] = now;
  else for (const id of ticketIds) next[id] = now;
  try {
    localStorage.setItem(LOCAL_SEEN_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

async function loadUnreadIdsFromMessages(uid: string): Promise<string[]> {
  const { data: tickets, error: ticketError } = await supabase
    .from('tickets')
    .select('id')
    .eq('uid', uid)
    .limit(100);
  if (ticketError || !tickets?.length) return [];
  const ids = tickets.map((row) => String(row.id || '')).filter(Boolean);
  const { data: messages, error } = await supabase
    .from('ticket_messages')
    .select('ticket_id, uid, created_at')
    .in('ticket_id', ids)
    .neq('uid', uid)
    .limit(400);
  if (error || !messages) return [];
  const latest = new Map<string, number>();
  for (const row of messages) {
    const ticketId = String(row.ticket_id || '');
    const at = asDate(row.created_at)?.getTime() || 0;
    if (!ticketId || !at) continue;
    latest.set(ticketId, Math.max(latest.get(ticketId) || 0, at));
  }
  const seeded = localStorage.getItem(LOCAL_SEEN_BOOT) === '1';
  if (!seeded) {
    writeLocalSeen(undefined, [...latest.keys()]);
    try {
      localStorage.setItem(LOCAL_SEEN_BOOT, '1');
    } catch {
      /* ignore quota */
    }
    return [];
  }
  const seen = readLocalSeen();
  return [...latest.entries()]
    .filter(([ticketId, at]) => {
      const seenAt = asDate(seen[ticketId])?.getTime() || 0;
      return seenAt < at;
    })
    .map(([ticketId]) => ticketId);
}

async function loadUnreadIds(uid: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, last_staff_reply_at, staff_reply_seen_at')
    .eq('uid', uid)
    .limit(100);
  if (missingNoticeColumns(error)) return loadUnreadIdsFromMessages(uid);
  if (error) return loadUnreadIdsFromMessages(uid);
  return ((data ?? []) as {
    id?: string;
    last_staff_reply_at?: string | null;
    staff_reply_seen_at?: string | null;
  }[])
    .filter((row) =>
      isUnreadStaffReply(asDate(row.last_staff_reply_at), asDate(row.staff_reply_seen_at))
    )
    .map((row) => String(row.id || ''))
    .filter(Boolean);
}

export const useTicketNoticeStore = create<{
  unreadIds: string[];
  refresh: () => Promise<void>;
  markSeen: (ticketId?: string) => Promise<void>;
}>((set, get) => ({
  unreadIds: [],
  refresh: async () => {
    const uid = watchingUid;
    if (!uid) {
      set({ unreadIds: [] });
      return;
    }
    set({ unreadIds: await loadUnreadIds(uid) });
  },
  markSeen: async (ticketId) => {
    const unreadIds = get().unreadIds;
    if (unreadIds.length === 0) return;
    if (ticketId && !unreadIds.includes(ticketId)) return;
    writeLocalSeen(ticketId, unreadIds);
    set({
      unreadIds: ticketId ? unreadIds.filter((id) => id !== ticketId) : [],
    });
    const { error } = await supabase.rpc(
      'mark_ticket_staff_reply_seen',
      ticketId ? { p_id: ticketId } : {}
    );
    if (error && !missingNoticeColumns(error) && !isSchemaCacheError(error)) {
      await get().refresh();
    }
  },
}));

let watchingUid = '';
let stopWatch: (() => void) | undefined;

export function watchTicketNotice(uid: string): void {
  if (watchingUid === uid && stopWatch) {
    void useTicketNoticeStore.getState().refresh();
    return;
  }
  stopTicketNotice();
  watchingUid = uid;
  void useTicketNoticeStore.getState().refresh();
  const channel = supabase
    .channel(`ticket-notice:${uid}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `uid=eq.${uid}`,
      },
      () => {
        void useTicketNoticeStore.getState().refresh();
      }
    )
    .subscribe();
  const onFocus = () => {
    void useTicketNoticeStore.getState().refresh();
  };
  window.addEventListener('focus', onFocus);
  const timer = window.setInterval(onFocus, 45000);
  stopWatch = () => {
    window.removeEventListener('focus', onFocus);
    window.clearInterval(timer);
    void supabase.removeChannel(channel);
  };
}

export function stopTicketNotice(): void {
  stopWatch?.();
  stopWatch = undefined;
  watchingUid = '';
  useTicketNoticeStore.setState({ unreadIds: [] });
}
