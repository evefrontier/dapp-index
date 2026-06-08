import { RegistrationDraftBasicsSchema } from '@/schemas/registration-draft-fields';
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
    schema: RegistrationDraftBasicsSchema,
    onUpdateFields,
  });

  return (
    <div className="grid gap-4">
      <form.Field name="name">
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.name}
            id="builder-name"
            label="Name"
            maxLength={80}
            value={field.state.value}
            onChange={(name) => updateField('name', name, field.handleChange)}
          />
        )}
      </form.Field>
      <form.Field name="slug">
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.slug}
            id="builder-slug"
            label="Slug"
            maxLength={50}
            value={field.state.value}
            onChange={(slug) => updateField('slug', slug, field.handleChange)}
          />
        )}
      </form.Field>
      <form.Field name="summary">
        {(field) => (
          <TextAreaField
            error={field.state.meta.errors[0] ?? errors.summary}
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
