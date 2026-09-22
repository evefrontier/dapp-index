import { describe, expect, test } from 'bun:test';
import { filterDappIndexEntries } from '../src/directory/filterDappIndexEntries';
import { listDirectoryTestFixtures } from './directoryTestFixtures';

describe('filterDappIndexEntries', () => {
  test('filters by category and search tokens', () => {
    const entries = listDirectoryTestFixtures();

    expect(
      filterDappIndexEntries(entries, '', undefined, 'money').map(
        (entry) => entry.id,
      ),
    ).toEqual(['monkey-show']);

    expect(
      filterDappIndexEntries(
        entries,
        'library metadata',
        undefined,
        undefined,
      ).map((entry) => entry.id),
    ).toEqual(['frontier-library']);
  });

  test('filters by smart assembly type', () => {
    const entries = listDirectoryTestFixtures();

    expect(
      filterDappIndexEntries(entries, '', ['gate']).map((entry) => entry.id),
    ).toEqual(['monkey-show']);
  });
});
