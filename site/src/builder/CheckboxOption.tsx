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
    <label className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border border-(--color-neutral-20) p-3 text-sm text-(--color-neutral) hover:border-(--color-neutral-50)">
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
        className={getCheckboxBoxClassName(checked, error)}
      >
        <span className={getCheckboxMarkClassName(checked)} />
      </span>
      <span className="grid gap-1">
        <span className="font-bold uppercase">{label}</span>
        {subLabel ? (
          <span className="text-xs text-(--color-neutral-60)">{subLabel}</span>
        ) : null}
      </span>
    </label>
  );
}

function getCheckboxBoxClassName(checked: boolean, error: boolean): string {
  if (error) {
    return checked
      ? 'mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-(--color-alert) bg-(--color-martian-red) transition-colors peer-disabled:border-(--color-neutral-20) peer-disabled:bg-(--color-neutral-20)'
      : 'mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-(--color-alert) bg-transparent transition-colors peer-disabled:border-(--color-neutral-20) peer-disabled:bg-(--color-neutral-20)';
  }

  if (checked) {
    return 'mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-(--color-martian-red) bg-(--color-martian-red) transition-colors group-hover:border-(--color-neutral) group-hover:bg-(--color-neutral) peer-focus-visible:border-(--color-martian-red) peer-disabled:border-(--color-neutral-20) peer-disabled:bg-(--color-neutral-20)';
  }

  return 'mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-(--color-martian-red) bg-transparent transition-colors hover:border-(--color-neutral) group-hover:border-(--color-neutral) peer-focus-visible:border-(--color-martian-red) peer-disabled:border-(--color-neutral-20) peer-disabled:bg-(--color-neutral-20)';
}

function getCheckboxMarkClassName(checked: boolean): string {
  return checked
    ? 'h-3 w-2 bg-(--color-crude) opacity-100 transition-colors group-hover:bg-(--color-crude) peer-disabled:bg-(--color-neutral-40)'
    : 'h-3 w-2 bg-(--color-crude) opacity-0 transition-colors group-hover:bg-(--color-crude) peer-disabled:bg-(--color-neutral-40)';
}
