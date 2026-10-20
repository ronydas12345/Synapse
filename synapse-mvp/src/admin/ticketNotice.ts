export function isUnreadStaffReply(
  lastStaffReplyAt: Date | null | undefined,
  staffReplySeenAt: Date | null | undefined
): boolean {
  if (!lastStaffReplyAt) return false;
  if (!staffReplySeenAt) return true;
  return staffReplySeenAt.getTime() < lastStaffReplyAt.getTime();
}
