import { Button } from '@evefrontier/ui';
import type { ComponentType } from 'react';
import type {
  DraftMedia,
  DraftMediaUpdate,
  DraftStep,
} from '@/storage/draftStorage';
import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SERVER_TENANT_LABELS,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
  type DappIndexCategoryId,
  type DappIndexServerTenant,
  type DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import {
  BuilderFieldError,
  BuilderTextAreaField,
  BuilderTextField,
  getBuilderFieldErrorId,
} from './BuilderFormFields';
import { BuilderMediaStepScreen } from './BuilderMediaStepScreen';
import { BuilderPackageStepScreen } from './BuilderPackageStepScreen';
import { BuilderPublishStepScreen } from './BuilderPublishStepScreen';
import { BuilderReviewStepScreen } from './BuilderReviewStepScreen';
import {
  isRegistrationDraftFieldStep,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFields,
  type RegistrationDraftFieldStep,
} from './registrationDraftFields';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';
import type {
  RegistrationDraftReview,
  RegistrationDraftSlugCheckState,
} from './registrationDraftReview';
import type {
  RegistrationDraftPublishController,
  RegistrationDraftPublishState,
} from './useRegistrationDraftPublishController';

type RegistrationStepScreenProps = {
  activeStep: DraftStep;
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  media: DraftMedia[];
  mediaError: string | null;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  metadataHashError: string | null;
  metadataHashHex: string | null;
  metadataHashPending: boolean;
  packageVerification: RegistrationDraftPackageVerificationState;
  publishReadiness: RegistrationDraftPublishController['publishReadiness'];
  publishState: RegistrationDraftPublishState;
  review: RegistrationDraftReview;
  slugCheck: RegistrationDraftSlugCheckState;
  suiNetwork: string;
  walletAddress: string | null;
  walletNetwork: string | null;
  onCheckSlug: () => Promise<void>;
  onConnectWallet: () => void;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onPublish: () => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onVerifyPackages: () => Promise<void>;
};

type RegistrationStepFieldsProps = Pick<
  RegistrationStepScreenProps,
  | 'errors'
  | 'fields'
  | 'packageVerification'
  | 'onUpdateFields'
  | 'onVerifyPackages'
>;

export function BuilderRegistrationStepScreen({
  activeStep,
  errors,
  fields,
  media,
  mediaError,
  mediaPending,
  mediaPreviewUrls,
  metadataHashError,
  metadataHashHex,
  metadataHashPending,
  packageVerification,
  publishReadiness,
  publishState,
  review,
  slugCheck,
  suiNetwork,
  walletAddress,
  walletNetwork,
  onCheckSlug,
  onConnectWallet,
  onDeleteMedia,
  onPublish,
  onUpdateMedia,
  onUpdateFields,
  onVerifyPackages,
}: RegistrationStepScreenProps) {
  if (activeStep === 'media') {
    return (
      <BuilderMediaStepScreen
        errorMessage={mediaError}
        media={media}
        pending={mediaPending}
        previewUrls={mediaPreviewUrls}
        onDeleteMedia={onDeleteMedia}
        onUpdateMedia={onUpdateMedia}
      />
    );
  }

  if (activeStep === 'review') {
    return (
      <BuilderReviewStepScreen
        metadataHashError={metadataHashError}
        metadataHashHex={metadataHashHex}
        metadataHashPending={metadataHashPending}
        review={review}
        slugCheck={slugCheck}
        onCheckSlug={onCheckSlug}
      />
    );
  }

  if (activeStep === 'publish') {
    return (
      <BuilderPublishStepScreen
        publishReadiness={publishReadiness}
        publishState={publishState}
        suiNetwork={suiNetwork}
        walletAddress={walletAddress}
        walletNetwork={walletNetwork}
        onConnectWallet={onConnectWallet}
        onPublish={onPublish}
      />
    );
  }

  const StepScreen = isRegistrationDraftFieldStep(activeStep)
    ? REGISTRATION_DRAFT_STEP_SCREENS[activeStep]
    : null;

  if (StepScreen) {
    return (
      <StepScreen
        errors={errors}
        fields={fields}
        packageVerification={packageVerification}
        onUpdateFields={onUpdateFields}
        onVerifyPackages={onVerifyPackages}
      />
    );
  }

  return (
    <p className="text-sm text-(--color-neutral-60)">
      Screen content lands in a later builder PR.
    </p>
  );
}

const REGISTRATION_DRAFT_STEP_SCREENS = {
  basics: BasicsScreen,
  about: AboutScreen,
  discovery: DiscoveryScreen,
  packages: PackagesScreen,
} satisfies Record<
  RegistrationDraftFieldStep,
  ComponentType<RegistrationStepFieldsProps>
>;

function BasicsScreen({
  errors,
  fields,
  onUpdateFields,
}: RegistrationStepFieldsProps) {
  return (
    <div className="grid gap-4">
      <BuilderTextField
        error={errors.name}
        id="builder-name"
        label="Name"
        maxLength={80}
        value={fields.name}
        onChange={(name) => onUpdateFields({ name })}
      />
      <BuilderTextField
        error={errors.slug}
        id="builder-slug"
        label="Slug"
        maxLength={50}
        value={fields.slug}
        onChange={(slug) => onUpdateFields({ slug })}
      />
      <BuilderTextAreaField
        error={errors.summary}
        id="builder-summary"
        label="Summary"
        maxLength={180}
        rows={3}
        value={fields.summary}
        onChange={(summary) => onUpdateFields({ summary })}
      />
    </div>
  );
}

function AboutScreen({
  errors,
  fields,
  onUpdateFields,
}: RegistrationStepFieldsProps) {
  return (
    <div className="grid gap-4">
      <BuilderTextAreaField
        error={errors.description}
        id="builder-description"
        label="Description"
        maxLength={4000}
        rows={6}
        value={fields.description}
        onChange={(description) => onUpdateFields({ description })}
      />
      <BuilderTextField
        error={errors.liveUrl}
        id="builder-live-url"
        label="Live URL"
        type="url"
        value={fields.liveUrl}
        onChange={(liveUrl) => onUpdateFields({ liveUrl })}
      />
      <BuilderTextField
        error={errors.repositoryUrl}
        id="builder-repository-url"
        label="Repo URL"
        type="url"
        value={fields.repositoryUrl}
        onChange={(repositoryUrl) => onUpdateFields({ repositoryUrl })}
      />
      <BuilderTextField
        error={errors.documentationUrl}
        id="builder-documentation-url"
        label="Docs URL"
        type="url"
        value={fields.documentationUrl}
        onChange={(documentationUrl) => onUpdateFields({ documentationUrl })}
      />
    </div>
  );
}

function DiscoveryScreen({
  errors,
  fields,
  onUpdateFields,
}: RegistrationStepFieldsProps) {
  return (
    <div className="grid gap-5">
      <CategoryFieldset
        error={errors.categories}
        selectedValues={fields.categories}
        onChange={(categories) => onUpdateFields({ categories })}
      />
      <SmartAssemblyFieldset
        error={errors.smartAssemblyTypes}
        selectedValues={fields.smartAssemblyTypes}
        onChange={(smartAssemblyTypes) => onUpdateFields({ smartAssemblyTypes })}
      />
      <ServerTenantFilter
        error={errors.serverTenant}
        value={fields.serverTenant}
        onChange={(serverTenant) =>
          onUpdateFields({
            serverTenant,
          })
        }
      />
    </div>
  );
}

function PackagesScreen({
  fields,
  packageVerification,
  onUpdateFields,
  onVerifyPackages,
}: RegistrationStepFieldsProps) {
  return (
    <BuilderPackageStepScreen
      packageVerification={packageVerification}
      packages={fields.suiPackages}
      onChange={(suiPackages) => onUpdateFields({ suiPackages })}
      onVerifyPackages={onVerifyPackages}
    />
  );
}

function CategoryFieldset({
  error,
  selectedValues,
  onChange,
}: {
  error?: string;
  selectedValues: DappIndexCategoryId[];
  onChange: (values: DappIndexCategoryId[]) => void;
}) {
  const errorId = getBuilderFieldErrorId('builder-categories', error);

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="grid gap-2"
    >
      <legend className="mb-2 text-xs font-bold uppercase text-(--color-neutral-60)">
        Categories
      </legend>
      <div className="grid gap-2 md:grid-cols-2">
        {DAPP_INDEX_CATEGORIES.map((category) => (
          <CheckboxOption
            key={category.id}
            checked={selectedValues.includes(category.id)}
            error={Boolean(error)}
            label={category.label}
            name="builder-categories"
            subLabel={category.subLabel}
            value={category.id}
            onChange={() =>
              onChange(toggleArrayValue(selectedValues, category.id))
            }
          />
        ))}
      </div>
      <BuilderFieldError id="builder-categories" message={error} />
    </fieldset>
  );
}

function SmartAssemblyFieldset({
  error,
  selectedValues,
  onChange,
}: {
  error?: string;
  selectedValues: DappIndexSmartAssemblyType[];
  onChange: (values: DappIndexSmartAssemblyType[]) => void;
}) {
  const errorId = getBuilderFieldErrorId('builder-smart-assemblies', error);

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="grid gap-2"
    >
      <legend className="mb-2 text-xs font-bold uppercase text-(--color-neutral-60)">
        Smart assemblies
      </legend>
      <div className="grid gap-2 md:grid-cols-3">
        {DAPP_INDEX_SMART_ASSEMBLY_TYPES.map((assembly) => (
          <CheckboxOption
            key={assembly.id}
            checked={selectedValues.includes(assembly.id)}
            error={Boolean(error)}
            label={assembly.label}
            name="builder-smart-assemblies"
            value={assembly.id}
            onChange={() =>
              onChange(toggleArrayValue(selectedValues, assembly.id))
            }
          />
        ))}
      </div>
      <BuilderFieldError id="builder-smart-assemblies" message={error} />
    </fieldset>
  );
}

function ServerTenantFilter({
  error,
  value,
  onChange,
}: {
  error?: string;
  value: DappIndexServerTenant | '';
  onChange: (value: DappIndexServerTenant) => void;
}) {
  const errorId = getBuilderFieldErrorId('builder-server-tenant', error);

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="grid gap-2"
    >
      <legend className="mb-2 text-xs font-bold uppercase text-(--color-neutral-60)">
        Server tenant
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        {DAPP_INDEX_SERVER_TENANTS.map((tenant) => {
          const selected = value === tenant;

          return (
            <Button
              key={tenant}
              size="small"
              type="button"
              variant={selected ? 'primary' : 'secondary'}
              onClick={() => onChange(tenant)}
            >
              {DAPP_INDEX_SERVER_TENANT_LABELS[tenant]}
            </Button>
          );
        })}
      </div>
      <BuilderFieldError id="builder-server-tenant" message={error} />
    </fieldset>
  );
}

function CheckboxOption({
  checked,
  error,
  label,
  name,
  subLabel,
  value,
  onChange,
}: {
  checked: boolean;
  error: boolean;
  label: string;
  name: string;
  subLabel?: string;
  value: string;
  onChange: () => void;
}) {
  const checkboxClassName = [
    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 transition-colors',
    checked ? 'bg-(--color-martian-red)' : '',
    error
      ? 'border-(--color-alert)'
      : 'border-(--color-martian-red) hover:border-(--color-neutral) group-hover:border-(--color-neutral)',
    error ? '' : 'peer-focus-visible:border-(--color-martian-red)',
    'peer-disabled:border-(--color-neutral-20) peer-disabled:bg-(--color-neutral-20)',
    checked && !error
      ? 'group-hover:border-(--color-neutral) group-hover:bg-(--color-neutral)'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  const checkmarkClassName = [
    'h-3 w-2 bg-(--color-crude) transition-colors',
    checked ? 'opacity-100' : 'opacity-0',
    'group-hover:bg-(--color-crude)',
    'peer-disabled:bg-(--color-neutral-40)',
  ].join(' ');

  return (
    <label className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border border-(--color-neutral-20) p-3 text-sm text-(--color-neutral) hover:border-(--color-neutral-50)">
      <input
        checked={checked}
        className="peer sr-only"
        name={name}
        type="checkbox"
        value={value}
        onChange={onChange}
      />
      <span aria-hidden="true" className={checkboxClassName}>
        <span className={checkmarkClassName} />
      </span>
      <span className="grid gap-1">
        <span className="font-bold uppercase">{label}</span>
        {subLabel ? (
          <span className="text-xs text-(--color-neutral-60)">
            {subLabel}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
