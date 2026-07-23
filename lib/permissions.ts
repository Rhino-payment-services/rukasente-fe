/** Mirrors rukasente-be permission keys used for nav RBAC. */
export const Perm = {
  StaffView: "staff.view",
  BorrowerView: "borrower.view",
  BorrowerUpdate: "borrower.update",
  SubscriptionView: "subscription.view",
  ScoringView: "scoring.view",
  IntegrationView: "integration.view",
  PartnerView: "partner.view",
  PartnerCreate: "partner.create",
  PartnerUpdate: "partner.update",
  PartnerManageCredentials: "partner.credentials.manage",
  PartnerViewLogs: "partner.logs.view",
  LoanProductView: "loan.product.view",
  LoanProductCreate: "loan.product.create",
  LoanApplicationView: "loan.application.view",
  LoanApplicationReview: "loan.application.review",
  LoanApplicationApprove: "loan.application.approve",
  LoanApplicationDecline: "loan.application.decline",
  LoanRepayment: "loan.repayment",
  RoleView: "role.view",
  PermissionView: "permission.view",
} as const;

export function hasPermission(
  permissions: string[] | undefined,
  key: string
): boolean {
  return !!permissions?.includes(key);
}
