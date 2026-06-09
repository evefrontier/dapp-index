import type { z } from 'zod';

export function zodFieldValidator<T>(schema: z.ZodType<T>) {
  return ({ value }: { value: T }) => {
    const parsed = schema.safeParse(value);
    if (parsed.success) return undefined;

    const messages = parsed.error.issues
      .map((issue) => issue.message)
      .filter((message) => message.length > 0);
    return messages[0] ?? 'Invalid value.';
  };
}

export function zodIssuesToFieldErrors<T extends string>(
  issues: readonly z.ZodIssue[],
  allowedKeys: readonly T[],
): Partial<Record<T, string>> {
  const allowedKeySet = new Set<string>(allowedKeys);
  const errors: Partial<Record<T, string>> = {};

  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key !== 'string' || !allowedKeySet.has(key)) continue;
    if (errors[key as T]) continue;
    errors[key as T] = issue.message;
  }

  return errors;
}

export function zodSafeParseFieldErrors<T extends z.ZodType, K extends string>(
  schema: T,
  value: unknown,
  allowedKeys: readonly K[],
): Partial<Record<K, string>> {
  const result = schema.safeParse(value);
  if (result.success) return {};
  return zodIssuesToFieldErrors(result.error.issues, allowedKeys);
}
