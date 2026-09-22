export type DocumentationTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type DocumentationStatus = 'sufficient' | 'insufficient' | 'review' | 'unknown';

export interface DocumentationRequirementSet {
  readonly tier: DocumentationTier;
  readonly label: string;
  readonly minimumEvidence: readonly string[];
  readonly requiredInformation: readonly string[];
  readonly summary: string;
}

export const DOCUMENTATION_REQUIREMENTS_BY_TIER: Readonly<Record<DocumentationTier, DocumentationRequirementSet>> = Object.freeze({
  TIER_1: {
    tier: 'TIER_1',
    label: 'Tier 1: under $30.00',
    minimumEvidence: ['Business-purpose and amount can be reasonably determined from the receipt or invoice.'],
    requiredInformation: ['Vendor or payee', 'Date', 'Amount', 'Business purpose'],
    summary: 'Basic documentation is required; the evidence must still support the ITC amount.',
  },
  TIER_2: {
    tier: 'TIER_2',
    label: 'Tier 2: $30.00–$149.99',
    minimumEvidence: ['Receipt or invoice showing vendor, date, amount, and tax details', 'Additional prescribed information sufficient to establish the GST/HST amount and business purpose.'],
    requiredInformation: ['Vendor or payee', 'Date', 'Amount', 'Tax amount', 'Business purpose', 'GST/HST number if available'],
    summary: 'Additional prescribed information is required for the transaction.',
  },
  TIER_3: {
    tier: 'TIER_3',
    label: 'Tier 3: $150.00 and over',
    minimumEvidence: ['Full prescribed documentary support for the transaction', 'Receipt or invoice with sufficient detail to substantiate the tax and business purpose.'],
    requiredInformation: ['Vendor or payee', 'Date', 'Amount', 'Tax amount', 'Business purpose', 'GST/HST number if applicable', 'Document retention trail'],
    summary: 'The highest level of prescribed documentation must be satisfied.',
  },
});

/**
 * CRA documentation tiers used by the deterministic bookkeeping domain.
 * Amounts are CAD and thresholds are inclusive/exclusive as follows:
 *   Tier 1: < $30.00
 *   Tier 2: $30.00–$149.99
 *   Tier 3: >= $150.00
 */
export function getDocumentationTier(amountCad: number): DocumentationTier {
  assertFiniteNonNegativeAmount(amountCad);

  const cents = toCents(amountCad);
  if (cents < 3_000) return 'TIER_1';
  if (cents < 15_000) return 'TIER_2';
  return 'TIER_3';
}

export function getDocumentationRequirements(amountCad: number): DocumentationRequirementSet {
  return DOCUMENTATION_REQUIREMENTS_BY_TIER[getDocumentationTier(amountCad)];
}

export const validate_cra_documentation = getDocumentationRequirements;
export const validateCraDocumentation = getDocumentationRequirements;

export function normalizeDocumentationStatus(value: DocumentationStatus | DocumentationTier | string | null | undefined): DocumentationStatus {
  const normalized = String(value ?? '').trim().toUpperCase();

  switch (normalized) {
    case 'SUFFICIENT':
    case 'TIER_1':
    case 'TIER_2':
    case 'TIER_3':
      return 'sufficient';
    case 'INSUFFICIENT':
      return 'insufficient';
    case 'REVIEW':
      return 'review';
    case 'UNKNOWN':
      return 'unknown';
    default:
      return 'review';
  }
}

export function documentationTierLabel(tier: DocumentationTier): string {
  switch (tier) {
    case 'TIER_1': return 'Tier 1: under $30.00';
    case 'TIER_2': return 'Tier 2: $30.00–$149.99';
    case 'TIER_3': return 'Tier 3: $150.00 and over';
  }
}

function assertFiniteNonNegativeAmount(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('Amount must be a finite, non-negative CAD amount.');
  }
}

function toCents(amountCad: number): number {
  // Money is normalized to integer cents before comparing thresholds so that
  // floating-point representation cannot move $30.00 across a tier boundary.
  return Math.round((amountCad + Number.EPSILON) * 100);
}
