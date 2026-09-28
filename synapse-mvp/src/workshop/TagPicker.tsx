import { useEffect, useMemo, useState } from 'react';
import type { WorkshopKind } from './tags';
import {
  MAX_WORKSHOP_TAGS,
  browseTagCatalog,
  catalogCategories,
  groupTags,
  sanitizeTagIds,
} from './tags';
import TagChips from './TagChips';

export default function TagPicker({
  kind,
  value,
  onChange,
  label = 'Tags',
}: {
  kind: WorkshopKind;
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const selected = sanitizeTagIds(kind, value);
  const atMax = selected.length >= MAX_WORKSHOP_TAGS;
  const categories = useMemo(() => catalogCategories(kind), [kind]);
  const groups = useMemo(
    () => groupTags(browseTagCatalog(kind, query, category)),
    [kind, query, category]
  );
  const browsing = Boolean(query.trim() || category);

  useEffect(() => {
    setQuery('');
    setCategory('');
  }, [kind]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    if (atMax) return;
    onChange(sanitizeTagIds(kind, [...selected, id]));
  }

  return (
    <div className="synapse-tag-picker">
      <p className="synapse-settings-lead">
        {label} · {selected.length}/{MAX_WORKSHOP_TAGS}. Search or open a
        category. Custom tags are not allowed.
      </p>
      <TagChips
        kind={kind}
        ids={selected}
        onRemove={(id) => onChange(selected.filter((item) => item !== id))}
      />
      <label className="synapse-settings-field">
        Search tags
        <input
          className="synapse-settings-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim()) setCategory('');
          }}
          placeholder={kind === 'theme' ? 'ocean, cyberpunk, cozy…' : 'chill, anime, focus…'}
        />
      </label>
      <div className="synapse-tag-options" role="group" aria-label="Tag categories">
        {categories.map((item) => {
          const on = category === item.category && !query.trim();
          return (
            <button
              key={item.category}
              type="button"
              className={`synapse-tag-chip ${on ? 'is-on' : ''}`}
              aria-pressed={on}
              onClick={() => {
                setQuery('');
                setCategory(on ? '' : item.category);
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {browsing ? (
        <div className="synapse-tag-catalog" role="group" aria-label="Matching tags">
          {groups.length === 0 ? (
            <p className="synapse-settings-lead">No tags match that search.</p>
          ) : (
            groups.map((group) => (
              <section key={group.category} className="synapse-tag-group">
                <h3>{group.label}</h3>
                <div className="synapse-tag-options">
                  {group.tags.map((tag) => {
                    const on = selected.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`synapse-tag-chip ${on ? 'is-on' : ''}`}
                        disabled={!on && atMax}
                        onClick={() => toggle(tag.id)}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        <p className="synapse-settings-lead">
          Type a word or pick a category to see matching tags.
        </p>
      )}
    </div>
  );
}
