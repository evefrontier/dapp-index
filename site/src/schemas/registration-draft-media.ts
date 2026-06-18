import { z } from 'zod';
import {
  DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_MEDIA_ROLES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
} from '@/constants';

export const REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH = 240;

export const RegistrationDraftMediaRoleSchema = z.enum(DAPP_INDEX_MEDIA_ROLES);

export const RegistrationDraftMediaUploadMimeSchema = z.enum([
  ...DAPP_INDEX_IMAGE_MIME_TYPES,
  DAPP_INDEX_VIDEO_MIME_TYPE,
]);

export const RegistrationDraftMediaItemSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.enum(['screenshot', 'video']),
  role: RegistrationDraftMediaRoleSchema,
  name: z.string().min(1),
  mimeType: z.string().min(1),
  alt: z
    .string()
    .max(
      REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH,
      'Alt text must be 240 characters or fewer.',
    )
    .optional(),
  caption: z
    .string()
    .max(
      REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH,
      'Caption must be 240 characters or fewer.',
    )
    .optional(),
});

export const RegistrationDraftMediaStepSchema = z.array(
  RegistrationDraftMediaItemSchema,
);

export const RegistrationDraftMediaUpdateSchema = z.object({
  role: RegistrationDraftMediaRoleSchema.optional(),
  alt: z
    .string()
    .max(
      REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH,
      'Alt text must be 240 characters or fewer.',
    )
    .optional(),
  caption: z
    .string()
    .max(
      REGISTRATION_DRAFT_MEDIA_TEXT_MAX_LENGTH,
      'Caption must be 240 characters or fewer.',
    )
    .optional(),
});
