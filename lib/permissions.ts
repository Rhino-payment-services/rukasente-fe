/** Mirrors rukasente-be permission keys used for nav RBAC. */
export const Perm = {
  StaffView: "staff.view",
  BorrowerView: "borrower.view",
  SubscriptionView: "subscription.view",
  ScoringView: "scoring.view",
  IntegrationView: "integration.view",
  RoleView: "role.view",
  PermissionView: "permission.view",
} as const;

export function hasPermission(
  permissions: string[] | undefined,
  key: string
): boolean {
  return !!permissions?.includes(key);
}
