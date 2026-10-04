declare global {
  namespace Express {
    interface Request {
      /** Verbatim request body bytes as UTF-8, captured before any parsing. */
      rawBody: string;
    }
  }
}

export {};
