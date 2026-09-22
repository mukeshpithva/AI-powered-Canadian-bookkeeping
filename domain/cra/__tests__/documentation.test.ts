import { describe, expect, it } from 'vitest';
import { getDocumentationTier } from '../documentation';

describe('CRA documentation tiers', () => {
  it('puts $29.99 in Tier 1', () => {
    expect(getDocumentationTier(29.99)).toBe('TIER_1');
  });

  it('puts exactly $30.00 in Tier 2', () => {
    expect(getDocumentationTier(30.00)).toBe('TIER_2');
  });

  it('puts $30.01 in Tier 2', () => {
    expect(getDocumentationTier(30.01)).toBe('TIER_2');
  });

  it('puts $149.99 in Tier 2', () => {
    expect(getDocumentationTier(149.99)).toBe('TIER_2');
  });

  it('puts exactly $150.00 in Tier 3', () => {
    expect(getDocumentationTier(150.00)).toBe('TIER_3');
  });

  it('puts amounts above $150 in Tier 3', () => {
    expect(getDocumentationTier(150.01)).toBe('TIER_3');
    expect(getDocumentationTier(1000)).toBe('TIER_3');
  });

  it('accepts zero as Tier 1', () => {
    expect(getDocumentationTier(0)).toBe('TIER_1');
  });

  it.each([-0.01, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid amount %s', (amount) => {
    expect(() => getDocumentationTier(amount)).toThrow(RangeError);
  });
});
