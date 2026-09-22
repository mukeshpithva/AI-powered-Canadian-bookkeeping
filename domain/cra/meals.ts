export interface MealITCPolicy {
  readonly standard: number;
  readonly charityOrPublicInstitution: number;
  readonly longHaulTruckDriver: number;
}

export const STANDARD_MEAL_ITC_POLICY: MealITCPolicy = {
  standard: 0.5,
  charityOrPublicInstitution: 1,
  longHaulTruckDriver: 0.8,
};

/**
 * Standard CRA meals/entertainment rule for the ordinary case:
 * allowable amount = 50% of the lesser of the amount incurred and the
 * amount that is reasonable in the circumstances.
 *
 * This function intentionally models only the standard 50% rule. CRA has
 * exceptions and special regimes (for example certain employee events and
 * long-haul truck-driver meals) that must be handled by separate domain rules.
 */
export function calculateMealsDeduction(
  incurredCad: number,
  reasonableCad: number = incurredCad,
  policy: MealITCPolicy = STANDARD_MEAL_ITC_POLICY,
): number {
  assertNonNegativeFinite(incurredCad, 'incurredCad');
  assertNonNegativeFinite(reasonableCad, 'reasonableCad');
  assertPolicy(policy);

  const baseCents = Math.min(toCents(incurredCad), toCents(reasonableCad));
  return roundCents(baseCents * policy.standard) / 100;
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative CAD amount.`);
  }
}

function toCents(amountCad: number): number {
  return Math.round((amountCad + Number.EPSILON) * 100);
}

function roundCents(cents: number): number {
  return Math.round(cents);
}

function assertPolicy(policy: MealITCPolicy): void {
  if (!Number.isFinite(policy.standard) || !Number.isFinite(policy.charityOrPublicInstitution) || !Number.isFinite(policy.longHaulTruckDriver)) {
    throw new RangeError('Meal ITC policy values must be finite numbers.');
  }

  if (policy.standard < 0 || policy.standard > 1 || policy.charityOrPublicInstitution < 0 || policy.charityOrPublicInstitution > 1 || policy.longHaulTruckDriver < 0 || policy.longHaulTruckDriver > 1) {
    throw new RangeError('Meal ITC policy values must lie between 0 and 1.');
  }
}
