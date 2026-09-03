import type { ReactNode } from 'react';

type FieldProps = {
  error?: string;
  id: string;
  label: string;
};

export function TextField({
  action,
  error,
  id,
  label,
  maxLength,
  type = 'text',
  value,
  onChange,
}: FieldProps & {
  action?: ReactNode;
  maxLength?: number;
  type?: 'text' | 'url';
  value: string;
  onChange: (value: string) => void;
}) {
  const input = (
    <input
      aria-describedby={getFieldErrorId(id, error)}
      aria-invalid={error ? true : undefined}
      className={action ? 'min-w-0 flex-1' : undefined}
      id={id}
      maxLength={maxLength}
      type={type}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );

  return (
    <FieldShell error={error} id={id} label={label}>
      {action ? (
        <div className="flex items-center gap-2">
          {input}
          {action}
        </div>
      ) : (
        input
      )}
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
    <div className="builder-field grid gap-2">
      <label htmlFor={id}>
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
