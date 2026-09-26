import { DECORATION_CATALOG, decorationClass } from './catalog';

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
            <span className={decorationClass(item.id)} aria-hidden="true" />
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
