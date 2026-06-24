import { RegistrationDraftDiscoverySchema } from '@/schemas/registration-draft-fields';
import { zodFieldValidator } from '@/schemas/zodFieldErrors';
import {
  DAPP_INDEX_CATEGORIES,
  DAPP_INDEX_SERVER_TENANTS,
  DAPP_INDEX_SERVER_TENANT_LABELS,
  DAPP_INDEX_SMART_ASSEMBLY_TYPES,
  type DappIndexCategoryId,
  type DappIndexServerTenant,
  type DappIndexSmartAssemblyType,
} from '@/types/dapp-index';
import { BuilderToggle } from './BuilderToggle';
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
  const { form, updateField } = useRegistrationDraftStepForm({
    values: {
      categories: fields.categories,
      smartAssemblyTypes: fields.smartAssemblyTypes,
      serverTenant: fields.serverTenant,
    },
    onUpdateFields,
  });

  return (
    <div className="grid gap-5">
      <form.Field
        name="categories"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftDiscoverySchema.shape.categories,
          ),
        }}
      >
        {(field) => (
          <CategoryFieldset
            error={field.state.meta.errors[0] ?? errors.categories}
            selectedValues={field.state.value}
            onChange={(categories) =>
              updateField('categories', categories, field.handleChange)
            }
          />
        )}
      </form.Field>
      <form.Field
        name="smartAssemblyTypes"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftDiscoverySchema.shape.smartAssemblyTypes,
          ),
        }}
      >
        {(field) => (
          <SmartAssemblyFieldset
            error={field.state.meta.errors[0] ?? errors.smartAssemblyTypes}
            selectedValues={field.state.value}
            onChange={(smartAssemblyTypes) =>
              updateField(
                'smartAssemblyTypes',
                smartAssemblyTypes,
                field.handleChange,
              )
            }
          />
        )}
      </form.Field>
      <form.Field
        name="serverTenant"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftDiscoverySchema.shape.serverTenant,
          ),
        }}
      >
        {(field) => (
          <ServerTenantFilter
            error={field.state.meta.errors[0] ?? errors.serverTenant}
            value={field.state.value}
            onChange={(serverTenant) =>
              updateField('serverTenant', serverTenant, field.handleChange)
            }
          />
        )}
      </form.Field>
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
      className="builder-fieldset grid gap-2"
    >
      <legend>Categories</legend>
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
      className="builder-fieldset grid gap-2"
    >
      <legend>Smart assemblies</legend>
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

const SERVER_TENANT_OFF = DAPP_INDEX_SERVER_TENANTS[0];
const SERVER_TENANT_ON = DAPP_INDEX_SERVER_TENANTS[1];

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
  const isUtopia = value === SERVER_TENANT_ON;

  return (
    <fieldset
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      className="builder-fieldset grid gap-2"
    >
      <legend>Server tenant</legend>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="builder-toggle-endpoint"
          data-active={!isUtopia && value !== '' ? '' : undefined}
        >
          {DAPP_INDEX_SERVER_TENANT_LABELS[SERVER_TENANT_OFF]}
        </span>
        <BuilderToggle
          checked={isUtopia}
          error={Boolean(error)}
          id="builder-server-tenant"
          onChange={() => {
            if (value === '') {
              onChange(SERVER_TENANT_OFF);
              return;
            }
            onChange(isUtopia ? SERVER_TENANT_OFF : SERVER_TENANT_ON);
          }}
        />
        <span
          className="builder-toggle-endpoint"
          data-active={isUtopia ? '' : undefined}
        >
          {DAPP_INDEX_SERVER_TENANT_LABELS[SERVER_TENANT_ON]}
        </span>
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
