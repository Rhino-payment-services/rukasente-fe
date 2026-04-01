export type LoanProduct = {
  id: string;
  code: string;
  name: string;
  description: string;
  currency: string;
  min_amount: number;
  max_amount: number;
  min_tenor_days: number;
  max_tenor_days: number;
  interest_type: "flat" | "percentage";
  interest_rate: number;
  processing_fee_type: "fixed" | "percentage";
  processing_fee_value: number;
  late_fee_type: "fixed" | "percentage";
  late_fee_value: number;
  grace_period_days: number;
  requires_manual_review: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoanProductEligibilityRule = {
  id: string;
  loan_product_id: string;
  rule_key: string;
  operator: "eq" | "gte" | "lte" | "in" | "bool";
  rule_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoanApplication = {
  id: string;
  application_number: string;
  borrower_profile_id: string;
  subscription_id: string;
  loan_product_id: string;
  credit_score_result_id: string;
  eligibility_decision_id: string;
  requested_amount: number;
  requested_tenor_days: number;
  currency: string;
  purpose: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "declined" | "cancelled";
  submission_channel: "web" | "internal_admin" | "api";
  decisioned_by_staff_user_id?: string;
  decision_reason: string;
  submitted_at: string;
  decisioned_at?: string;
  created_at: string;
  updated_at: string;
};

export type LoanApplicationReview = {
  id: string;
  loan_application_id: string;
  reviewer_staff_user_id: string;
  action: string;
  notes: string;
  metadata_json: string;
  created_at: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type LoanProductCreatePayload = Omit<
  LoanProduct,
  "id" | "created_at" | "updated_at"
>;

export type LoanProductUpdatePayload = Partial<LoanProductCreatePayload>;
