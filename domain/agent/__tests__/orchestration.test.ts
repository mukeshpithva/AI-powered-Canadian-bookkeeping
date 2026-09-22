import { describe, expect, it } from 'vitest';
import { AppOrchestrator } from '../orchestration';
import type { Receipt } from '../types';

const receipts: Receipt[] = [
  {
    id: 'receipt_001',
    vendor: 'Staples Canada',
    date: '2026-09-18',
    subtotal: 82,
    taxAmount: 4.1,
    total: 86.1,
    category: 'UNKNOWN',
    gstHstNumber: '123456789RT0001',
    commercialUsePercentage: 100,
    hasReceipt: true,
    description: 'Office supplies',
    notes: 'Commercial use 100%.',
  },
  {
    id: 'receipt_003',
    vendor: 'Unknown Vendor',
    date: '2026-09-24',
    subtotal: 1200,
    taxAmount: 60,
    total: 1260,
    category: 'UNKNOWN',
    gstHstNumber: null,
    commercialUsePercentage: 100,
    hasReceipt: true,
    description: 'Large purchase with missing GST/HST number.',
    notes: 'Potential missing documentation requirement.',
  },
];

describe('app orchestration', () => {
  it('emits streaming events for a selected receipt and review state', () => {
    const orchestrator = new AppOrchestrator();
    const result = orchestrator.process(receipts, 'receipt_003');

    expect(result.processingResult.status).toBe('review');
    expect(result.appState.processingStatus).toBe('review');
    expect(result.events.some((event) => event.type === 'receipt:selected' || event.type === 'state:update')).toBe(true);
    expect(result.events.some((event) => event.type === 'approval:requested')).toBe(true);
  });

  it('syncs selected receipt state before processing begins', () => {
    const orchestrator = new AppOrchestrator();
    const state = orchestrator.selectReceipt({
      selectedReceiptId: null,
      receipts,
      processingStatus: 'idle',
    }, 'receipt_001');

    expect(state.selectedReceiptId).toBe('receipt_001');
    expect(state.processingStatus).toBe('idle');
  });
});
