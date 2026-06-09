import { z } from 'zod';

export const SlugSchema = z
  .string()
  .min(1, 'Slug is required.')
  .max(50, 'Slug must be 50 characters or fewer.')
  .regex(
    /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/,
    'Use lowercase letters, numbers, and hyphens.',
  );

export function isHttpsUrlValue(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export const HttpsUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isHttpsUrlValue, 'Use an HTTPS URL.');

export const OptionalHttpsUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || isHttpsUrlValue(value),
    'Use an HTTPS URL.',
  );

export const SuiObjectIdSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Use a valid Sui object ID.');

export function uniqueItems<T extends z.ZodTypeAny>(
  schema: T,
  message: string,
): z.ZodArray<T> {
  return z
    .array(schema)
    .refine((items) => new Set(items).size === items.length, { message });
}

export function storedString() {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value : ''),
    z.string(),
  );
}

export function storedEnumValue<T extends readonly [string, ...string[]]>(
  allowed: T,
  fallback: T[number],
) {
  const schema = z.enum(allowed);

  return z.preprocess(
    (value) =>
      typeof value === 'string' &&
      (allowed as readonly string[]).includes(value)
        ? value
        : fallback,
    schema,
  );
}

export function storedUniqueEnumArray<T extends readonly [string, ...string[]]>(
  allowed: T,
) {
  const itemSchema = z.enum(allowed);

  return z.preprocess((value) => {
    if (!Array.isArray(value)) return [];

    const allowedValues = new Set<string>(allowed);
    const seen = new Set<string>();
    const nextValues: z.infer<typeof itemSchema>[] = [];

    for (const item of value) {
      if (typeof item !== 'string' || !allowedValues.has(item) || seen.has(item)) {
        continue;
      }

      seen.add(item);
      nextValues.push(item as z.infer<typeof itemSchema>);
    }

    return nextValues;
  }, z.array(itemSchema));
}
