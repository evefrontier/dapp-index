type BuilderToggleProps = {
  checked: boolean;
  disabled?: boolean;
  error?: boolean;
  id: string;
  label?: string;
  onChange: () => void;
};

export function BuilderToggle({
  checked,
  disabled = false,
  error = false,
  id,
  label,
  onChange,
}: BuilderToggleProps) {
  return (
    <label className="builder-toggle group inline-flex cursor-pointer items-center gap-3">
      <input
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        id={id}
        role="switch"
        type="checkbox"
        onChange={onChange}
      />
      <span
        aria-hidden="true"
        className="builder-toggle-track"
        data-checked={checked ? '' : undefined}
        data-error={error ? '' : undefined}
      >
        <span
          className="builder-toggle-thumb"
          data-checked={checked ? '' : undefined}
        />
      </span>
      {label ? <span className="builder-toggle-label">{label}</span> : null}
    </label>
  );
}
