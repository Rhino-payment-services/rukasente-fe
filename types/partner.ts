export type Partner = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive" | string;
  is_internal?: boolean;
  primary_color?: string;
  country?: string;
  currency?: string;
  payment_provider_id?: string | null;
  rukapay_escrow_wallet_id?: string | null;
  rukapay_collection_wallet_id?: string | null;
  product_loan_enabled?: boolean;
  rukapay_merchant_id?: string | null;
  rukapay_merchant_code?: string | null;
  rukapay_merchant_wallet_id?: string | null;
  api_base_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  allowed_ips: string[];
  ip_whitelist_enabled: boolean;
  created_at: string;
  updated_at: string;
  borrower_count?: number;
  active_credentials?: number;
  loan_application_count?: number;
};

export type PartnerCreatePayload = {
  name: string;
  code: string;
  description?: string;
  status?: string;
  is_internal?: boolean;
  primary_color?: string;
  country?: string;
  currency?: string;
  payment_provider_id?: string | null;
  rukapay_escrow_wallet_id?: string | null;
  rukapay_collection_wallet_id?: string | null;
  product_loan_enabled?: boolean;
  rukapay_merchant_id?: string | null;
  rukapay_merchant_code?: string | null;
  rukapay_merchant_wallet_id?: string | null;
  api_base_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  allowed_ips?: string[];
  ip_whitelist_enabled?: boolean;
};

export type PartnerUpdatePayload = Partial<
  Omit<PartnerCreatePayload, "code">
> & {
  allowed_ips?: string[];
  ip_whitelist_enabled?: boolean;
  payment_provider_id?: string | null;
  rukapay_escrow_wallet_id?: string | null;
  rukapay_collection_wallet_id?: string | null;
};

export type RegisterLendingCompanyPayload = {
  name: string;
  code: string;
  description?: string;
  primary_color?: string;
  country?: string;
  currency?: string;
  payment_provider_id?: string | null;
  rukapay_escrow_wallet_id?: string | null;
  rukapay_collection_wallet_id?: string | null;
  product_loan_enabled?: boolean;
  rukapay_merchant_id?: string | null;
  rukapay_merchant_code?: string | null;
  rukapay_merchant_wallet_id?: string | null;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  allowed_ips?: string[];
  admin_email: string;
  admin_name: string;
  admin_password?: string;
};

export type RegisterLendingCompanyResult = {
  partner: Partner;
  admin_email: string;
  admin_password: string;
  warning: string;
};

export type PaymentProvider = {
  id: string;
  code: string;
  name: string;
  status: string;
  adapter_key: string;
  base_url?: string;
  config_json?: string;
  capabilities_json?: string;
  has_credentials: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentProviderCreatePayload = {
  code: string;
  name: string;
  status?: string;
  adapter_key: string;
  base_url?: string;
  credentials?: string;
  config_json?: string;
  capabilities_json?: string;
};

export type PartnerCredential = {
  id: string;
  partner_id: string;
  name: string;
  api_key: string;
  api_key_hint: string;
  status: string;
  expires_at?: string;
  last_used_at?: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
};

export type PartnerCredentialCreated = {
  id: string;
  partner_id: string;
  name: string;
  api_key: string;
  api_secret: string;
  webhook_secret?: string;
  status: string;
  expires_at?: string;
  created_at: string;
  warning: string;
};

export type PartnerAPILog = {
  id: string;
  partner_id: string;
  credential_id?: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  duration_ms: number;
  error_message?: string;
  created_at: string;
};

export type PartnerStats = {
  borrower_count: number;
  active_credentials: number;
  loan_application_count: number;
  approved_loans: number;
  active_loans: number;
  api_calls_last_7_days: number;
};

export type PartnerAPIPermission = {
  key: string;
  name: string;
  description: string;
  category: string;
};

export type PartnerAPIGrants = {
  partner_id: string;
  keys: string[];
};

export type PartnerAccessTokenCreated = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  warning?: string;
};

export type PartnerWalletRuleEvaluation = {
  all_passed: boolean;
  results: PartnerWalletRuleResult[];
};

export type PartnerWalletSnapshot = {
  wallet_id?: string;
  configured: boolean;
  verified: boolean;
  available?: number;
  frozen?: number;
  balance?: number;
  currency?: string;
  wallet_role?: string;
};

export type PartnerWalletRuleResult = {
  rule_id: string;
  rule_type: string;
  wallet_role: string;
  passed: boolean;
  message: string;
};

export type PartnerWalletSetup = {
  partner_id: string;
  ready: boolean;
  disbursement: PartnerWalletSnapshot;
  collection: PartnerWalletSnapshot;
  wallets_separate: boolean;
  rule_results: PartnerWalletRuleResult[];
  blocking_issues: string[];
};

/** Platform-wide partner wallet overview (GET /admin/wallets/partners). */
export type PartnerWalletSetupListItem = {
  partner_id: string;
  partner_name: string;
  partner_code: string;
  currency: string;
  is_internal: boolean;
  ready: boolean;
  disbursement: PartnerWalletSnapshot;
  collection: PartnerWalletSnapshot;
  wallets_separate: boolean;
  blocking_issues: string[];
};

export type PartnerWalletVerifySnapshot = {
  wallet_id: string;
  valid: boolean;
  available?: number;
  frozen?: number;
  balance?: number;
  currency?: string;
  is_active: boolean;
  is_suspended: boolean;
};

export type PartnerWalletVerifyResult = {
  disbursement?: PartnerWalletVerifySnapshot;
  collection?: PartnerWalletVerifySnapshot;
  wallets_separate: boolean;
};

export type PartnerEscrowWalletOption = {
  id: string;
  description?: string;
  currency: string;
  balance: number;
  frozen: number;
  available_balance: number;
  is_default: boolean;
  is_active: boolean;
  public_wallet_id?: string;
  wallet_number?: number;
};

export type PartnerWalletRule = {
  id: string;
  partner_id: string;
  wallet_role: "disbursement" | "collection" | string;
  rule_type: string;
  operator: string;
  value: string;
  description: string;
  is_active: boolean;
  last_synced_reserve?: number | null;
  created_at: string;
  updated_at: string;
};

export type PartnerWalletRuleCreatePayload = {
  wallet_role: string;
  rule_type: string;
  operator: string;
  value: string;
  description?: string;
  is_active?: boolean;
};

export const PARTNER_WALLET_RULE_TYPES = [
  "MIN_AVAILABLE_BALANCE",
  "RESERVE_FLOOR",
] as const;

export const PARTNER_WALLET_ROLES = [
  { value: "disbursement", label: "Disbursement" },
  { value: "collection", label: "Collection" },
] as const;

export const PARTNER_WALLET_OPERATORS = [
  { value: "GREATER_THAN_OR_EQUAL", label: "≥" },
  { value: "GREATER_THAN", label: ">" },
  { value: "LESS_THAN_OR_EQUAL", label: "≤" },
  { value: "LESS_THAN", label: "<" },
  { value: "EQUAL", label: "=" },
] as const;

export type PaginatedPartners = {
  items: Partner[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};
