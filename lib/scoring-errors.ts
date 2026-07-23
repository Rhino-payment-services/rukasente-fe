import axios from "axios";
import { ApiError } from "@/lib/api-envelope";

/** Pull a readable message from axios / ApiError / unknown. */
export function scoringErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.code ? `${err.message} (${err.code})` : err.message;
  }
  if (axios.isAxiosError(err)) {
    if (
      err.code === "ERR_CANCELED" ||
      err.name === "CanceledError" ||
      axios.isCancel(err)
    ) {
      return "";
    }
    const apiMsg =
      (err.response?.data as { error?: { message?: string; code?: string } })
        ?.error?.message ??
      (err.response?.data as { message?: string })?.message;
    const code = (err.response?.data as { error?: { code?: string } })?.error
      ?.code;
    if (apiMsg) return code ? `${apiMsg} (${code})` : apiMsg;
    if (err.code === "ECONNABORTED" || /timeout/i.test(err.message)) {
      return "Scoring timed out. Check that the scoring service is running.";
    }
    if (err.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (err.response?.status) {
      return `Request failed with HTTP ${err.response.status}.`;
    }
    return err.message || "Failed to run scoring";
  }
  if (err instanceof Error) return err.message;
  return "Failed to run scoring";
}
