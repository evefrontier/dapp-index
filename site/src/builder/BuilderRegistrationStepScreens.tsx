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
  BuilderSelectField,
  BuilderTextAreaField,
  BuilderTextField,
  getBuilderFieldErrorId,
} from './BuilderFormFields';
import { BuilderMediaStepScreen } from './BuilderMediaStepScreen';
import { BuilderPackageStepScreen } from './BuilderPackageStepScreen';
import {
  isRegistrationDraftFieldStep,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFields,
  type RegistrationDraftFieldStep,
} from './registrationDraftFields';
import type { RegistrationDraftPackageVerificationState } from './registrationDraftPackages';

type RegistrationStepScreenProps = {
  activeStep: DraftStep;
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  media: DraftMedia[];
  mediaError: string | null;
  mediaPending: boolean;
  mediaPreviewUrls: Record<string, string>;
  packageVerification: RegistrationDraftPackageVerificationState;
  onDeleteMedia: (mediaId: string) => Promise<void>;
  onUpdateMedia: (
    mediaId: string,
    update: DraftMediaUpdate,
  ) => Promise<void>;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
  onUploadMedia: (files: File[]) => Promise<void>;
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
  packageVerification,
  onDeleteMedia,
  onUpdateMedia,
  onUpdateFields,
  onUploadMedia,
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
        onUploadMedia={onUploadMedia}
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
      <BuilderSelectField
        error={errors.serverTenant}
        id="builder-server-tenant"
        label="Server tenant"
        value={fields.serverTenant}
        onChange={(serverTenant) =>
          onUpdateFields({
            serverTenant: serverTenant as DappIndexServerTenant | '',
          })
        }
      >
        <option value="">Choose tenant</option>
        {DAPP_INDEX_SERVER_TENANTS.map((tenant) => (
          <option key={tenant} value={tenant}>
            {DAPP_INDEX_SERVER_TENANT_LABELS[tenant]}
          </option>
        ))}
      </BuilderSelectField>
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
      <legend className="text-xs font-bold uppercase text-(--color-neutral-60)">
        Categories
      </legend>
      <div className="grid gap-2 md:grid-cols-2">
        {DAPP_INDEX_CATEGORIES.map((category) => (
          <CheckboxOption
            key={category.id}
            checked={selectedValues.includes(category.id)}
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
      <legend className="text-xs font-bold uppercase text-(--color-neutral-60)">
        Smart assemblies
      </legend>
      <div className="grid gap-2 md:grid-cols-3">
        {DAPP_INDEX_SMART_ASSEMBLY_TYPES.map((assembly) => (
          <CheckboxOption
            key={assembly.id}
            checked={selectedValues.includes(assembly.id)}
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

function CheckboxOption({
  checked,
  label,
  name,
  subLabel,
  value,
  onChange,
}: {
  checked: boolean;
  label: string;
  name: string;
  subLabel?: string;
  value: string;
  onChange: () => void;
}) {
  return (
    <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border border-(--color-neutral-20) p-3 text-sm text-(--color-neutral) hover:border-(--color-neutral-50)">
      <input
        checked={checked}
        className="mt-0.5 h-4 w-4 accent-(--color-martian-red)"
        name={name}
        type="checkbox"
        value={value}
        onChange={onChange}
      />
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
