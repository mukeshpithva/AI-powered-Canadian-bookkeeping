import { describe, expect, it } from 'vitest';
import { getDocumentationRequirements, getDocumentationTier } from '../documentation';
import { findGifi, verifyGifiCode } from '../gifi';
import { validateGstHstNumber } from '../gst-hst';
import { calculateEligibleITC } from '../itc';

describe('CRA domain rules', () => {
  it('applies the documentation tiers deterministically', () => {
    expect(getDocumentationTier(29.99)).toBe('TIER_1');
    expect(getDocumentationTier(30)).toBe('TIER_2');
    expect(getDocumentationTier(150)).toBe('TIER_3');
    expect(getDocumentationRequirements(30).tier).toBe('TIER_2');
  });

  it('validates GST/HST format without asserting CRA registration', () => {
    expect(validateGstHstNumber('123456789RT0001')).toMatchObject({
      status: 'valid',
      isValidFormat: true,
    });
    expect(validateGstHstNumber('')).toMatchObject({ status: 'missing' });
    expect(validateGstHstNumber('123456789RT000')).toMatchObject({ status: 'invalid' });
    expect(validateGstHstNumber('000000000RT0001')).toMatchObject({ status: 'suspicious' });
    expect(validateGstHstNumber('unknown')).toMatchObject({ status: 'unknown' });
  });

  it('calculates ITCs deterministically and keeps meal limits in policy', () => {
    expect(calculateEligibleITC({
      subtotal: 240,
      taxAmount: 12,
      commercialUsePercentage: 1,
      mealEntertainment: true,
      documentationStatus: 'sufficient',
    })).toMatchObject({
      grossTax: 12,
      eligibilityPercentage: 0.5,
      eligibleITC: 6,
      status: 'partial',
      reasonCode: 'MEAL_ENTERTAINMENT_50_LIMIT',
    });

    expect(calculateEligibleITC({
      subtotal: 82,
      taxAmount: 4.1,
      commercialUsePercentage: 1,
      documentationStatus: 'sufficient',
    })).toMatchObject({
      grossTax: 4.1,
      eligibilityPercentage: 1,
      eligibleITC: 4.1,
      status: 'eligible',
    });
  });

  it('requires GIFI codes to exist in the controlled catalogue', () => {
    expect(findGifi('8810')?.name).toBe('Office expenses');
    expect(verifyGifiCode('8810')).toMatchObject({ status: 'VERIFIED' });
    expect(verifyGifiCode('999999')).toMatchObject({ status: 'REVIEW_REQUIRED' });
  });
});
