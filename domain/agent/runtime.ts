import { validateGstHstNumber } from '../cra/gst-hst';
import { verifyGifiCode } from '../cra/gifi';
import { calculateEligibleITC } from '../cra/itc';
import { classifyExpense, getCurrentReceipt, getReceiptDetails, requestHumanReview, sanitizeUntrustedText, validateCraDocumentation } from './tool-contracts';
import type { AppState, ApprovalRequest, Receipt } from './types';

export interface ProcessReceiptResult {
  readonly status: 'complete' | 'review' | 'error';
  readonly receiptId: string;
  readonly category: string;
  readonly gifiCode: string;
  readonly itc: number;
  readonly confidence: number;
  readonly briefing: string;
  readonly pendingApproval?: ApprovalRequest;
}

export function createAppState(receipts: Receipt[], selectedReceiptId: string | null): AppState {
  return {
    selectedReceiptId,
    receipts,
    processingStatus: 'idle',
  };
}

export function processSelectedReceipt(appState: AppState, explicitReceiptId?: string): ProcessReceiptResult {
  const selectedReceipt = getCurrentReceipt(appState) ?? (explicitReceiptId ? getReceiptDetails(appState, explicitReceiptId) : null);

  if (!selectedReceipt) {
    return {
      status: 'error',
      receiptId: explicitReceiptId ?? 'none',
      category: 'UNKNOWN',
      gifiCode: 'REVIEW',
      itc: 0,
      confidence: 0,
      briefing: 'No receipt is selected or the receipt could not be resolved from application state.',
    };
  }

  const docAssessment = validateCraDocumentation({
    receiptId: selectedReceipt.id,
    amount: selectedReceipt.subtotal,
  });

  const gstValidation = validateGstHstNumber(selectedReceipt.gstHstNumber);
  const classification = classifyExpense({
    receiptId: selectedReceipt.id,
    vendor: selectedReceipt.vendor,
    description: selectedReceipt.description,
    notes: selectedReceipt.notes,
  });

  const proposedGifi = classification.data.category === 'OFFICE_SUPPLIES' ? '8810' : classification.data.category === 'MEALS_AND_ENTERTAINMENT' ? '8523' : 'REVIEW';
  const gifiVerification = proposedGifi === 'REVIEW' ? { status: 'REVIEW_REQUIRED', code: 'REVIEW' } : verifyGifiCode(proposedGifi);

  const itcCalculation = calculateEligibleITC({
    subtotal: selectedReceipt.subtotal,
    taxAmount: selectedReceipt.taxAmount,
    commercialUsePercentage: selectedReceipt.commercialUsePercentage,
    mealEntertainment: classification.data.category === 'MEALS_AND_ENTERTAINMENT',
    documentationStatus: docAssessment.data.status,
  });

  const reviewRequired =
    gstValidation.status === 'missing' ||
    gstValidation.status === 'invalid' ||
    gstValidation.status === 'malformed' ||
    gstValidation.status === 'unknown' ||
    classification.data.status === 'review' ||
    gifiVerification.status === 'REVIEW_REQUIRED' ||
    itcCalculation.status === 'review';

  if (reviewRequired) {
    const approval: ApprovalRequest = {
      receiptId: selectedReceipt.id,
      reason: `${gstValidation.reason} ${classification.data.reason}`.trim(),
      proposedCategory: classification.data.category,
      proposedGifiCode: proposedGifi === 'REVIEW' ? 'REVIEW' : gifiVerification.code,
      proposedITC: itcCalculation.eligibleITC,
      requiresHumanApproval: true,
    };

    return {
      status: 'review',
      receiptId: selectedReceipt.id,
      category: classification.data.category,
      gifiCode: proposedGifi,
      itc: itcCalculation.eligibleITC,
      confidence: classification.data.confidence,
      briefing: `${sanitizeUntrustedText(selectedReceipt.description)} requires human review because the GST/HST documentation or classification is incomplete.`,
      pendingApproval: approval,
    };
  }

  return {
    status: 'complete',
    receiptId: selectedReceipt.id,
    category: classification.data.category,
    gifiCode: gifiVerification.code,
    itc: itcCalculation.eligibleITC,
    confidence: classification.data.confidence,
    briefing: `${classification.data.category} was processed with a verified GIFI code and a deterministic ITC of $${itcCalculation.eligibleITC.toFixed(2)}.`,
  };
}
