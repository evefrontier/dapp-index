import { useForm } from '@tanstack/react-form';
import { useEffect } from 'react';
import type { RegistrationDraftFields } from './registrationDraftFields';

export function useRegistrationDraftStepForm<T extends Record<string, unknown>>({
  values,
  onUpdateFields,
}: {
  values: T;
  onUpdateFields: (fields: Partial<RegistrationDraftFields>) => void;
}) {
  const form = useForm({
    defaultValues: values,
  });

  const valuesKey = JSON.stringify(values);

  useEffect(() => {
    form.reset(values);
  }, [form, values, valuesKey]);

  return {
    form,
    updateField<K extends keyof T & keyof RegistrationDraftFields>(
      field: K,
      value: RegistrationDraftFields[K],
      handleChange: (nextValue: RegistrationDraftFields[K]) => void,
    ) {
      handleChange(value);
      onUpdateFields({ [field]: value } as Partial<RegistrationDraftFields>);
    },
  };
}
