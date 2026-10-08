import {
  formatPortalTrailStop,
  type PortalTrailStop,
} from '../portals/trail';

interface PortalTrailNavProps {
  trail: PortalTrailStop[];
  onSelect: (index: number) => void;
}

export default function PortalTrailNav({ trail, onSelect }: PortalTrailNavProps) {
  if (trail.length < 2) return null;
  return (
    <nav className="synapse-portal-trail" aria-label="Portal path">
      {trail.map((stop, index) => {
        const label = formatPortalTrailStop(stop);
        const prior = index < trail.length - 1;
        return (
          <span key={`${stop.playlistId}-${index}`} className="synapse-portal-trail-step">
            {index > 0 ? (
              <span className="synapse-portal-trail-sep" aria-hidden="true">
                {'>'}
              </span>
            ) : null}
            {prior ? (
              <button
                type="button"
                className="synapse-portal-trail-link"
                onClick={() => onSelect(index)}
              >
                {label}
              </button>
            ) : (
              <span className="synapse-portal-trail-here">{label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
