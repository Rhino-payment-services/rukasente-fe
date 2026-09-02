export type InterestCalculationMethod = "SIMPLE" | "COMPOUND";

export type CompoundingFrequency =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUALLY";

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
  duration_days?: number;
  interest_type: "flat" | "percentage";
  interest_rate: number;
  interest_calculation_method: InterestCalculationMethod;
  compounding_frequency?: CompoundingFrequency | string;
  processing_fee_type: "fixed" | "percentage";
  processing_fee_value: number;
  /** How the processing fee is applied at disbursement / repayment. */
  processing_fee_mode: "deduct_from_disbursement" | "add_to_repayable";
  late_fee_type: "fixed" | "percentage";
  late_fee_value: number;
  grace_period_days: number;
  pre_approval_enabled: boolean;
  pre_approval_min_amount: number;
  requires_manual_review: boolean;
  requires_guarantor: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoanRuleType =
  | "CREDIT_SCORE"
  | "MONTHLY_INCOME"
  | "ACCOUNT_AGE"
  | "TRANSACTION_VOLUME"
  | "TRANSACTION_COUNT"
  | "COMPLETED_LOANS"
  | "OVERDUE_LOANS"
  | "KYC_LEVEL"
  | "WALLET_BALANCE";

export type LoanRuleOperator =
  | "GREATER_THAN"
  | "LESS_THAN"
  | "EQUAL"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN_OR_EQUAL";

export type LoanProductEligibilityRule = {
  id: string;
  loan_product_id: string;
  rule_type: LoanRuleType | string;
  operator: LoanRuleOperator | string;
  value: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoanProductPreApprovalRule = {
  id: string;
  loan_product_id: string;
  rule_type: LoanRuleType | string;
  operator: LoanRuleOperator | string;
  value: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreditScoreLoanLimit = {
  id: string;
  min_score: number;
  max_score: number;
  maximum_loan_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductStats = {
  total: number;
  active: number;
  inactive: number;
};

export type LoanApplication = {
  id: string;
  application_number: string;
  borrower_profile_id: string;
  borrower_name?: string;
  borrower_phone?: string;
  borrower_email?: string;
  subscription_id: string;
  loan_product_id: string;
  product_name?: string;
  product_code?: string;
  credit_score_result_id: string;
  eligibility_decision_id: string;
  requested_amount: number;
  requested_tenor_days: number;
  currency: string;
  purpose: string;
  loan_kind?: "cash" | "product" | string;
  partner_product_ref?: string;
  product_label?: string;
  down_payment_amount?: number;
  disbursement_merchant_id?: string;
  disbursement_merchant_code?: string;
  disbursement_merchant_wallet_id?: string;
  customer_approved_at?: string;
  customer_declined_at?: string;
  customer_approval_channel?: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "declined" | "cancelled" | string;
  submission_channel: "web" | "internal_admin" | "api" | string;
  decisioned_by_staff_user_id?: string;
  decisioned_by_staff_name?: string;
  decision_reason: string;
  submitted_at: string;
  decisioned_at?: string;
  disbursed_at?: string;
  disbursement_txn_id?: string;
  disbursed_amount?: number;
  disbursement_wallet_id?: string;
  disbursement_error?: string;
  disbursement_attempts?: number;
  due_date?: string;
  repaid_at?: string;
  overdue_since?: string;
  guarantor_phone?: string;
  guarantor_full_name?: string;
  guarantor_network?: string;
  guarantor_relationship?: string;
  guarantor_validated_at?: string;
  created_at: string;
  updated_at: string;
};

export type GuarantorValidateResponse = {
  valid: boolean;
  phone: string;
  phone_display: string;
  full_name: string;
  network: string;
  validation_id: string;
  expires_at: string;
};

export type LoanApplicationReview = {
  id: string;
  loan_application_id: string;
  reviewer_staff_user_id: string;
  reviewer_staff_name?: string;
  action: string;
  notes: string;
  metadata_json: string;
  created_at: string;
};

/** Loan Account book of record (created after disbursement). */
export type LoanAccount = {
  id: string;
  account_number: string;
  loan_number: string;
  loan_application_id: string;
  borrower_profile_id: string;
  partner_code: string;
  currency: string;
  principal_amount: number;
  interest_type?: string;
  interest_rate: number;
  interest_calculation_method?: InterestCalculationMethod | string;
  compounding_frequency?: CompoundingFrequency | string;
  interest_amount: number;
  total_repayable: number;
  principal_balance: number;
  interest_balance: number;
  fee_balance?: number;
  processing_fee?: number;
  processing_fee_mode?: "deduct_from_disbursement" | "add_to_repayable" | string;
  outstanding_balance: number;
  amount_repaid: number;
  principal_repaid: number;
  interest_repaid: number;
  disbursed_amount: number;
  repayment_count: number;
  repayment_frequency: string;
  status: string;
  display_reference?: string;
  disbursement_error?: string;
  disbursement_attempts?: number;
  approved_at?: string;
  disbursed_at?: string;
  due_date?: string;
  next_installment_at?: string;
  repaid_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  schedule?: LoanScheduleItem[];
};

/** Computed loan terms returned by GET /loan-applications/:id/offer.
 * Available both pre-disbursement (estimated) and post-disbursement (contracted). */
export type LoanOfferResponse = {
  application_id: string;
  application_number: string;
  status: string;
  loan_kind?: string;
  requested_amount: number;
  principal: number;
  currency: string;
  tenor_days: number;
  interest_type: string;
  interest_rate: number;
  interest_calculation_method?: string;
  compounding_frequency?: string;
  interest_amount: number;
  processing_fee: number;
  processing_fee_mode: "deduct_from_disbursement" | "add_to_repayable";
  total_repayable: number;
  disburse_amount: number;
  down_payment_amount?: number;
  estimated_due_date?: string;
  due_date_basis: string;
  contracted: boolean;
  product_name?: string;
  product_label?: string;
  merchant_code?: string;
  terms_summary?: string;
};

export type LoanScheduleItem = {
  installment: number;
  due_date?: string;
  principal?: number;
  interest?: number;
  amount_due?: number;
  amount_paid?: number;
  status?: string;
  paid_at?: string;
};

export type LoanRepayment = {
  id: string;
  loan_id: string;
  repayment_number: number;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  outstanding_before: number;
  outstanding_after: number;
  status: string;
  partner_ref?: string;
  partner_txn_id?: string;
  posted_at: string;
};

export type LoanLedgerEntry = {
  id: string;
  entry_number: number;
  entry_type: string;
  description: string;
  amount: number;
  principal_delta: number;
  interest_delta: number;
  principal_balance_after: number;
  interest_balance_after: number;
  outstanding_balance_after: number;
  external_ref?: string;
  posted_at: string;
};

/** A borrower's loan account enriched with product context + repayment history. */
export type BorrowerLoan = LoanAccount & {
  application_number: string;
  product_name: string;
  product_code?: string;
  purpose?: string;
  requested_amount: number;
  repayments: LoanRepayment[];
};

export type BorrowerLoans = {
  borrower_profile_id: string;
  rukapay_user_id: string;
  borrower_name: string;
  borrower_phone: string;
  items: BorrowerLoan[];
};

export type LoanReminderResult = {
  sent: boolean;
  channel: string;
  to: string;
  message_id?: string;
  message: string;
  error?: string;
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
  "id" | "created_at" | "updated_at" | "duration_days"
>;

export type LoanProductUpdatePayload = Partial<
  Omit<LoanProductCreatePayload, "code">
>;

/** Maps create-shaped form data to PATCH fields (excludes immutable `code`). */
export function toLoanProductUpdatePayload(
  payload: LoanProductCreatePayload
): LoanProductUpdatePayload {
  return {
    name: payload.name,
    description: payload.description,
    currency: payload.currency,
    min_amount: payload.min_amount,
    max_amount: payload.max_amount,
    min_tenor_days: payload.min_tenor_days,
    max_tenor_days: payload.max_tenor_days,
    interest_type: payload.interest_type,
    interest_rate: payload.interest_rate,
    interest_calculation_method: payload.interest_calculation_method,
    compounding_frequency: payload.compounding_frequency,
    processing_fee_type: payload.processing_fee_type,
    processing_fee_value: payload.processing_fee_value,
    processing_fee_mode: payload.processing_fee_mode,
    late_fee_type: payload.late_fee_type,
    late_fee_value: payload.late_fee_value,
    grace_period_days: payload.grace_period_days,
    pre_approval_enabled: payload.pre_approval_enabled,
    pre_approval_min_amount: payload.pre_approval_min_amount,
    requires_manual_review: payload.requires_manual_review,
    requires_guarantor: payload.requires_guarantor,
  };
}

export const LOAN_RULE_TYPES: LoanRuleType[] = [
  "CREDIT_SCORE",
  "MONTHLY_INCOME",
  "ACCOUNT_AGE",
  "TRANSACTION_VOLUME",
  "TRANSACTION_COUNT",
  "COMPLETED_LOANS",
  "OVERDUE_LOANS",
  "KYC_LEVEL",
  "WALLET_BALANCE",
];

export const LOAN_RULE_OPERATORS: { value: LoanRuleOperator; label: string }[] = [
  { value: "GREATER_THAN_OR_EQUAL", label: ">=" },
  { value: "GREATER_THAN", label: ">" },
  { value: "LESS_THAN_OR_EQUAL", label: "<=" },
  { value: "LESS_THAN", label: "<" },
  { value: "EQUAL", label: "=" },
];
