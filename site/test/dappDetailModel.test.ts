import { describe, expect, test } from 'bun:test';
import { applyDevCatalogFixtures } from '@/content/devCatalogFixtures';
import { getDappDetailViewModel } from '@/directory/dappDetailModel';
import { listDappIndexFixtures } from '@/content/dappIndexFixtures';

describe('getDappDetailViewModel', () => {
  test('maps wizard metadata fields for frontier-library', () => {
    const entry = listDappIndexFixtures().find(
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
    expect(model.serverTenantLabel).toBe('Stillness');
    expect(model.smartAssemblyTypes).toEqual([
      { id: 'storage-unit', label: 'Storage unit' },
    ]);
    expect(model.packages).toHaveLength(1);
    expect(model.packages[0]?.mvrName).toBe('@example/frontier-library');
    expect(model.gallerySlides).toHaveLength(2);
    expect(model.gallerySlides.every((slide) => slide.kind === 'image')).toBe(true);
  });

  test('includes demo videos in the gallery carousel', () => {
    const entry = listDappIndexFixtures().find(
      (fixture) => fixture.id === 'monkey-show',
    );
    expect(entry).toBeDefined();
    if (!entry) return;

    const model = getDappDetailViewModel(entry);

    expect(model.gallerySlides).toHaveLength(1);
    expect(model.gallerySlides[0]?.kind).toBe('video');
  });

  test('dev monkey-show fixture mixes screenshot gallery slides and demo video', () => {
    if (!import.meta.env.DEV) return;

    const [entry] = applyDevCatalogFixtures([]).filter(
      (fixture) => fixture.id === 'monkey-show',
    );
    expect(entry).toBeDefined();
    if (!entry) return;

    const model = getDappDetailViewModel(entry);

    expect(model.gallerySlides).toHaveLength(2);
    expect(model.gallerySlides.some((slide) => slide.kind === 'video')).toBe(true);
    expect(model.gallerySlides.some((slide) => slide.kind === 'image')).toBe(true);
  });
});
