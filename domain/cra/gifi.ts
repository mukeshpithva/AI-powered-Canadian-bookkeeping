export interface GifiEntry {
  readonly code: string;
  readonly name: string;
  readonly section: 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'COST_OF_SALES' | 'OPERATING_EXPENSES' | 'OTHER';
}

export interface GifiVerificationResult {
  readonly code: string;
  readonly status: 'VERIFIED' | 'REVIEW_REQUIRED';
  readonly entry?: GifiEntry;
  readonly reason?: string;
}

/**
 * Static GIFI catalogue. Codes/descriptions are sourced from CRA's published
 * GIFI catalogue and kept as data, not inferred at runtime.
 *
 * This is deliberately immutable. Add new CRA codes as catalogue data changes;
 * do not generate codes algorithmically.
 */
export const GIFI_CATALOGUE: readonly GifiEntry[] = Object.freeze([
  { code: '1000', name: 'Cash and deposits', section: 'ASSETS' },
  { code: '1001', name: 'Cash', section: 'ASSETS' },
  { code: '1002', name: 'Deposits in Canadian banks and institutions – Canadian currency', section: 'ASSETS' },
  { code: '1003', name: 'Deposits in Canadian banks and institutions – Foreign currency', section: 'ASSETS' },
  { code: '1600', name: 'Land', section: 'ASSETS' },
  { code: '1601', name: 'Land improvements', section: 'ASSETS' },
  { code: '1602', name: 'Accumulated amortization of land improvements', section: 'ASSETS' },
  { code: '2180', name: 'Due from shareholder(s)/director(s)', section: 'ASSETS' },
  { code: '2200', name: 'Investment in joint venture(s)/partnership(s)', section: 'ASSETS' },
  { code: '2600', name: 'Bank overdraft', section: 'LIABILITIES' },
  { code: '2620', name: 'Amounts payable and accrued liabilities', section: 'LIABILITIES' },
  { code: '2621', name: 'Trade payables', section: 'LIABILITIES' },
  { code: '2624', name: 'Wages payable', section: 'LIABILITIES' },
  { code: '2628', name: 'Withholding taxes payable', section: 'LIABILITIES' },
  { code: '2629', name: 'Interest payable', section: 'LIABILITIES' },
  { code: '3140', name: 'Long-term debt', section: 'LIABILITIES' },
  { code: '3141', name: 'Mortgages', section: 'LIABILITIES' },
  { code: '3143', name: 'Chartered bank loan', section: 'LIABILITIES' },
  { code: '3149', name: 'Line of credit', section: 'LIABILITIES' },
  { code: '3500', name: 'Common shares', section: 'EQUITY' },
  { code: '3520', name: 'Preferred shares', section: 'EQUITY' },
  { code: '3540', name: 'Contributed and other surplus', section: 'EQUITY' },
  { code: '3560', name: "General partners' capital ending balance", section: 'EQUITY' },
  { code: '3570', name: 'Head office account', section: 'EQUITY' },
  { code: '3580', name: 'Accumulated other comprehensive income', section: 'EQUITY' },
  { code: '8000', name: 'Trade sales of goods and services', section: 'REVENUE' },
  { code: '8020', name: 'Sales of goods and services to related parties', section: 'REVENUE' },
  { code: '8030', name: 'Interdivisional sales', section: 'REVENUE' },
  { code: '8230', name: 'Other income', section: 'REVENUE' },
  { code: '8299', name: 'Total revenue', section: 'REVENUE' },
  { code: '8518', name: 'Cost of sales', section: 'COST_OF_SALES' },
  { code: '8519', name: 'Gross profit/loss', section: 'COST_OF_SALES' },
  { code: '8520', name: 'Advertising and promotion', section: 'OPERATING_EXPENSES' },
  { code: '8521', name: 'Advertising', section: 'OPERATING_EXPENSES' },
  { code: '8522', name: 'Donations', section: 'OPERATING_EXPENSES' },
  { code: '8523', name: 'Meals and entertainment', section: 'OPERATING_EXPENSES' },
  { code: '8524', name: 'Promotion', section: 'OPERATING_EXPENSES' },
  { code: '8570', name: 'Amortization of intangible assets', section: 'OPERATING_EXPENSES' },
  { code: '8571', name: 'Goodwill impairment loss', section: 'OPERATING_EXPENSES' },
  { code: '8590', name: 'Bad debt expense', section: 'OPERATING_EXPENSES' },
  { code: '8620', name: 'Employee benefits', section: 'OPERATING_EXPENSES' },
  { code: '8670', name: 'Amortization of tangible assets', section: 'OPERATING_EXPENSES' },
  { code: '8690', name: 'Insurance', section: 'OPERATING_EXPENSES' },
  { code: '8710', name: 'Interest and bank charges', section: 'OPERATING_EXPENSES' },
  { code: '8760', name: 'Business taxes, licences, and memberships', section: 'OPERATING_EXPENSES' },
  { code: '8810', name: 'Office expenses', section: 'OPERATING_EXPENSES' },
  { code: '8811', name: 'Office stationery and supplies', section: 'OPERATING_EXPENSES' },
  { code: '8860', name: 'Professional fees', section: 'OPERATING_EXPENSES' },
  { code: '8871', name: 'Management and administration fees', section: 'OPERATING_EXPENSES' },
  { code: '8910', name: 'Rent', section: 'OPERATING_EXPENSES' },
  { code: '8960', name: 'Repairs and maintenance', section: 'OPERATING_EXPENSES' },
  { code: '9060', name: 'Salaries, wages, and benefits', section: 'OPERATING_EXPENSES' },
  { code: '9180', name: 'Property taxes', section: 'OPERATING_EXPENSES' },
  { code: '9200', name: 'Travel expenses', section: 'OPERATING_EXPENSES' },
  { code: '9220', name: 'Utilities', section: 'OPERATING_EXPENSES' },
  { code: '9224', name: 'Fuel costs (except for motor vehicles)', section: 'OPERATING_EXPENSES' },
  { code: '9275', name: 'Delivery, freight, and express', section: 'OPERATING_EXPENSES' },
  { code: '9281', name: 'Motor vehicle expenses (not including CCA)', section: 'OPERATING_EXPENSES' },
  { code: '9367', name: 'Total operating expenses', section: 'OPERATING_EXPENSES' },
  { code: '9368', name: 'Total expenses', section: 'OPERATING_EXPENSES' },
  { code: '9936', name: 'Capital cost allowance (CCA)', section: 'OTHER' },
]);

const BY_CODE = new Map(GIFI_CATALOGUE.map((entry) => [entry.code, entry]));

export function findGifi(code: string | number): GifiEntry | undefined {
  return BY_CODE.get(String(code).trim());
}

export function hasGifi(code: string | number): boolean {
  return findGifi(code) !== undefined;
}

export function verifyGifiCode(code: string | number): GifiVerificationResult {
  const normalized = String(code).trim();
  const entry = findGifi(normalized);

  if (entry) {
    return {
      code: entry.code,
      status: 'VERIFIED',
      entry,
    };
  }

  return {
    code: normalized,
    status: 'REVIEW_REQUIRED',
    reason: 'GIFI code is not present in the controlled CRA catalogue.',
  };
}
