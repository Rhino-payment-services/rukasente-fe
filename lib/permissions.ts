/** Mirrors rukasente-be permission keys used for UI RBAC. */
export const Perm = {
  // Staff / system
  StaffCreate: "staff.create",
  StaffView: "staff.view",
  StaffUpdate: "staff.update",
  StaffDisable: "staff.disable",
  RoleAssign: "role.assign",
  RoleView: "role.view",
  PermissionView: "permission.view",
  AuditView: "audit.view",
  SystemSettingsManage: "system.settings.manage",
  BackupCreate: "backup.create",
  BackupView: "backup.view",
  BackupDelete: "backup.delete",

  // Borrowers
  BorrowerCreate: "borrower.create",
  BorrowerView: "borrower.view",
  BorrowerUpdate: "borrower.update",
  SubscriptionCreate: "subscription.create",
  SubscriptionView: "subscription.view",
  SubscriptionUpdate: "subscription.update",
  ConsentCreate: "consent.create",
  ConsentView: "consent.view",
  EligibilityCreate: "eligibility.create",
  EligibilityView: "eligibility.view",
  BorrowerLinkView: "borrower.link.view",

  // Scoring
  ScoringRun: "scoring.run",
  ScoringView: "scoring.view",
  ScoringHistoryView: "scoring.history.view",
  ScoringRuleCreate: "scoring.rule.create",
  ScoringRuleUpdate: "scoring.rule.update",
  ScoringRuleView: "scoring.rule.view",
  ScoringRuleDelete: "scoring.rule.delete",
  EligibilityDecisionCreate: "eligibility.decision.create",
  EligibilityDecisionView: "eligibility.decision.view",
  ManualReviewView: "manual.review.view",
  ManualReviewUpdate: "manual.review.update",

  // Integrations / partners
  IntegrationView: "integration.view",
  IntegrationManage: "integration.manage",
  PartnerView: "partner.view",
  PartnerCreate: "partner.create",
  PartnerUpdate: "partner.update",
  PartnerDelete: "partner.delete",
  PartnerManageCredentials: "partner.credentials.manage",
  PartnerViewLogs: "partner.logs.view",
  PlatformPartnerCreate: "platform.partner.create",
  PlatformPartnerSuspend: "platform.partner.suspend",
  PlatformAnalyticsView: "platform.analytics.view",

  // Loans
  LoanProductCreate: "loan.product.create",
  LoanProductView: "loan.product.view",
  LoanProductUpdate: "loan.product.update",
  LoanProductActivate: "loan.product.activate",
  LoanProductDelete: "loan.product.delete",
  LoanProductRuleCreate: "loan.product.rule.create",
  LoanProductRuleUpdate: "loan.product.rule.update",
  LoanProductRuleDelete: "loan.product.rule.delete",
  LoanApplicationCreate: "loan.application.create",
  LoanApplicationView: "loan.application.view",
  LoanApplicationReview: "loan.application.review",
  LoanApplicationApprove: "loan.application.approve",
  LoanApplicationDecline: "loan.application.decline",
  LoanDisburse: "loan.disburse",
  LoanRepayment: "loan.repayment",
  LoanScoreLimitView: "loan.score_limit.view",
  LoanScoreLimitCreate: "loan.score_limit.create",
  LoanScoreLimitUpdate: "loan.score_limit.update",
  LoanScoreLimitDelete: "loan.score_limit.delete",
} as const;

export type PermKey = (typeof Perm)[keyof typeof Perm];

/** UI grouping for one-by-one permission checklists. */
export const PERMISSION_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Staff",
    keys: [
      Perm.StaffCreate,
      Perm.StaffView,
      Perm.StaffUpdate,
      Perm.StaffDisable,
      Perm.RoleAssign,
      Perm.RoleView,
      Perm.PermissionView,
    ],
  },
  {
    title: "System",
    keys: [
      Perm.AuditView,
      Perm.SystemSettingsManage,
      Perm.BackupCreate,
      Perm.BackupView,
      Perm.BackupDelete,
    ],
  },
  {
    title: "Borrowers",
    keys: [
      Perm.BorrowerCreate,
      Perm.BorrowerView,
      Perm.BorrowerUpdate,
      Perm.SubscriptionCreate,
      Perm.SubscriptionView,
      Perm.SubscriptionUpdate,
      Perm.ConsentCreate,
      Perm.ConsentView,
      Perm.EligibilityCreate,
      Perm.EligibilityView,
      Perm.BorrowerLinkView,
    ],
  },
  {
    title: "Scoring",
    keys: [
      Perm.ScoringRun,
      Perm.ScoringView,
      Perm.ScoringHistoryView,
      Perm.ScoringRuleCreate,
      Perm.ScoringRuleUpdate,
      Perm.ScoringRuleView,
      Perm.ScoringRuleDelete,
      Perm.EligibilityDecisionCreate,
      Perm.EligibilityDecisionView,
      Perm.ManualReviewView,
      Perm.ManualReviewUpdate,
    ],
  },
  {
    title: "Loans",
    keys: [
      Perm.LoanProductCreate,
      Perm.LoanProductView,
      Perm.LoanProductUpdate,
      Perm.LoanProductActivate,
      Perm.LoanProductDelete,
      Perm.LoanApplicationCreate,
      Perm.LoanApplicationView,
      Perm.LoanApplicationReview,
      Perm.LoanApplicationApprove,
      Perm.LoanApplicationDecline,
      Perm.LoanDisburse,
      Perm.LoanRepayment,
      Perm.LoanScoreLimitView,
      Perm.LoanScoreLimitCreate,
      Perm.LoanScoreLimitUpdate,
      Perm.LoanScoreLimitDelete,
    ],
  },
  {
    title: "Partners",
    keys: [
      Perm.PartnerView,
      Perm.PartnerCreate,
      Perm.PartnerUpdate,
      Perm.PartnerDelete,
      Perm.PartnerManageCredentials,
      Perm.PartnerViewLogs,
      Perm.IntegrationView,
      Perm.IntegrationManage,
    ],
  },
  {
    title: "Platform",
    keys: [
      Perm.PlatformPartnerCreate,
      Perm.PlatformPartnerSuspend,
      Perm.PlatformAnalyticsView,
    ],
  },
];

export function hasPermission(
  permissions: string[] | undefined,
  key: string
): boolean {
  return !!permissions?.includes(key);
}

export function hasAny(
  permissions: string[] | undefined,
  keys: string[]
): boolean {
  return keys.some((k) => hasPermission(permissions, k));
}

export function hasAll(
  permissions: string[] | undefined,
  keys: string[]
): boolean {
  return keys.every((k) => hasPermission(permissions, k));
}

/** Keys that tenant staff must not receive as direct grants. */
export function isPlatformOnlyPermission(key: string): boolean {
  if (key.startsWith("platform.")) return true;
  return [
    "partner.create",
    "partner.delete",
    "partner.update",
    "partner.credentials.manage",
    "integration.manage",
  ].includes(key);
}
