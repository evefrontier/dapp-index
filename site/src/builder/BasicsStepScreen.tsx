import { RegistrationDraftBasicsSchema } from '@/schemas/registration-draft-fields';
import { zodFieldValidator } from '@/schemas/zodFieldErrors';
import { TextAreaField, TextField } from './FormFields';
import type {
  RegistrationDraftFieldErrors,
  RegistrationDraftFields,
} from './registrationDraftFields';
import { useRegistrationDraftStepForm } from './useRegistrationDraftStepForm';

export type BasicsStepScreenProps = {
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
};

export function BasicsStepScreen({
  errors,
  fields,
  onUpdateFields,
}: BasicsStepScreenProps) {
  const { form, updateField } = useRegistrationDraftStepForm({
    values: {
      name: fields.name,
      slug: fields.slug,
      summary: fields.summary,
    },
    onUpdateFields,
  });

  return (
    <div className="grid gap-4">
      <form.Field
        name="name"
        validators={{
          onChange: zodFieldValidator(RegistrationDraftBasicsSchema.shape.name),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.name}
            hint="The public display name for your dapp. It appears across the index and dapp cards, so keep it consistent with your other branding."
            id="builder-name"
            label="Name"
            maxLength={80}
            value={field.state.value}
            onChange={(name) => updateField('name', name, field.handleChange)}
          />
        )}
      </form.Field>
      <form.Field
        name="slug"
        validators={{
          onChange: zodFieldValidator(RegistrationDraftBasicsSchema.shape.slug),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.slug}
            hint="A short, URL-safe identifier for your dapp using lowercase letters, numbers, and hyphens. It's used in the listing's URL and must be unique across the index."
            id="builder-slug"
            label="Slug"
            maxLength={50}
            value={field.state.value}
            onChange={(slug) => updateField('slug', slug, field.handleChange)}
          />
        )}
      </form.Field>
      <form.Field
        name="summary"
        validators={{
          onChange: zodFieldValidator(RegistrationDraftBasicsSchema.shape.summary),
        }}
      >
        {(field) => (
          <TextAreaField
            error={field.state.meta.errors[0] ?? errors.summary}
            hint="A one-line pitch shown alongside your dapp's name in listings. Keep it short and specific — it's capped at 180 characters."
            id="builder-summary"
            label="Summary"
            maxLength={180}
            rows={3}
            value={field.state.value}
            onChange={(summary) =>
              updateField('summary', summary, field.handleChange)
            }
          />
        )}
      </form.Field>
    </div>
  );
}
