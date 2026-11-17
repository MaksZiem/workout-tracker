export type ErrorParams = Record<string, string | number>;

export type BackendErrorBody = {
  statusCode: number;
  code?: string;
  message: string | string[];
  params?: ErrorParams;
  error?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  readonly code: string | undefined;
  readonly params: ErrorParams;
  readonly messages: string[];

  constructor(
    status: number,
    error: string,
    messages: string[],
    code?: string,
    params: ErrorParams = {},
  ) {
    super(messages[0] ?? error);
    this.name = "ApiError";
    this.status = status;
    this.error = error;
    this.messages = messages;
    this.code = code;
    this.params = params;
  }

  static from(body: unknown, response?: Response): ApiError {
    const status = response?.status ?? 500;
    if (isBackendErrorBody(body)) {
      const messages = Array.isArray(body.message) ? body.message : [body.message];
      return new ApiError(
        body.statusCode ?? status,
        body.error ?? response?.statusText ?? "Error",
        messages,
        body.code,
        body.params,
      );
    }
    const text = response?.statusText || "Request failed";
    return new ApiError(status, text, [text]);
  }
}

export function errorCode(body: unknown): string | undefined {
  return isBackendErrorBody(body) ? body.code : undefined;
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
