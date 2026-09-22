import { describe, expect, it } from 'vitest';
import { calculateMealsDeduction } from '../meals';

describe('CRA standard 50% meals rule', () => {
  it('allows 50% when incurred amount is the limiting amount', () => {
    expect(calculateMealsDeduction(100, 120)).toBe(50);
  });

  it('allows 50% of the reasonable amount when reasonable is lower', () => {
    expect(calculateMealsDeduction(120, 100)).toBe(50);
  });

  it('defaults reasonable amount to incurred amount', () => {
    expect(calculateMealsDeduction(79.99)).toBe(40);
  });

  it('handles zero', () => {
    expect(calculateMealsDeduction(0)).toBe(0);
  });

  it('rounds to cents deterministically', () => {
    expect(calculateMealsDeduction(10.01)).toBe(5.01);
  });

  it.each([
    [-0.01, 10],
    [10, -0.01],
    [Number.NaN, 10],
    [10, Number.POSITIVE_INFINITY],
  ])('rejects invalid amounts %s / %s', (incurred, reasonable) => {
    expect(() => calculateMealsDeduction(incurred, reasonable)).toThrow(RangeError);
  });
});
