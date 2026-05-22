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
  | { ok: true; declared: DeclaredMoveRegistryPackage }
  | { ok: false; result: MoveRegistryVerificationResult };
