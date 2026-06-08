import type { ReactNode } from 'react';

type FieldProps = {
  error?: string;
  id: string;
  label: string;
};

export function TextField({
  error,
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
    <FieldShell error={error} id={id} label={label}>
      <input
        aria-describedby={getFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={
          error
            ? 'w-full border border-(--color-alert) bg-(--color-crude-60) px-3 py-2 text-sm text-(--color-neutral) outline-none transition-colors focus:border-(--color-alert)'
            : 'w-full border border-(--color-neutral-30) bg-(--color-crude-60) px-3 py-2 text-sm text-(--color-neutral) outline-none transition-colors focus:border-(--color-martian-red)'
        }
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
    <FieldShell error={error} id={id} label={label}>
      <textarea
        aria-describedby={getFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={
          error
            ? 'w-full border border-(--color-alert) bg-(--color-crude-60) px-3 py-2 text-sm text-(--color-neutral) outline-none transition-colors focus:border-(--color-alert)'
            : 'w-full border border-(--color-neutral-30) bg-(--color-crude-60) px-3 py-2 text-sm text-(--color-neutral) outline-none transition-colors focus:border-(--color-martian-red)'
        }
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
    <FieldShell error={error} id={id} label={label}>
      <select
        aria-describedby={getFieldErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={
          error
            ? 'w-full border border-(--color-alert) bg-(--color-crude-60) px-3 py-2 text-sm text-(--color-neutral) outline-none transition-colors focus:border-(--color-alert)'
            : 'w-full border border-(--color-neutral-30) bg-(--color-crude-60) px-3 py-2 text-sm text-(--color-neutral) outline-none transition-colors focus:border-(--color-martian-red)'
        }
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
  id,
  label,
}: FieldProps & {
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label
        className="text-xs font-bold uppercase text-(--color-neutral-60)"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
      <FieldError id={id} message={error} />
    </div>
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
