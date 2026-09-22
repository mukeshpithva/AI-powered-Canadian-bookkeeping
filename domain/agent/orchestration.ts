import { processSelectedReceipt } from './runtime';
import type { AppState, Receipt, ProcessingStatus } from './types';

export type StreamEventType =
  | 'ui:ready'
  | 'receipt:selected'
  | 'tool:start'
  | 'tool:success'
  | 'tool:error'
  | 'state:update'
  | 'approval:requested'
  | 'agent:complete'
  | 'agent:review';

export interface StreamEvent {
  readonly type: StreamEventType;
  readonly step: string;
  readonly payload?: Record<string, unknown>;
  readonly timestamp: string;
}

export interface StreamSubscription {
  readonly id: string;
  readonly callback: (event: StreamEvent) => void;
}

export interface AppCoordinationResult {
  readonly appState: AppState;
  readonly processingResult: ReturnType<typeof processSelectedReceipt>;
  readonly events: readonly StreamEvent[];
}

export class AppStateStream {
  private readonly subscribers = new Set<(event: StreamEvent) => void>();
  private readonly events: StreamEvent[] = [];

  subscribe(callback: (event: StreamEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  emit(type: StreamEventType, step: string, payload?: Record<string, unknown>): StreamEvent {
    const event: StreamEvent = {
      type,
      step,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    for (const callback of this.subscribers) {
      callback(event);
    }

    return event;
  }

  snapshot(): readonly StreamEvent[] {
    return [...this.events];
  }
}

export class AppOrchestrator {
  private readonly stream: AppStateStream;

  constructor(stream = new AppStateStream()) {
    this.stream = stream;
  }

  getStream(): AppStateStream {
    return this.stream;
  }

  selectReceipt(appState: AppState, receiptId: string): AppState {
    const nextState: AppState = {
      ...appState,
      selectedReceiptId: receiptId,
      processingStatus: 'idle',
    };

    this.stream.emit('receipt:selected', 'select-receipt', { receiptId, selectedReceiptId: receiptId });
    this.stream.emit('state:update', 'sync-state', {
      selectedReceiptId: receiptId,
      processingStatus: nextState.processingStatus,
    });

    return nextState;
  }

  process(receipts: readonly Receipt[], selectedReceiptId: string | null, explicitReceiptId?: string): AppCoordinationResult {
    const initialState: AppState = {
      selectedReceiptId,
      receipts,
      processingStatus: 'processing',
    };

    this.stream.emit('ui:ready', 'begin-processing', {
      selectedReceiptId,
      receiptCount: receipts.length,
    });

    this.stream.emit('tool:start', 'read-selected-receipt', {
      selectedReceiptId: explicitReceiptId ?? selectedReceiptId,
    });

    const processingResult = processSelectedReceipt(initialState, explicitReceiptId);

    const finalState: AppState = {
      ...initialState,
      selectedReceiptId: processingResult.receiptId,
      processingStatus: processingResult.status === 'complete' ? 'complete' : processingResult.status === 'review' ? 'review' : 'error',
      currentAnalysis: {
        receiptId: processingResult.receiptId,
        category: processingResult.category as any,
        gifiCode: processingResult.gifiCode,
        itc: processingResult.itc,
        confidence: processingResult.confidence,
        briefing: processingResult.briefing,
      },
      pendingApproval: processingResult.pendingApproval,
    };

    this.stream.emit('tool:success', 'validate-documentation', {
      receiptId: processingResult.receiptId,
      status: processingResult.status,
    });

    if (processingResult.status === 'review') {
      this.stream.emit('approval:requested', 'request-human-review', {
        receiptId: processingResult.receiptId,
        reason: processingResult.pendingApproval?.reason,
      });
      this.stream.emit('agent:review', 'human-review-needed', {
        receiptId: processingResult.receiptId,
      });
    } else if (processingResult.status === 'complete') {
      this.stream.emit('agent:complete', 'complete-processing', {
        receiptId: processingResult.receiptId,
        itc: processingResult.itc,
      });
    }

    this.stream.emit('state:update', 'sync-state', {
      selectedReceiptId: finalState.selectedReceiptId,
      processingStatus: finalState.processingStatus,
      pendingApproval: !!finalState.pendingApproval,
    });

    return {
      appState: finalState,
      processingResult,
      events: this.stream.snapshot(),
    };
  }
}

export function createOrchestrator(): AppOrchestrator {
  return new AppOrchestrator();
}
