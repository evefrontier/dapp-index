type CheckboxOptionProps = {
  checked: boolean;
  error: boolean;
  label: string;
  name: string;
  subLabel?: string;
  value: string;
  onChange: () => void;
};

export function CheckboxOption({
  checked,
  error,
  label,
  name,
  subLabel,
  value,
  onChange,
}: CheckboxOptionProps) {
  return (
    <label className="builder-checkbox-option group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border border-(--app-neutral-20) p-3 text-sm text-(--colors-neutral-base) hover:border-(--colors-neutral-50)">
      <input
        checked={checked}
        className="peer sr-only"
        name={name}
        type="checkbox"
        value={value}
        onChange={onChange}
      />
      <span
        aria-hidden="true"
        className="builder-checkbox-box"
        data-checked={checked ? '' : undefined}
        data-error={error ? '' : undefined}
      >
        <span
          className="builder-checkbox-mark"
          data-checked={checked ? '' : undefined}
        />
      </span>
      <span className="grid gap-1">
        <strong>{label}</strong>
        {subLabel ? (
          <span className="text-xs text-(--colors-neutral-60)">{subLabel}</span>
        ) : null}
      </span>
    </label>
  );
}
