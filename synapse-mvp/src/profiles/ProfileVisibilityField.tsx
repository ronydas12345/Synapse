import type { ProfileVisibility } from '../profile/types';

export default function ProfileVisibilityField({
  value,
  onChange,
}: {
  value: ProfileVisibility;
  onChange: (value: ProfileVisibility) => void;
}) {
  return (
    <label className="synapse-settings-field">
      Profile visibility
      <select
        className="synapse-settings-input"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(
            next === 'public' || next === 'unlisted' ? next : 'private'
          );
        }}
      >
        <option value="private">Private — only you</option>
        <option value="unlisted">Unlisted — anyone with the ID or link</option>
        <option value="public">Public — /u/username and Workshop</option>
      </select>
    </label>
  );
}
