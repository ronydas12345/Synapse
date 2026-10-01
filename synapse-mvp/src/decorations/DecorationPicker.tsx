import { DECORATION_CATALOG } from './catalog';
import DecorationFrame from './DecorationFrame';

export default function DecorationPicker({
  equipped,
  unlocked,
  onEquip,
  disabled = false,
}: {
  equipped: string;
  unlocked: string[];
  onEquip: (id: string) => void;
  disabled?: boolean;
}) {
  const unlockedSet = new Set(unlocked);
  return (
    <div className="synapse-deco-picker">
      {DECORATION_CATALOG.map((item) => {
        const locked = !unlockedSet.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`synapse-deco-option${equipped === item.id ? ' is-on' : ''}`}
            disabled={disabled || locked}
            onClick={() => onEquip(item.id)}
            title={locked ? `Locked — ${item.description}` : item.description}
          >
            <DecorationFrame id={item.id} />
            <span>
              {item.name}
              {locked ? ' (locked)' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
