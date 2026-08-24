// Thin fetch wrapper: resolves the API base URL from the environment, parses
// JSON, and throws a typed ApiError with the backend's `detail` message on
// any non-2xx response so callers (React Query hooks) get a useful message
// instead of a generic "fetch failed".

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError(0, "Could not reach the APIx API. Is the backend running?");
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // response body wasn't JSON -- keep the generic message
    }
    throw new ApiError(response.status, detail);
  }

  return (await response.json()) as T;
}
