/**
 * Run async work over `items` with a fixed worker pool.
 * Results preserve input order.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Math.max(1, Math.min(concurrency, items.length));

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) break;
      const item = items[i];
      if (item === undefined) continue;
      results[i] = await fn(item, i);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
