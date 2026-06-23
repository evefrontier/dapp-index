import { describe, expect, test } from 'bun:test';
import { getPackageMvrSummaryLabel } from '../src/builder/PackageStepScreen';
import { createRegistrationDraftPackage } from '../src/builder/registrationDraftPackages';

describe('getPackageMvrSummaryLabel', () => {
  const baseLabel = 'Move Registry (MVR)';

  test('returns the base label when MVR fields are empty', () => {
    const draftPackage = createRegistrationDraftPackage({
      draftPackageId: 'package-1',
      role: 'core',
    });

    expect(getPackageMvrSummaryLabel(draftPackage, {})).toBe(baseLabel);
  });

  test('appends has values when MVR fields are filled', () => {
    const draftPackage = {
      ...createRegistrationDraftPackage({
        draftPackageId: 'package-1',
        role: 'core',
      }),
      mvrName: '@example/pkg',
    };

    expect(getPackageMvrSummaryLabel(draftPackage, {})).toBe(
      `${baseLabel} · has values`,
    );
  });

  test('appends needs attention when an MVR field has an error', () => {
    const draftPackage = createRegistrationDraftPackage({
      draftPackageId: 'package-1',
      role: 'core',
    });

    expect(
      getPackageMvrSummaryLabel(draftPackage, {
        mvrName: 'Use a valid MVR name.',
      }),
    ).toBe(`${baseLabel} · needs attention`);
  });
});
