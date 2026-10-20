export default function NavNotice({
  label = 'New support reply',
}: {
  label?: string;
}) {
  return <span className="synapse-nav-notice" aria-label={label} />;
}
