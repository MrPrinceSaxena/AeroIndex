// Thin fetch wrapper: resolves the API base URL from the environment, parses
// JSON, and throws a typed ApiError with the backend's `detail` message on
// any non-2xx response so callers (React Query hooks) get a useful message
// instead of a generic "fetch failed".

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    const url = new URL(`${API_BASE_URL}${cleanPath}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  // Relative URL fallback (e.g. proxying or same-origin)
  const base = API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
  if (!params) return base;
  const filteredParams = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (filteredParams.length === 0) return base;
  const query = "?" + new URLSearchParams(Object.fromEntries(filteredParams)).toString();
  return `${base}${query}`;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const targetUrl = buildUrl(path, params);

  let response: Response;
  try {
    response = await fetch(targetUrl, { headers: { Accept: "application/json" } });
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

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const targetUrl = buildUrl(path);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Could not reach the APIx API. Is the backend running?");
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const errBody = await response.json();
      if (typeof errBody?.detail === "string") detail = errBody.detail;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, detail);
  }

  return (await response.json()) as T;
}

export async function triggerSchedulerRun(): Promise<{ status: string; message: string; timestamp: string }> {
  return apiPost("/system/scheduler/trigger");
}


