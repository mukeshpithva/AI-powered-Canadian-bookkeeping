import type { AppState, Receipt } from '../domain/agent/types';

export interface AgentStoreSnapshot {
  readonly selectedReceiptId: string | null;
  readonly processingStatus: AppState['processingStatus'];
  readonly currentAnalysis?: AppState['currentAnalysis'];
  readonly pendingApproval?: AppState['pendingApproval'];
}

export const agentStore = {
  state: {
    selectedReceiptId: 'receipt_003',
    processingStatus: 'idle',
    currentAnalysis: undefined,
    pendingApproval: undefined,
  } as AgentStoreSnapshot,

  subscribe(callback: (snapshot: AgentStoreSnapshot) => void) {
    const listener = () => callback(this.state);
    return listener;
  },

  setState(next: Partial<AgentStoreSnapshot>) {
    this.state = { ...this.state, ...next };
  },

  attachReceipts(receipts: Receipt[]) {
    // The app can keep a receipt list in the store and coordinate it with the UI.
    return receipts;
  },
};
