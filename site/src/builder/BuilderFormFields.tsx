import type { ReactNode } from 'react';

type BuilderFieldProps = {
  error?: string;
  id: string;
  label: string;
};

const FIELD_INPUT_CLASS_NAME =
  'w-full border border-[var(--color-neutral-30)] bg-[var(--color-background-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none transition-colors focus:border-[var(--color-primary)]';
const FIELD_ERROR_INPUT_CLASS_NAME =
  'border-[var(--color-error)] focus:border-[var(--color-error)]';

export function BuilderTextField({
  error,
  id,
  label,
  maxLength,
  type = 'text',
  value,
  onChange,
}: BuilderFieldProps & {
  maxLength?: number;
  type?: 'text' | 'url';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <BuilderFieldShell error={error} id={id} label={label}>
      <input
        aria-describedby={getBuilderFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={getBuilderFieldInputClassName(error)}
        id={id}
        maxLength={maxLength}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </BuilderFieldShell>
  );
}

export function BuilderTextAreaField({
  error,
  id,
  label,
  maxLength,
  rows,
  value,
  onChange,
}: BuilderFieldProps & {
  maxLength?: number;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <BuilderFieldShell error={error} id={id} label={label}>
      <textarea
        aria-describedby={getBuilderFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={getBuilderFieldInputClassName(error)}
        id={id}
        maxLength={maxLength}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </BuilderFieldShell>
  );
}

export function BuilderSelectField({
  children,
  error,
  id,
  label,
  value,
  onChange,
}: BuilderFieldProps & {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <BuilderFieldShell error={error} id={id} label={label}>
      <select
        aria-describedby={getBuilderFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={getBuilderFieldInputClassName(error)}
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
    </BuilderFieldShell>
  );
}

export function BuilderFieldShell({
  children,
  error,
  id,
  label,
}: BuilderFieldProps & {
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label
        className="text-xs font-bold uppercase text-[var(--color-neutral-60)]"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
      <BuilderFieldError id={id} message={error} />
    </div>
  );
}

export function BuilderFieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p className="text-xs text-[var(--color-error)]" id={`${id}-error`}>
      {message}
    </p>
  );
}

export function getBuilderFieldErrorId(
  id: string,
  error?: string,
): string | undefined {
  return error ? `${id}-error` : undefined;
}

function getBuilderFieldInputClassName(error?: string): string {
  return error
    ? `${FIELD_INPUT_CLASS_NAME} ${FIELD_ERROR_INPUT_CLASS_NAME}`
    : FIELD_INPUT_CLASS_NAME;
}
