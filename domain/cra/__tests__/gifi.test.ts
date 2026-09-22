import { describe, expect, it } from 'vitest';
import { GIFI_CATALOGUE, findGifi, hasGifi } from '../gifi';

describe('static GIFI catalogue', () => {
  it('contains the core balance-sheet and income-statement codes', () => {
    expect(findGifi('1001')?.name).toBe('Cash');
    expect(findGifi('2600')?.name).toBe('Bank overdraft');
    expect(findGifi('3500')?.name).toBe('Common shares');
    expect(findGifi('8000')?.name).toBe('Trade sales of goods and services');
    expect(findGifi('8523')?.name).toBe('Meals and entertainment');
  });

  it('contains T2125-related operating expense codes', () => {
    for (const code of ['8521', '8523', '8590', '8690', '8710', '8760', '8810', '8860', '8910', '8960', '9060', '9180', '9200', '9220', '9281', '9936']) {
      expect(hasGifi(code)).toBe(true);
    }
  });

  it('returns undefined for an unknown code', () => {
    expect(findGifi('999999')).toBeUndefined();
    expect(hasGifi('999999')).toBe(false);
  });

  it('is a static, non-empty catalogue', () => {
    expect(GIFI_CATALOGUE.length).toBeGreaterThan(0);
    expect(new Set(GIFI_CATALOGUE.map((x) => x.code)).size).toBe(GIFI_CATALOGUE.length);
  });
});
