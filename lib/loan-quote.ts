/**
 * Mirrors rukasente-be interest + installment math (internal/loan/interest and ComputeLoanQuote).
 * Monthly repayment is total repayable / months, so interest is included — not principal ÷ months.
 */

export type LoanQuoteInput = {
  principal: number;
  tenorDays: number;
  interestRate?: number;
  interestCalculationMethod?: string;
  compoundingFrequency?: string;
  processingFeeType?: string;
  processingFeeValue?: number;
  processingFeeMode?: string;
  processingFeeEnabled?: boolean;
};

export type LoanQuote = {
  interestAmount: number;
  processingFee: number;
  totalRepayable: number;
  installmentCount: number;
  monthlyInstallment: number;
};

function periodsPerYear(freq?: string): number {
  switch ((freq || "").trim().toUpperCase()) {
    case "DAILY":
      return 365;
    case "WEEKLY":
      return 52;
    case "QUARTERLY":
      return 4;
    case "ANNUALLY":
      return 1;
    default:
      return 12;
  }
}

export function calculateInterest(input: {
  principal: number;
  interestRate?: number;
  tenorDays: number;
  interestCalculationMethod?: string;
  compoundingFrequency?: string;
}): number {
  const principal = Number(input.principal) || 0;
  const rate = Number(input.interestRate) || 0;
  if (principal <= 0 || rate <= 0) return 0;
  const method = (input.interestCalculationMethod || "SIMPLE").trim().toUpperCase();
  if (method === "COMPOUND") {
    const tenorDays = Number(input.tenorDays) || 0;
    if (tenorDays <= 0) return 0;
    const n = periodsPerYear(input.compoundingFrequency);
    const r = rate / 100;
    const t = tenorDays / 365;
    const interest = principal * (Math.pow(1 + r / n, n * t) - 1);
    return interest < 0 ? 0 : Math.round(interest);
  }
  return Math.round((principal * rate) / 100);
}

export function calculateProcessingFee(
  principal: number,
  feeType: string | undefined,
  feeValue: number | undefined,
  enabled: boolean | undefined,
): number {
  if (enabled === false) return 0;
  const value = Number(feeValue) || 0;
  if (value <= 0 || principal <= 0) return 0;
  if ((feeType || "").trim().toLowerCase() === "percentage") {
    return Math.round((principal * value) / 100);
  }
  return Math.round(value);
}

export function installmentPlan(totalRepayable: number, tenorDays: number): {
  installmentCount: number;
  monthlyInstallment: number;
} {
  const installmentCount = Math.max(1, Math.round((Number(tenorDays) || 0) / 30));
  const total = Number(totalRepayable) || 0;
  if (total <= 0) return { installmentCount, monthlyInstallment: 0 };
  return {
    installmentCount,
    monthlyInstallment: Math.round(total / installmentCount),
  };
}

export function quoteLoanRepayment(input: LoanQuoteInput): LoanQuote {
  const principal = Math.round(Number(input.principal) || 0);
  const tenorDays = Math.round(Number(input.tenorDays) || 0);
  const interestAmount = calculateInterest({
    principal,
    interestRate: input.interestRate,
    tenorDays,
    interestCalculationMethod: input.interestCalculationMethod,
    compoundingFrequency: input.compoundingFrequency,
  });
  const processingFee = calculateProcessingFee(
    principal,
    input.processingFeeType,
    input.processingFeeValue,
    input.processingFeeEnabled,
  );
  const addFee =
    processingFee > 0 &&
    (input.processingFeeMode || "").trim().toLowerCase() === "add_to_repayable";
  const totalRepayable = principal + interestAmount + (addFee ? processingFee : 0);
  const plan = installmentPlan(totalRepayable, tenorDays);
  return {
    interestAmount,
    processingFee,
    totalRepayable,
    installmentCount: plan.installmentCount,
    monthlyInstallment: plan.monthlyInstallment,
  };
}
