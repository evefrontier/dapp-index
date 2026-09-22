export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated value: ${String(value)}`);
}
