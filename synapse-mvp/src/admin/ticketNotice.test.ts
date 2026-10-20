import { describe, expect, it } from 'vitest';
import { isUnreadStaffReply } from './ticketNotice';

describe('isUnreadStaffReply', () => {
  const reply = new Date('2026-10-20T12:00:00.000Z');

  it('is false when staff has not replied', () => {
    expect(isUnreadStaffReply(null, null)).toBe(false);
    expect(isUnreadStaffReply(null, reply)).toBe(false);
  });

  it('is true when a staff reply has not been opened', () => {
    expect(isUnreadStaffReply(reply, null)).toBe(true);
  });

  it('is true when a newer staff reply arrived after the last open', () => {
    expect(isUnreadStaffReply(reply, new Date('2026-10-19T12:00:00.000Z'))).toBe(true);
  });

  it('is false after the owner opens the reply', () => {
    expect(isUnreadStaffReply(reply, reply)).toBe(false);
    expect(isUnreadStaffReply(reply, new Date('2026-10-20T13:00:00.000Z'))).toBe(false);
  });
});
