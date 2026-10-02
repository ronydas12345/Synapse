export function profileIdentity(
  displayName: string,
  username: string
): { title: string; handle: string } {
  const name = displayName.trim();
  const handle = username.trim();
  if (!name && !handle) return { title: 'Creator', handle: '' };
  if (!name || name.toLowerCase() === handle.toLowerCase()) {
    return { title: handle || name, handle: '' };
  }
  return { title: name, handle: `@${handle}` };
}
