export type GstHstValidationStatus = 'valid' | 'invalid' | 'missing' | 'malformed' | 'suspicious' | 'unknown';

export interface GstHstValidationResult {
  readonly raw: string | null;
  readonly normalized: string;
  readonly status: GstHstValidationStatus;
  readonly isValidFormat: boolean;
  readonly externalRegistrationVerification: 'unverified' | 'not_requested';
  readonly reason: string;
}

const GST_HST_PATTERN = /^\d{9}[A-Z]{2}\d{4}$/i;

export function validateGstHstNumber(value: string | null | undefined): GstHstValidationResult {
  const raw = typeof value === 'string' ? value.trim() : value == null ? null : String(value).trim();

  if (raw == null || raw === '') {
    return {
      raw: null,
      normalized: '',
      status: 'missing',
      isValidFormat: false,
      externalRegistrationVerification: 'unverified',
      reason: 'GST/HST registration number is missing.',
    };
  }

  const normalized = raw.replace(/[\s\-]/g, '').toUpperCase();

  if (normalized === 'UNKNOWN' || normalized === 'UNAVAILABLE' || normalized === 'N/A') {
    return {
      raw,
      normalized,
      status: 'unknown',
      isValidFormat: false,
      externalRegistrationVerification: 'unverified',
      reason: 'GST/HST registration status is unavailable or unknown.',
    };
  }

  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return {
      raw,
      normalized,
      status: 'malformed',
      isValidFormat: false,
      externalRegistrationVerification: 'unverified',
      reason: 'GST/HST registration number contains unsupported characters.',
    };
  }

  if (!GST_HST_PATTERN.test(normalized)) {
    return {
      raw,
      normalized,
      status: 'invalid',
      isValidFormat: false,
      externalRegistrationVerification: 'unverified',
      reason: 'GST/HST registration number does not match the Canadian format.',
    };
  }

  const leadingNine = normalized.slice(0, 9);
  if (leadingNine === '000000000' || /^([0-9])\1{8}$/.test(leadingNine)) {
    return {
      raw,
      normalized,
      status: 'suspicious',
      isValidFormat: true,
      externalRegistrationVerification: 'unverified',
      reason: 'GST/HST registration number is syntactically valid but suspicious.',
    };
  }

  return {
    raw,
    normalized,
    status: 'valid',
    isValidFormat: true,
    externalRegistrationVerification: 'unverified',
    reason: 'GST/HST registration number format is valid; CRA registration remains unverified.',
  };
}

export const validateGSTNumber = validateGstHstNumber;
export const validateGSTHSTNumber = validateGstHstNumber;
export const validateGstRegistrationNumber = validateGstHstNumber;
export const validateGSTRegistrationNumber = validateGstHstNumber;
export const validate_gst_hst_number_format = validateGstHstNumber;
export const validateGstHstNumberFormat = validateGstHstNumber;
