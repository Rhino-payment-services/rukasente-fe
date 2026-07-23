export type Partner = {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive" | string;
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

export type PaginatedPartners = {
  items: Partner[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};
