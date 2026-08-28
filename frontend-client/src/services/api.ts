const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new ApiError(
      response.status,
      payload?.error?.message ?? "Something went wrong. Please try again.",
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}