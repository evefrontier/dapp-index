import { Button } from '@evefrontier/ui';
import { RegistrationDraftDiscoverySchema } from '@/schemas/registration-draft-fields';
import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SERVER_TENANT_LABELS,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
  type DappIndexCategoryId,
  type DappIndexServerTenant,
  type DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import { CheckboxOption } from './CheckboxOption';
import { FieldError, getFieldErrorId } from './FormFields';
import type {
  RegistrationDraftFieldErrors,
  RegistrationDraftFields,
} from './registrationDraftFields';
import { useRegistrationDraftStepForm } from './useRegistrationDraftStepForm';

export type DiscoveryStepScreenProps = {
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
};

export function DiscoveryStepScreen({
  errors,
  fields,
  onUpdateFields,
}: DiscoveryStepScreenProps) {
  useRegistrationDraftStepForm({
    values: {
      categories: fields.categories,
      smartAssemblyTypes: fields.smartAssemblyTypes,
      serverTenant: fields.serverTenant,
    },
    schema: RegistrationDraftDiscoverySchema,
    onUpdateFields,
  });

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
        onChange={(serverTenant) => onUpdateFields({ serverTenant })}
      />
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
  const errorId = getFieldErrorId('builder-categories', error);

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
  const errorId = getFieldErrorId('builder-smart-assemblies', error);

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
      <FieldError id="builder-smart-assemblies" message={error} />
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
  const errorId = getFieldErrorId('builder-server-tenant', error);

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
      <FieldError id="builder-server-tenant" message={error} />
    </fieldset>
  );
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
