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
            hint="The longer write-up shown on your dapp's detail page. Explain what it does, who it's for, and how it fits the Frontier ecosystem."
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
        name="liveUrl"
        validators={{
          onChange: zodFieldValidator(RegistrationDraftAboutSchema.shape.liveUrl),
        }}
      >
        {(field) => (
          <TextField
            error={field.state.meta.errors[0] ?? errors.liveUrl}
            hint="The HTTPS link players use to open your dapp. This is required and must resolve to your live application."
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
            hint="An optional HTTPS link to your dapp's public source code, for builders and reviewers who want to inspect the implementation."
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
            hint="An optional HTTPS link to setup guides, API docs, or other reference material for your dapp."
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
