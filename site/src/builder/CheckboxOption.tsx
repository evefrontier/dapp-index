import { BuilderBracketFrame } from './BuilderBracketFrame';

type CheckboxOptionProps = {
  checked: boolean;
  disabled?: boolean;
  error: boolean;
  label: string;
  name: string;
  subLabel?: string;
  value: string;
  onChange: () => void;
};

export function CheckboxOption({
  checked,
  disabled = false,
  error,
  label,
  name,
  subLabel,
  value,
  onChange,
}: CheckboxOptionProps) {
  const bracketTone = disabled ? 'disabled' : error ? 'error' : 'default';

  return (
    <label className="builder-checkbox-option group block cursor-pointer">
      <input
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        name={name}
        type="checkbox"
        value={value}
        onChange={onChange}
      />
      <BuilderBracketFrame tone={bracketTone}>
        <div className="builder-checkbox-option-content grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-3 text-base text-(--color-neutral)">
          <span
            aria-hidden="true"
            className="builder-checkbox-box"
            data-checked={checked ? '' : undefined}
            data-error={error ? '' : undefined}
          >
            <span
              className="builder-checkbox-fill"
              data-checked={checked ? '' : undefined}
            />
          </span>
          <span className="grid gap-1">
            <strong>{label}</strong>
            {subLabel ? (
              <span className="text-xs text-(--color-neutral-60)">
                {subLabel}
              </span>
            ) : null}
          </span>
        </div>
      </BuilderBracketFrame>
    </label>
  );
}
