import { UploadError } from './uploadErrors';

export type PutPresignedObjectInput = {
  uploadUrl: string;
  headers: Record<string, string>;
  body: BodyInit;
  fetchImpl?: typeof fetch;
};

export async function putPresignedObject(
  input: PutPresignedObjectInput,
): Promise<void> {
  const fetchImpl = input.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(input.uploadUrl, {
      method: 'PUT',
      headers: input.headers,
      body: input.body,
    });
  } catch (cause) {
    throw new UploadError(
      'put_network',
      'Could not upload file to storage.',
      { cause },
    );
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text.trim() !== '') {
        detail = `${detail}: ${text.slice(0, 200)}`;
      }
    } catch {
      // ignore body read failures
    }
    throw new UploadError(
      'put_http',
      `Storage rejected the upload (${detail}).`,
      { status: response.status },
    );
  }
}
