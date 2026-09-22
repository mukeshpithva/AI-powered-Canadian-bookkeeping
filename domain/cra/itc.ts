import { normalizeDocumentationStatus, type DocumentationStatus, type DocumentationTier } from './documentation';
import { STANDARD_MEAL_ITC_POLICY, type MealITCPolicy } from './meals';

export type ITCStatus = 'eligible' | 'partial' | 'ineligible' | 'review';

export interface EligibleITCInput {
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly taxType?: 'GST' | 'HST' | 'GST/HST';
  readonly expenseCategory?: string;
  readonly commercialUsePercentage?: number;
  readonly mealEntertainment?: boolean;
  readonly documentationStatus?: DocumentationStatus | DocumentationTier | string | null;
  readonly mealPolicy?: MealITCPolicy;
}

export interface EligibleITCResult {
  readonly grossTax: number;
  readonly eligibilityPercentage: number;
  readonly eligibleITC: number;
  readonly reasonCode: string;
  readonly status: ITCStatus;
}

export function calculateEligibleITC(input: EligibleITCInput): EligibleITCResult {
  const subtotal = assertFiniteNonNegativeAmount(input.subtotal, 'subtotal');
  const taxAmount = assertFiniteNonNegativeAmount(input.taxAmount, 'taxAmount');
  const commercialUseRatio = normalizeCommercialUsePercentage(input.commercialUsePercentage ?? 100);
  const documentationStatus = normalizeDocumentationStatus(input.documentationStatus ?? 'sufficient');
  const taxType = input.taxType ?? 'GST/HST';
  const grossTax = roundToCents(taxAmount) / 100;

  if (grossTax === 0 || subtotal === 0) {
    return {
      grossTax,
      eligibilityPercentage: 0,
      eligibleITC: 0,
      reasonCode: 'NO_TAX',
      status: 'ineligible',
    };
  }

  let eligibilityPercentage = commercialUseRatio;
  let reasonCode = 'STANDARD_ITC';

  if (input.mealEntertainment) {
    const policy = input.mealPolicy ?? STANDARD_MEAL_ITC_POLICY;
    eligibilityPercentage = Math.min(eligibilityPercentage, policy.standard);
    reasonCode = 'MEAL_ENTERTAINMENT_50_LIMIT';
  }

  if (documentationStatus === 'insufficient') {
    return {
      grossTax,
      eligibilityPercentage: Number(eligibilityPercentage.toFixed(4)),
      eligibleITC: 0,
      reasonCode: 'DOCUMENTATION_INSUFFICIENT',
      status: 'review',
    };
  }

  if (documentationStatus === 'review' || documentationStatus === 'unknown') {
    return {
      grossTax,
      eligibilityPercentage: Number(eligibilityPercentage.toFixed(4)),
      eligibleITC: 0,
      reasonCode: 'DOCUMENTATION_REVIEW',
      status: 'review',
    };
  }

  if (eligibilityPercentage <= 0) {
    return {
      grossTax,
      eligibilityPercentage: 0,
      eligibleITC: 0,
      reasonCode: `${taxType}_NOT_ELIGIBLE`,
      status: 'ineligible',
    };
  }

  const eligibleITC = roundToCents(grossTax * eligibilityPercentage) / 100;
  const normalizedPercentage = Number(eligibilityPercentage.toFixed(4));

  return {
    grossTax,
    eligibilityPercentage: normalizedPercentage,
    eligibleITC,
    reasonCode,
    status: eligibilityPercentage >= 1 ? 'eligible' : 'partial',
  };
}

export const calculateITC = calculateEligibleITC;
export const calculate_eligible_itc = calculateEligibleITC;

function assertFiniteNonNegativeAmount(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative CAD amount.`);
  }
  return value;
}

function normalizeCommercialUsePercentage(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('commercialUsePercentage must be a finite, non-negative value.');
  }

  if (value <= 1) {
    return value;
  }

  return Math.min(value, 100) / 100;
}

function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}
