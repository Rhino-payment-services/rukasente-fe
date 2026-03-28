import type { AxiosResponse } from "axios";

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

export class ApiError extends Error {
  constructor(
    public code: string | undefined,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function unwrapEnvelope<T>(res: AxiosResponse<ApiEnvelope<T>>): T {
  const body = res.data;
  if (!body.success) {
    throw new ApiError(body.error?.code, body.error?.message ?? "Request failed");
  }
  if (body.data === undefined) {
    throw new ApiError(undefined, "Empty response data");
  }
  return body.data;
}
