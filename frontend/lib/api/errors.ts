/** Format błędu zwracany przez HttpExceptionFilter w backendzie. */
export type BackendErrorBody = {
  timestamp?: string;
  path?: string;
  method?: string;
  statusCode: number;
  error: string;
  message: string | string[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  /** Zawsze tablica: przy błędach walidacji (400) jeden komunikat na pole. */
  readonly messages: string[];

  constructor(status: number, error: string, messages: string[]) {
    super(messages[0] ?? error);
    this.name = "ApiError";
    this.status = status;
    this.error = error;
    this.messages = messages;
  }

  static from(body: unknown, response?: Response): ApiError {
    const status = response?.status ?? 500;
    if (isBackendErrorBody(body)) {
      const messages = Array.isArray(body.message) ? body.message : [body.message];
      return new ApiError(body.statusCode ?? status, body.error, messages);
    }
    const text = response?.statusText || "Request failed";
    return new ApiError(status, text, [text]);
  }
}

function isBackendErrorBody(body: unknown): body is BackendErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "statusCode" in body &&
    "message" in body
  );
}

/**
 * Rozpakowuje wynik openapi-fetch: zwraca `data` albo rzuca ApiError.
 *
 *   const user = await unwrap(api.GET("/auth/context"));
 */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request;
  if (error !== undefined || !response.ok) {
    throw ApiError.from(error, response);
  }
  return data as T;
}
