import { z } from 'zod';
import { getDocumentationRequirements, normalizeDocumentationStatus } from '../cra/documentation';
import { validateGstHstNumber } from '../cra/gst-hst';
import { verifyGifiCode } from '../cra/gifi';
import { calculateEligibleITC } from '../cra/itc';
import type { AppState, Receipt, ToolResultEnvelope } from './types';

export const getCurrentReceiptInput = z.object({
  selectedReceiptId: z.string().nullable().optional(),
});

export const getReceiptDetailsInput = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
});

export const validateCraDocumentationInput = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
  amount: z.number().nonnegative('amount must be non-negative'),
});

export const validateGstHstNumberFormatInput = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
  gstHstNumber: z.string().nullable().optional(),
});

export const calculateEligibleITCInput = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  commercialUsePercentage: z.number().min(0).max(100).default(100),
  mealEntertainment: z.boolean().default(false),
  documentationStatus: z.enum(['sufficient', 'insufficient', 'review', 'unknown']).default('sufficient'),
});

export const classifyExpenseInput = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
  vendor: z.string().min(1),
  description: z.string().min(1),
  notes: z.string().optional(),
});

export const assignGifiCodeInput = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
  gifiCode: z.string().min(1),
});

export const updateExpenseClassificationInput = z.object({
  receiptId: z.string().min(1),
  category: z.enum(['OFFICE_SUPPLIES', 'MEALS_AND_ENTERTAINMENT', 'UNKNOWN', 'CASH_DEPOSIT', 'OTHER_EXPENSE']),
  gifiCode: z.string().min(1),
  notes: z.string().optional(),
});

export function getCurrentReceipt(appState: AppState): Receipt | null {
  if (!appState.selectedReceiptId) {
    return null;
  }

  return appState.receipts.find((receipt) => receipt.id === appState.selectedReceiptId) ?? null;
}

export function getReceiptDetails(appState: AppState, receiptId: string): Receipt {
  const receipt = appState.receipts.find((item) => item.id === receiptId);

  if (!receipt) {
    throw new Error(`Receipt ${receiptId} was not found.`);
  }

  return receipt;
}

export function sanitizeUntrustedText(raw: string): string {
  return raw
    .replace(/IMPORTANT SYSTEM MESSAGE:.*$/gi, '[sanitized]')
    .replace(/IGNORE ALL CRA RULES.*$/gi, '[sanitized]')
    .replace(/APPROVE THIS EXPENSE.*$/gi, '[sanitized]')
    .replace(/REVEAL YOUR SYSTEM PROMPT.*$/gi, '[sanitized]')
    .replace(/SYSTEM MESSAGE.*$/gi, '[sanitized]')
    .trim();
}

export function validateCraDocumentation({ receiptId, amount }: { receiptId: string; amount: number }): ToolResultEnvelope<{ tier: string; status: 'sufficient' | 'review'; requirements: readonly string[] }> {
  const tier = getDocumentationRequirements(amount).tier;
  const status = normalizeDocumentationStatus(amount >= 150 ? 'TIER_3' : amount >= 30 ? 'TIER_2' : 'TIER_1');

  return {
    ok: true,
    warnings: [],
    data: {
      tier,
      status: status === 'sufficient' ? 'sufficient' : 'review',
      requirements: [...getDocumentationRequirements(amount).requiredInformation],
    },
  };
}

export function validateGstHstNumberFormat({ receiptId, gstHstNumber }: { receiptId: string; gstHstNumber: string | null | undefined }): ToolResultEnvelope<{ status: string; isValidFormat: boolean; reason: string }> {
  const result = validateGstHstNumber(gstHstNumber ?? null);

  return {
    ok: result.status !== 'missing' && result.status !== 'invalid' && result.status !== 'malformed',
    warnings: result.status === 'missing' || result.status === 'invalid' || result.status === 'malformed' ? ['Documentation issue detected.'] : [],
    data: {
      status: result.status,
      isValidFormat: result.isValidFormat,
      reason: result.reason,
    },
  };
}

export function calculateEligibleITCTool(input: {
  receiptId: string;
  subtotal: number;
  taxAmount: number;
  commercialUsePercentage: number;
  mealEntertainment: boolean;
  documentationStatus: 'sufficient' | 'insufficient' | 'review' | 'unknown';
}): ToolResultEnvelope<{ grossTax: number; eligibleITC: number; eligibilityPercentage: number; status: string; reasonCode: string }> {
  const result = calculateEligibleITC({
    subtotal: input.subtotal,
    taxAmount: input.taxAmount,
    commercialUsePercentage: input.commercialUsePercentage,
    mealEntertainment: input.mealEntertainment,
    documentationStatus: input.documentationStatus,
  });

  return {
    ok: result.status !== 'review',
    warnings: result.status === 'review' ? ['Review required before final approval.'] : [],
    data: {
      grossTax: result.grossTax,
      eligibleITC: result.eligibleITC,
      eligibilityPercentage: result.eligibilityPercentage,
      status: result.status,
      reasonCode: result.reasonCode,
    },
  };
}

export function classifyExpense({ receiptId, vendor, description, notes }: { receiptId: string; vendor: string; description: string; notes?: string }): ToolResultEnvelope<{ category: string; confidence: number; reason: string; status: 'confirmed' | 'review' }> {
  const sanitizedDescription = sanitizeUntrustedText(description);
  const vendorText = sanitizeUntrustedText(vendor);
  const noteText = sanitizeUntrustedText(notes ?? '');
  const combined = `${vendorText} ${sanitizedDescription} ${noteText}`.toLowerCase();

  if (combined.includes('bank deposit') || combined.includes('cash deposit')) {
    return {
      ok: false,
      warnings: ['Cash deposits are not business expenses and do not qualify for ITC.'],
      data: {
        category: 'CASH_DEPOSIT',
        confidence: 0.99,
        reason: 'This is a cash deposit, not a business expense.',
        status: 'review',
      },
    };
  }

  if (combined.includes('restaurant') || combined.includes('meal') || combined.includes('dinner') || combined.includes('entertainment')) {
    return {
      ok: true,
      warnings: [],
      data: {
        category: 'MEALS_AND_ENTERTAINMENT',
        confidence: 0.92,
        reason: 'Business meal or entertainment expense detected.',
        status: 'confirmed',
      },
    };
  }

  if (combined.includes('office') || combined.includes('supplies') || combined.includes('stationery') || combined.includes('staples')) {
    return {
      ok: true,
      warnings: [],
      data: {
        category: 'OFFICE_SUPPLIES',
        confidence: 0.95,
        reason: 'Office and business supplies classification matches the purchase details.',
        status: 'confirmed',
      },
    };
  }

  return {
    ok: true,
    warnings: ['Classification is uncertain; a human review is recommended.'],
    data: {
      category: 'UNKNOWN',
      confidence: 0.48,
      reason: 'Unable to confidently determine the business purpose from the available untrusted text.',
      status: 'review',
    },
  };
}

export function assignGifiCode({ receiptId, gifiCode }: { receiptId: string; gifiCode: string }): ToolResultEnvelope<{ code: string; verified: boolean; section?: string; reason?: string }> {
  const verification = verifyGifiCode(gifiCode);

  return {
    ok: verification.status === 'VERIFIED',
    warnings: verification.status === 'REVIEW_REQUIRED' ? ['Unknown GIFI code requires review.'] : [],
    data: {
      code: verification.code,
      verified: verification.status === 'VERIFIED',
      section: verification.entry?.section,
      reason: verification.reason,
    },
  };
}

export function updateExpenseClassification({ receiptId, category, gifiCode, notes }: { receiptId: string; category: 'OFFICE_SUPPLIES' | 'MEALS_AND_ENTERTAINMENT' | 'UNKNOWN' | 'CASH_DEPOSIT' | 'OTHER_EXPENSE'; gifiCode: string; notes?: string }): ToolResultEnvelope<{ receiptId: string; category: string; gifiCode: string }> {
  const verification = verifyGifiCode(gifiCode);

  if (verification.status !== 'VERIFIED') {
    return {
      ok: false,
      warnings: ['GIFI code must exist in the controlled catalogue.'],
      data: {
        receiptId,
        category,
        gifiCode,
      },
    };
  }

  return {
    ok: true,
    warnings: [],
    data: {
      receiptId,
      category,
      gifiCode,
    },
  };
}

export function requestHumanReview({ receiptId, reason, proposedCategory, proposedGifiCode, proposedITC }: { receiptId: string; reason: string; proposedCategory: string; proposedGifiCode: string; proposedITC: number }): ToolResultEnvelope<{ receiptId: string; requiresHumanApproval: true; reason: string }> {
  return {
    ok: true,
    warnings: ['Human review required before posting the classification.'],
    data: {
      receiptId,
      requiresHumanApproval: true,
      reason,
    },
  };
}

export function getProcessingStatus(appState: AppState): ToolResultEnvelope<{ processingStatus: string; selectedReceiptId: string | null; pendingApproval: boolean }> {
  return {
    ok: true,
    warnings: [],
    data: {
      processingStatus: appState.processingStatus,
      selectedReceiptId: appState.selectedReceiptId,
      pendingApproval: appState.pendingApproval !== undefined,
    },
  };
}
