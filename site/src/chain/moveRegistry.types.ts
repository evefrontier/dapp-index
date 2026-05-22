import type {
  DappIndexSuiNetwork,
  DappIndexSuiPackageRole,
} from '../types/dapp-index';

export type MoveRegistryResolvablePackage = {
  network: DappIndexSuiNetwork;
  role: DappIndexSuiPackageRole;
  mvrName?: string;
  packageId?: string;
  packageInfoId?: string;
};

export type MoveRegistryPackageResolver = {
  resolvePackage(options: {
    package: string;
    network: DappIndexSuiNetwork;
  }): Promise<{
    package: string;
    packageInfoId?: string;
    network?: DappIndexSuiNetwork;
  }>;
};

export type MoveRegistryResolver = {
  core?: { mvr?: MoveRegistryPackageResolver };
  mvr?: MoveRegistryPackageResolver;
};

export type MoveRegistryVerificationStatus =
  | 'verified'
  | 'mismatch'
  | 'missing'
  | 'unreachable';

export type MoveRegistryVerificationResult = {
  status: MoveRegistryVerificationStatus;
  entry: MoveRegistryResolvablePackage;
  network?: DappIndexSuiNetwork;
  mvrName?: string;
  packageId?: string;
  packageInfoId?: string;
  resolvedPackageId?: string;
  resolvedPackageInfoId?: string;
  resolvedNetwork?: DappIndexSuiNetwork;
  reason?: string;
  errorMessage?: string;
};

export type MoveRegistryReleaseVerification =
  | {
      ok: true;
      results: MoveRegistryVerificationResult[];
    }
  | {
      ok: false;
      reason: 'missing-core-package' | 'verification-failed';
      results: MoveRegistryVerificationResult[];
    };

export type Declaration<T, Reason extends string> =
  | { ok: true; value: T }
  | { ok: false; reason: Reason; errorMessage?: string };

export type MoveRegistryVerificationContext = Pick<
  MoveRegistryVerificationResult,
  'entry'
> &
  Partial<
    Omit<
      MoveRegistryVerificationResult,
      'entry' | 'status' | 'reason' | 'errorMessage'
    >
  >;

export type MoveRegistryVerificationDetails = Partial<
  Pick<MoveRegistryVerificationResult, 'reason' | 'errorMessage'>
>;

export type DeclaredMoveRegistryPackage = {
  entry: MoveRegistryResolvablePackage;
  network: DappIndexSuiNetwork;
  mvrName: string;
  packageId: string;
  packageInfoId: string;
};

export type MoveRegistryPackageDeclaration =
  | { ok: true; value: DeclaredMoveRegistryPackage }
  | { ok: false; result: MoveRegistryVerificationResult };

export type MoveRegistryPackageResolverReason =
  | 'missing-mvr-resolver'
  | 'invalid-mvr-resolver-shape';

export type MoveRegistryPackageResolverSource = 'core.mvr' | 'mvr';

export type MoveRegistryPackageResolverDeclaration = Declaration<
  MoveRegistryPackageResolver,
  MoveRegistryPackageResolverReason
>;

export type MoveRegistryPackageIdReason =
  | 'missing-package-id'
  | 'invalid-package-id'
  | 'missing-package-info-id'
  | 'invalid-package-info-id'
  | 'missing-resolved-package-id'
  | 'invalid-resolved-package-id'
  | 'missing-resolved-package-info-id'
  | 'invalid-resolved-package-info-id';

export type MoveRegistryPackageIdDeclaration = Declaration<
  string,
  MoveRegistryPackageIdReason
>;
