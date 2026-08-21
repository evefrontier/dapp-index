import { RegistrationDraftAboutSchema } from '@/schemas/registration-draft-fields';
import { zodFieldValidator } from '@/schemas/zodFieldErrors';
import { TextAreaField, TextField } from './FormFields';
import type {
  RegistrationDraftFieldErrors,
  RegistrationDraftFields,
} from './registrationDraftFields';
import { useRegistrationDraftStepForm } from './useRegistrationDraftStepForm';

export type AboutStepScreenProps = {
  errors: RegistrationDraftFieldErrors;
  fields: RegistrationDraftFields;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
};

export function AboutStepScreen({
  errors,
  fields,
  onUpdateFields,
}: AboutStepScreenProps) {
  const { form, updateField } = useRegistrationDraftStepForm({
    values: {
      description: fields.description,
      tribe: fields.tribe,
      riderName: fields.riderName,
      liveUrl: fields.liveUrl,
      repositoryUrl: fields.repositoryUrl,
      documentationUrl: fields.documentationUrl,
    },
    onUpdateFields,
  });

  return (
    <div className="grid gap-4">
      <form.Field
        name="description"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftAboutSchema.shape.description,
          ),
        }}
      >
        {(field) => (
          <TextAreaField
            error={field.state.meta.errors[0] ?? errors.description}
            id="builder-description"
            label="Description"
            maxLength={4000}
            rows={6}
            value={field.state.value}
            onChange={(description) =>
              updateField('description', description, field.handleChange)
            }
          />
        )}
      </form.Field>
      <form.Field
        name="tribe"
        validators={{
          onChange: zodFieldValidator(RegistrationDraftAboutSchema.shape.tribe),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.tribe}
            id="builder-tribe"
            label="Tribe"
            maxLength={80}
            value={field.state.value}
            onChange={(tribe) => updateField('tribe', tribe, field.handleChange)}
          />
        )}
      </form.Field>
      <form.Field
        name="riderName"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftAboutSchema.shape.riderName,
          ),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.riderName}
            id="builder-rider-name"
            label="Rider"
            maxLength={80}
            value={field.state.value}
            onChange={(riderName) =>
              updateField('riderName', riderName, field.handleChange)
            }
          />
        )}
      </form.Field>
      <form.Field
        name="liveUrl"
        validators={{
          onChange: zodFieldValidator(RegistrationDraftAboutSchema.shape.liveUrl),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.liveUrl}
            id="builder-live-url"
            label="Live URL"
            type="url"
            value={field.state.value}
            onChange={(liveUrl) =>
              updateField('liveUrl', liveUrl, field.handleChange)
            }
          />
        )}
      </form.Field>
      <form.Field
        name="repositoryUrl"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftAboutSchema.shape.repositoryUrl,
          ),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.repositoryUrl}
            id="builder-repository-url"
            label="Repo URL"
            type="url"
            value={field.state.value}
            onChange={(repositoryUrl) =>
              updateField('repositoryUrl', repositoryUrl, field.handleChange)
            }
          />
        )}
      </form.Field>
      <form.Field
        name="documentationUrl"
        validators={{
          onChange: zodFieldValidator(
            RegistrationDraftAboutSchema.shape.documentationUrl,
          ),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.documentationUrl}
            id="builder-documentation-url"
            label="Docs URL"
            type="url"
            value={field.state.value}
            onChange={(documentationUrl) =>
              updateField(
                'documentationUrl',
                documentationUrl,
                field.handleChange,
              )
            }
          />
        )}
      </form.Field>
    </div>
  );
}
