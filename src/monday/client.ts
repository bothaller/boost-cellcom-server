import { config } from '../config.js';
import { MondayApiError } from '../errors.js';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
  error_message?: string;
}

export async function mondayRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(config.MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.MONDAY_API_TOKEN,
        'API-Version': config.MONDAY_API_VERSION,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (cause) {
    throw new MondayApiError('Failed to reach monday.com API', String(cause));
  }

  const body = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok) {
    throw new MondayApiError(`monday.com API returned ${response.status}`, body);
  }

  if (body.errors?.length) {
    throw new MondayApiError(body.errors.map((e) => e.message).join('; '), body.errors);
  }

  if (body.error_message) {
    throw new MondayApiError(body.error_message, body);
  }

  if (!body.data) {
    throw new MondayApiError('monday.com API returned no data', body);
  }

  return body.data;
}
