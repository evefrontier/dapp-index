import { describe, expect, test } from 'bun:test';
import { getDappDetailViewModel } from '@/directory/dappDetailModel';
import { listDirectoryTestFixtures } from './directoryTestFixtures';

describe('getDappDetailViewModel', () => {
  test('maps wizard metadata fields for frontier-library', () => {
    const entry = listDirectoryTestFixtures().find(
      (fixture) => fixture.id === 'frontier-library',
    );
    expect(entry).toBeDefined();
    if (!entry) return;

    const model = getDappDetailViewModel(entry);

    expect(model.name).toBe('Frontier Library');
    expect(model.summary).toContain('verified builder metadata');
    expect(model.description).toContain('catalog and documentation hub');
    expect(model.liveUrl).toBe('https://frontier-library.example');
    expect(model.repositoryUrl).toBe('https://github.com/example/frontier-library');
    expect(model.documentationUrl).toBe('https://docs.frontier-library.example');
    expect(model.smartAssemblyTypes).toEqual([
      { id: 'storage-unit', label: 'Storage unit' },
    ]);
    expect(model.packages).toHaveLength(1);
    expect(model.packages[0]?.mvrName).toBe('@example/frontier-library');
    expect(model.gallerySlides).toHaveLength(2);
    expect(model.gallerySlides.every((slide) => slide.kind === 'image')).toBe(
      true,
    );
  });

  test('includes demo videos in the gallery carousel', () => {
    const entry = listDirectoryTestFixtures().find(
      (fixture) => fixture.id === 'monkey-show',
    );
    expect(entry).toBeDefined();
    if (!entry) return;

    const model = getDappDetailViewModel(entry);

    expect(model.gallerySlides).toHaveLength(1);
    expect(model.gallerySlides[0]?.kind).toBe('video');
  });
});
