import { useId, useState, type ReactNode } from 'react';

type FieldProps = {
  error?: string;
  hint?: string;
  id: string;
  label: string;
};

export function TextField({
  error,
  hint,
  id,
  label,
  maxLength,
  type = 'text',
  value,
  onChange,
}: FieldProps & {
  maxLength?: number;
  type?: 'text' | 'url';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell error={error} hint={hint} id={id} label={label}>
      <input
        aria-describedby={getFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        id={id}
        maxLength={maxLength}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  error,
  hint,
  id,
  label,
  maxLength,
  rows,
  value,
  onChange,
}: FieldProps & {
  maxLength?: number;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell error={error} hint={hint} id={id} label={label}>
      <textarea
        aria-describedby={getFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        id={id}
        maxLength={maxLength}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </FieldShell>
  );
}

export function SelectField({
  children,
  error,
  hint,
  id,
  label,
  value,
  onChange,
}: FieldProps & {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell error={error} hint={hint} id={id} label={label}>
      <select
        aria-describedby={getFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function FieldShell({
  children,
  error,
  hint,
  id,
  label,
}: FieldProps & {
  children: ReactNode;
}) {
  return (
    <div className="builder-field grid gap-2">
      <span className="flex items-center gap-1.5">
        <label htmlFor={id}>{label}</label>
        {hint ? <FieldHint text={hint} /> : null}
      </span>
      {children}
      <FieldError id={id} message={error} />
    </div>
  );
}

export function FieldHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="builder-hint relative inline-flex">
      <button
        aria-describedby={tooltipId}
        aria-expanded={open}
        aria-label="What does this field mean?"
        className="builder-hint-trigger"
        type="button"
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        ?
      </button>
      <span
        className="builder-hint-tooltip"
        data-open={open ? '' : undefined}
        id={tooltipId}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}

export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p className="text-xs text-(--color-alert)" id={`${id}-error`}>
      {message}
    </p>
  );
}

export function getFieldErrorId(
  id: string,
  error?: string,
): string | undefined {
  return error ? `${id}-error` : undefined;
}
