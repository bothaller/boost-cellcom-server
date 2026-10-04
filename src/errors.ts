export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class MondayApiError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(502, message, details);
    this.name = 'MondayApiError';
  }
}
