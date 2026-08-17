/**
 * Public API base for rukasente-be (includes /api/v1 prefix).
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!url) {
    return "http://localhost:8080/api/v1";
  }
  return url;
}

/** Origin of rukasente-be (no /api/v1) for Swagger/ReDoc. */
export function getApiDocsUrl(): string {
  return (
    getApiBaseUrl().replace(/\/api\/v1$/i, "") + "/partner/documentation"
  );
}
