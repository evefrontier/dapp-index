import type { ComponentType, ReactNode } from 'react';
import type { DraftStep } from '@/storage/draftStorage';
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
  isRegistrationDraftFieldStep,
  type RegistrationDraftFieldErrors,
  type RegistrationDraftFields,
  type RegistrationDraftFieldStep,
} from './registrationDraftFields';

type RegistrationStepScreenProps = {
  activeStep: DraftStep;
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
};

type RegistrationStepFieldsProps = Omit<
  RegistrationStepScreenProps,
  'activeStep'
>;

type RegistrationFieldProps = {
  error?: string;
  id: string;
  label: string;
};

const FIELD_INPUT_CLASS_NAME =
  'w-full border border-[var(--color-neutral-30)] bg-[var(--color-background-elevated)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none transition-colors focus:border-[var(--color-primary)]';
const FIELD_ERROR_INPUT_CLASS_NAME =
  'border-[var(--color-error)] focus:border-[var(--color-error)]';

export function BuilderRegistrationStepScreen({
  activeStep,
  errors,
  fields,
  onUpdateFields,
}: RegistrationStepScreenProps) {
  const StepScreen = isRegistrationDraftFieldStep(activeStep)
    ? REGISTRATION_DRAFT_STEP_SCREENS[activeStep]
    : null;

  if (StepScreen) {
    return (
      <StepScreen
        errors={errors}
        fields={fields}
        onUpdateFields={onUpdateFields}
      />
    );
  }

  return (
    <p className="text-sm text-[var(--color-neutral-70)]">
      Screen content lands in a later builder PR.
    </p>
  );
}

const REGISTRATION_DRAFT_STEP_SCREENS = {
  basics: BasicsScreen,
  about: AboutScreen,
  discovery: DiscoveryScreen,
  proofs: ProofsScreen,
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
      <TextField
        error={errors.name}
        id="builder-name"
        label="Name"
        maxLength={80}
        value={fields.name}
        onChange={(name) => onUpdateFields({ name })}
      />
      <TextField
        error={errors.slug}
        id="builder-slug"
        label="Slug"
        maxLength={50}
        value={fields.slug}
        onChange={(slug) => onUpdateFields({ slug })}
      />
      <TextAreaField
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
      <TextAreaField
        error={errors.description}
        id="builder-description"
        label="Description"
        maxLength={4000}
        rows={6}
        value={fields.description}
        onChange={(description) => onUpdateFields({ description })}
      />
      <TextField
        error={errors.liveUrl}
        id="builder-live-url"
        label="Live URL"
        type="url"
        value={fields.liveUrl}
        onChange={(liveUrl) => onUpdateFields({ liveUrl })}
      />
      <TextField
        error={errors.repositoryUrl}
        id="builder-repository-url"
        label="Repo URL"
        type="url"
        value={fields.repositoryUrl}
        onChange={(repositoryUrl) => onUpdateFields({ repositoryUrl })}
      />
      <TextField
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
      <SelectField
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
      </SelectField>
    </div>
  );
}

function ProofsScreen({
  errors,
  fields,
  onUpdateFields,
}: RegistrationStepFieldsProps) {
  return (
    <div className="grid gap-4">
      <TextField
        error={errors.domainProofUrl}
        id="builder-domain-proof-url"
        label="Domain proof URL"
        type="url"
        value={fields.domainProofUrl}
        onChange={(domainProofUrl) => onUpdateFields({ domainProofUrl })}
      />
      <TextAreaField
        error={errors.notes}
        id="builder-notes"
        label="Notes"
        maxLength={2000}
        rows={6}
        value={fields.notes}
        onChange={(notes) => onUpdateFields({ notes })}
      />
    </div>
  );
}

function TextField({
  error,
  id,
  label,
  maxLength,
  type = 'text',
  value,
  onChange,
}: RegistrationFieldProps & {
  maxLength?: number;
  type?: 'text' | 'url';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell error={error} id={id} label={label}>
      <input
        aria-describedby={getErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={getFieldInputClassName(error)}
        id={id}
        maxLength={maxLength}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </FieldShell>
  );
}

function TextAreaField({
  error,
  id,
  label,
  maxLength,
  rows,
  value,
  onChange,
}: RegistrationFieldProps & {
  maxLength?: number;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell error={error} id={id} label={label}>
      <textarea
        aria-describedby={getErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={getFieldInputClassName(error)}
        id={id}
        maxLength={maxLength}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </FieldShell>
  );
}

function SelectField({
  children,
  error,
  id,
  label,
  value,
  onChange,
}: RegistrationFieldProps & {
  children: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell error={error} id={id} label={label}>
      <select
        aria-describedby={getErrorId(id, error)}
        aria-invalid={error ? true : undefined}
        className={getFieldInputClassName(error)}
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {children}
      </select>
    </FieldShell>
  );
}

function FieldShell({
  children,
  error,
  id,
  label,
}: RegistrationFieldProps & {
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label
        className="text-xs font-bold uppercase text-[var(--color-neutral-60)]"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
      <FieldError id={id} message={error} />
    </div>
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
  const errorId = getErrorId('builder-categories', error);

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="grid gap-2"
    >
      <legend className="text-xs font-bold uppercase text-[var(--color-neutral-60)]">
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
      <FieldError id="builder-categories" message={error} />
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
  const errorId = getErrorId('builder-smart-assemblies', error);

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="grid gap-2"
    >
      <legend className="text-xs font-bold uppercase text-[var(--color-neutral-60)]">
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
      <FieldError id="builder-smart-assemblies" message={error} />
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
    <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 border border-[var(--color-neutral-20)] p-3 text-sm text-[var(--color-foreground)] hover:border-[var(--color-neutral-50)]">
      <input
        checked={checked}
        className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        name={name}
        type="checkbox"
        value={value}
        onChange={onChange}
      />
      <span className="grid gap-1">
        <span className="font-bold uppercase">{label}</span>
        {subLabel ? (
          <span className="text-xs text-[var(--color-neutral-60)]">
            {subLabel}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="text-xs text-[var(--color-error)]" id={`${id}-error`}>
      {message}
    </p>
  );
}

function getFieldInputClassName(error?: string): string {
  return error
    ? `${FIELD_INPUT_CLASS_NAME} ${FIELD_ERROR_INPUT_CLASS_NAME}`
    : FIELD_INPUT_CLASS_NAME;
}

function getErrorId(id: string, error?: string): string | undefined {
  return error ? `${id}-error` : undefined;
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
