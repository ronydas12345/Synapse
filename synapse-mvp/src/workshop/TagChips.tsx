import type { WorkshopKind } from './tags';
import { tagLabel } from './tags';

export default function TagChips({
  kind,
  ids,
  onRemove,
}: {
  kind: WorkshopKind;
  ids: string[];
  onRemove?: (id: string) => void;
}) {
  if (ids.length === 0) return null;
  return (
    <ul className="synapse-tag-chips">
      {ids.map((id) => (
        <li key={id}>
          {onRemove ? (
            <button
              type="button"
              className="synapse-tag-chip is-on"
              onClick={() => onRemove(id)}
            >
              {tagLabel(kind, id)}
              <span aria-hidden="true"> ×</span>
            </button>
          ) : (
            <span className="synapse-tag-chip">{tagLabel(kind, id)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
