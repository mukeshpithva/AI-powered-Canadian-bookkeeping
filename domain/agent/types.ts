export type ProcessingStatus = 'idle' | 'processing' | 'review' | 'complete' | 'error';

export type ReceiptCategory =
  | 'OFFICE_SUPPLIES'
  | 'MEALS_AND_ENTERTAINMENT'
  | 'UNKNOWN'
  | 'CASH_DEPOSIT'
  | 'OTHER_EXPENSE';

export interface Receipt {
  readonly id: string;
  readonly vendor: string;
  readonly date: string;
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly total: number;
  readonly category: ReceiptCategory;
  readonly gstHstNumber: string | null;
  readonly commercialUsePercentage: number;
  readonly hasReceipt: boolean;
  readonly description: string;
  readonly notes?: string;
}

export interface ApprovalRequest {
  readonly receiptId: string;
  readonly reason: string;
  readonly proposedCategory: string;
  readonly proposedGifiCode: string;
  readonly proposedITC: number;
  readonly requiresHumanApproval: true;
}

export interface AgentToolExecution {
  readonly step: string;
  readonly status: 'running' | 'success' | 'error';
  readonly detail: string;
}

export interface AppState {
  readonly selectedReceiptId: string | null;
  readonly receipts: readonly Receipt[];
  readonly processingStatus: ProcessingStatus;
  readonly currentAnalysis?: {
    readonly receiptId: string;
    readonly category: ReceiptCategory;
    readonly gifiCode: string;
    readonly itc: number;
    readonly confidence: number;
    readonly briefing: string;
  };
  readonly toolExecution?: AgentToolExecution;
  readonly pendingApproval?: ApprovalRequest;
}

export interface ToolResultEnvelope<T> {
  readonly ok: boolean;
  readonly data: T;
  readonly warnings: readonly string[];
}
