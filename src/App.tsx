import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import type { AppState, Receipt, ProcessingStatus, ReceiptCategory } from '../domain/agent/types';
import { AppOrchestrator } from '../domain/agent/orchestration';
import type { StreamEvent } from '../domain/agent/orchestration';
import { agentStore } from './agentStore';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import { validateGstHstNumber } from '../domain/cra/gst-hst';
import { calculateEligibleITC } from '../domain/cra/itc';
import DashboardPage from './pages/DashboardPage';
import ReceiptsPage from './pages/ReceiptsPage';
import CompliancePage from './pages/CompliancePage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';

const initialReceipts: Receipt[] = [
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
    id: 'receipt_002',
    vendor: 'Restaurant ABC',
    date: '2026-09-20',
    subtotal: 240,
    taxAmount: 12,
    total: 252,
    category: 'UNKNOWN',
    gstHstNumber: '123456789RT0001',
    commercialUsePercentage: 100,
    hasReceipt: true,
    description: 'Business meal with clients',
    notes: 'Meals and entertainment; 50% ITC limit applies.',
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
    description: 'Large purchase with missing GST/HST number',
    notes: 'Missing documentation requirement for high-value transaction.',
  },
  {
    id: 'receipt_004',
    vendor: 'Bank of Montreal',
    date: '2026-09-30',
    subtotal: 5000,
    taxAmount: 0,
    total: 5000,
    category: 'CASH_DEPOSIT',
    gstHstNumber: null,
    commercialUsePercentage: 0,
    hasReceipt: true,
    description: 'Bank deposit',
    notes: 'Not an expense; should not be treated as ITC eligible.',
  },
  {
    id: 'receipt_005',
    vendor: 'Adobe Canada',
    date: '2026-10-02',
    subtotal: 89,
    taxAmount: 4.45,
    total: 93.45,
    category: 'OFFICE_SUPPLIES',
    gstHstNumber: '987654321RT0001',
    commercialUsePercentage: 100,
    hasReceipt: true,
    description: 'Creative software subscription',
    notes: 'Monthly business software subscription.',
  },
  {
    id: 'receipt_006',
    vendor: 'Purolator',
    date: '2026-10-04',
    subtotal: 64.5,
    taxAmount: 3.23,
    total: 67.73,
    category: 'OFFICE_SUPPLIES',
    gstHstNumber: '876543210RT0001',
    commercialUsePercentage: 100,
    hasReceipt: true,
    description: 'Client document shipping',
    notes: 'Shipping expense for commercial client delivery.',
  },
  {
    id: 'receipt_007',
    vendor: 'Petro-Canada',
    date: '2026-10-06',
    subtotal: 118.2,
    taxAmount: 5.91,
    total: 124.11,
    category: 'UNKNOWN',
    gstHstNumber: '765432109RT0001',
    commercialUsePercentage: 80,
    hasReceipt: true,
    description: 'Business vehicle fuel',
    notes: 'Commercial use percentage requires confirmation.',
  },
  {
    id: 'receipt_008',
    vendor: 'Freshii Toronto',
    date: '2026-10-08',
    subtotal: 156,
    taxAmount: 7.8,
    total: 163.8,
    category: 'MEALS_AND_ENTERTAINMENT',
    gstHstNumber: '654321098RT0001',
    commercialUsePercentage: 100,
    hasReceipt: true,
    description: 'Client lunch meeting',
    notes: 'Business meal; standard 50% ITC limitation applies.',
  },
  {
    id: 'receipt_009',
    vendor: 'Rogers Business',
    date: '2026-10-10',
    subtotal: 210,
    taxAmount: 10.5,
    total: 220.5,
    category: 'OFFICE_SUPPLIES',
    gstHstNumber: '543210987RT0001',
    commercialUsePercentage: 90,
    hasReceipt: true,
    description: 'Business internet and mobile services',
    notes: 'Commercial use allocation set to 90%.',
  },
];

const validCredentials = {
  username: 'admin',
  password: 'Admin@2026',
};

type PageKey = 'dashboard' | 'receipts' | 'compliance' | 'audit' | 'settings';
type ChatMessage = {
  id: string;
  speaker: 'assistant' | 'user';
  text: string;
  time: string;
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff5c35', light: '#ff8b69', dark: '#d84a27' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#4b5563' },
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 16 },
});

const navItems: Array<{ key: PageKey; label: string; icon: any }> = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardRoundedIcon },
  { key: 'receipts', label: 'Receipts', icon: ReceiptLongRoundedIcon },
  { key: 'compliance', label: 'Compliance', icon: FactCheckRoundedIcon },
  { key: 'audit', label: 'Audit Log', icon: ArticleRoundedIcon },
  { key: 'settings', label: 'Settings', icon: SettingsRoundedIcon },
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

function labelForCategory(category: ReceiptCategory): string {
  return category.replace(/_/g, ' ');
}

function auditHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `sha256:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function auditReceiptId(event: StreamEvent): string {
  const receiptId = event.payload?.receiptId;
  const selectedReceiptId = event.payload?.selectedReceiptId;
  return typeof receiptId === 'string'
    ? receiptId
    : typeof selectedReceiptId === 'string'
      ? selectedReceiptId
      : 'workspace';
}

function auditStatus(event: StreamEvent): 'success' | 'review' | 'running' | 'error' {
  if (event.type === 'tool:start') return 'running';
  if (event.type === 'tool:error') return 'error';
  if (event.type === 'approval:requested' || event.type === 'agent:review') return 'review';
  return 'success';
}

function createAuditBaselineEvents(receipts: readonly Receipt[]): StreamEvent[] {
  const baselineActions: Array<{ type: StreamEvent['type']; step: string; status: 'success' | 'review' }> = [
    { type: 'ui:ready', step: 'initialize-compliance-workspace', status: 'success' },
    { type: 'receipt:selected', step: 'select-receipt', status: 'success' },
    { type: 'tool:start', step: 'read-selected-receipt', status: 'success' },
    { type: 'tool:success', step: 'validate-gst-hst-number', status: 'success' },
    { type: 'tool:success', step: 'validate-documentation', status: 'success' },
    { type: 'tool:success', step: 'classify-expense', status: 'success' },
    { type: 'tool:success', step: 'verify-gifi-code', status: 'success' },
    { type: 'tool:success', step: 'calculate-eligible-itc', status: 'success' },
    { type: 'state:update', step: 'sync-state', status: 'success' },
    { type: 'approval:requested', step: 'request-human-review', status: 'review' },
    { type: 'agent:review', step: 'human-review-needed', status: 'review' },
    { type: 'agent:complete', step: 'complete-processing', status: 'success' },
  ];

  return baselineActions.map((action, index) => ({
    type: action.type,
    step: action.step,
    timestamp: new Date(Date.now() - (baselineActions.length - index) * 60000).toISOString(),
    payload: {
      receiptId: receipts[index % Math.max(receipts.length, 1)]?.id ?? 'receipt_003',
      status: action.status,
      ruleVersion: '2026.09.1',
      actor: 'agent',
      model: 'cra-deterministic-agent',
    },
  }));
}

export default function App() {
  const orchestrator = useMemo(() => new AppOrchestrator(), []);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [selectedId, setSelectedId] = useState<string>('receipt_003');
  const [page, setPage] = useState<PageKey>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const persisted = localStorage.getItem('loopnow-auth');
    return persisted === 'true';
  });
  const [loginState, setLoginState] = useState({ username: 'admin', password: 'Admin@2026' });
  const [loginError, setLoginError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 980);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(true);
  const [addReceiptDialogOpen, setAddReceiptDialogOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    vendor: '',
    date: '',
    subtotal: '',
    taxAmount: '',
    gstHstNumber: '',
    notes: '',
  });
  const [receiptErrors, setReceiptErrors] = useState<Record<string, string>>({});
  const [workflowForm, setWorkflowForm] = useState({
    classification: 'UNKNOWN',
    reviewStatus: 'pending',
    documentationTier: 'Tier 2',
    gifiCode: '8810',
    policyNote: '',
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      speaker: 'assistant',
      text: '### GST/HST Calculator\n\nI am an app-aware, stateful, tool-using, observable, secure and production-oriented AI agent that can operate within a Canadian bookkeeping workflow.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [state, setState] = useState<AppState>({
    selectedReceiptId: 'receipt_003',
    receipts,
    processingStatus: 'idle',
  });
  const [events, setEvents] = useState(() => orchestrator.getStream().snapshot());

  useEffect(() => {
    localStorage.setItem('loopnow-auth', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    const savedPage = localStorage.getItem('loopnow-page') as PageKey | null;
    if (savedPage && navItems.some((item) => item.key === savedPage)) {
      setPage(savedPage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('loopnow-page', page);
  }, [page]);

  agentStore.setState({
    selectedReceiptId: state.selectedReceiptId,
    processingStatus: state.processingStatus,
    currentAnalysis: state.currentAnalysis,
    pendingApproval: state.pendingApproval,
  });

  const selectedReceipt = receipts.find((receipt) => receipt.id === selectedId) ?? receipts[0];
  const handlePageChange = (nextPage: PageKey) => {
    setPage(nextPage);
    if (window.innerWidth <= 980) {
      setSidebarCollapsed(true);
    }
  };
  const gstChartData = useMemo(
    () =>
      receipts
        .slice(0, 6)
        .map((receipt) => ({
          label: receipt.vendor.length > 14 ? `${receipt.vendor.slice(0, 12)}…` : receipt.vendor,
          amount: receipt.taxAmount,
          total: receipt.total,
          review: receipt.id === selectedId || receipt.gstHstNumber === null,
        }))
        .reverse(),
    [receipts, selectedId],
  );
  const maxGstAmount = Math.max(...gstChartData.map((item) => item.amount), 1);
  const gstTotal = receipts.reduce((sum, receipt) => sum + receipt.taxAmount, 0);
  const reviewCount = receipts.filter((receipt) => receipt.gstHstNumber === null || receipt.category === 'UNKNOWN').length;
  const complianceRows = receipts.map((receipt) => {
    const gstValidation = validateGstHstNumber(receipt.gstHstNumber);
    const isMeal = receipt.category === 'MEALS_AND_ENTERTAINMENT';
    const itc = calculateEligibleITC({
      subtotal: receipt.subtotal,
      taxAmount: receipt.taxAmount,
      commercialUsePercentage: receipt.commercialUsePercentage,
      mealEntertainment: isMeal,
      documentationStatus: receipt.hasReceipt && gstValidation.status === 'valid' ? 'sufficient' : 'review',
    });
    return { receipt, gstValidation, itc, isMeal };
  });
  const validTaxIds = complianceRows.filter((row) => row.gstValidation.status === 'valid').length;
  const documentationReady = complianceRows.filter((row) => row.receipt.hasReceipt).length;
  const eligibleItc = complianceRows.reduce((sum, row) => sum + row.itc.eligibleITC, 0);
  const itcCoverage = gstTotal > 0 ? Math.round((eligibleItc / gstTotal) * 100) : 0;
  const complianceScore = receipts.length === 0
    ? 0
    : Math.round(((validTaxIds / receipts.length) * 45) + ((documentationReady / receipts.length) * 35) + (Math.max(0, 100 - reviewCount * 10) * 0.2));
  const auditTimelineEvents = useMemo(
    () => [...createAuditBaselineEvents(receipts), ...events].slice(-12),
    [events, receipts],
  );

  const selectReceipt = (receiptId: string) => {
    const nextState = orchestrator.selectReceipt(state, receiptId);
    setSelectedId(receiptId);
    setState(nextState);
    setEvents(orchestrator.getStream().snapshot());
  };

  const processSelected = () => {
    const result = orchestrator.process(receipts, selectedId, selectedId);
    setState(result.appState);
    setEvents(result.events);
  };

  const handleApproval = (approved: boolean) => {
    const status: ProcessingStatus = approved ? 'complete' : 'review';
    setState((current) => ({
      ...current,
      processingStatus: status,
      pendingApproval: undefined,
      currentAnalysis: current.currentAnalysis
        ? {
            ...current.currentAnalysis,
            briefing: approved
              ? 'Approved by reviewer. Final classification has been accepted.'
              : 'Rejected by reviewer. The transaction remains in review pending correction.',
          }
        : undefined,
    }));
    setEvents((current) => [
      ...current,
      {
        type: approved ? 'agent:complete' : 'agent:review',
        step: approved ? 'approve-classification' : 'reject-classification',
        payload: { approved },
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      loginState.username === validCredentials.username &&
      loginState.password === validCredentials.password
    ) {
      setIsLoggedIn(true);
      setLoginError('');
      setPage('dashboard');
      return;
    }

    setLoginError('Invalid username or password.');
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const lowerText = trimmed.toLowerCase();
    const assistantReply = lowerText.includes('process') || lowerText.includes('receipt')
      ? `I reviewed ${selectedReceipt.vendor}. The selected receipt is ${selectedReceipt.date} with GST/HST of ${formatMoney(selectedReceipt.taxAmount)} and a review status because the GST/HST number is missing.`
      : lowerText.includes('meal') || lowerText.includes('restaurant')
        ? 'The meal expense is subject to the standard CRA 50% ITC limitation. I would apply the policy-driven limitation rather than allowing a higher percentage.'
        : lowerText.includes('gifi') || lowerText.includes('code')
          ? 'I only accept GIFI codes from the controlled CRA catalogue. Unknown codes are routed to review rather than silently accepted.'
          : `I am working on the selected receipt for ${selectedReceipt.vendor}. The current review focus is documentation sufficiency, GST/HST formatting, and eligible ITC determination.`;

    setChatMessages((current) => [
      ...current,
      nextUserMessage,
      {
        id: `assistant-${Date.now()}-reply`,
        speaker: 'assistant',
        text: assistantReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  const validateReceiptForm = (data: typeof receiptForm) => {
    const errors: Record<string, string> = {};

    if (!data.vendor.trim()) errors.vendor = 'Vendor name is required.';
    if (!data.date) errors.date = 'Date is required.';
    const subtotal = Number(data.subtotal);
    const taxAmount = Number(data.taxAmount);
    if (!data.subtotal || Number.isNaN(subtotal) || subtotal <= 0) {
      errors.subtotal = 'Subtotal must be a positive number.';
    }
    if (data.taxAmount === '' || Number.isNaN(taxAmount) || taxAmount < 0) {
      errors.taxAmount = 'GST/HST amount must be zero or more.';
    }
    if (data.gstHstNumber && !/^[0-9]{9}[A-Z]{2}[0-9A-Z]{5}$/.test(data.gstHstNumber.trim())) {
      errors.gstHstNumber = 'Enter a valid GST/HST business number format.';
    }

    return errors;
  };

  const handleReceiptFormChange = (field: keyof typeof receiptForm, value: string) => {
    setReceiptForm((current) => ({ ...current, [field]: value }));
    setReceiptErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleReceiptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateReceiptForm(receiptForm);
    setReceiptErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const subtotal = Number(receiptForm.subtotal);
    const taxAmount = Number(receiptForm.taxAmount);
    const nextReceipt: Receipt = {
      id: `receipt_${Date.now()}`,
      vendor: receiptForm.vendor.trim(),
      date: receiptForm.date,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      category: workflowForm.classification as Receipt['category'],
      gstHstNumber: receiptForm.gstHstNumber.trim() || null,
      commercialUsePercentage: 100,
      hasReceipt: true,
      description: workflowForm.policyNote || 'New receipt added from intake form',
      notes: receiptForm.notes.trim() || 'Captured directly from the intake form.',
    };

    const nextReceipts = [nextReceipt, ...receipts];
    setReceipts(nextReceipts);
    setSelectedId(nextReceipt.id);
    setReceiptForm({ vendor: '', date: '', subtotal: '', taxAmount: '', gstHstNumber: '', notes: '' });
    setWorkflowForm({ classification: 'UNKNOWN', reviewStatus: 'pending', documentationTier: 'Tier 2', gifiCode: '8810', policyNote: '' });
    setAddReceiptDialogOpen(false);
    setPage('receipts');

    const result = orchestrator.process(nextReceipts, nextReceipt.id, nextReceipt.id);
    setState(result.appState);
    setEvents(result.events);
  };

  if (!isLoggedIn) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="login-screen">
          <div className="login-layout">
            <section className="login-visual" aria-label="AI banking workspace">
              <div className="login-visual-glow glow-one" />
              <div className="login-visual-glow glow-two" />
              <div className="login-visual-copy">
                <div className="login-brand compact-brand">
                  <div className="brand-mark">L</div>
                  <div>
                    <Typography variant="overline" sx={{ color: '#ffb19c', letterSpacing: '0.14em' }}>Loopnow CPA Copilot</Typography>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>Intelligent bookkeeping</Typography>
                  </div>
                </div>
                <Typography className="login-visual-title">Turn every transaction into a clearer financial decision.</Typography>
                <Typography className="login-visual-description">
                  AI-assisted receipt capture, GST/HST validation, and human review controls built for Canadian finance teams.
                </Typography>
                <div className="login-feature-list">
                  <span><i /> CRA-aware tax workflows</span>
                  <span><i /> Observable agent activity</span>
                  <span><i /> Secure review checkpoints</span>
                </div>
              </div>

              <div className="banking-illustration" aria-hidden="true">
                <div className="illustration-orbit orbit-one" />
                <div className="illustration-orbit orbit-two" />
                <div className="bank-building">
                  <div className="building-roof" />
                  <div className="building-columns">
                    <span /><span /><span /><span />
                  </div>
                  <div className="building-base" />
                </div>
                <div className="ai-chip">
                  <span className="chip-dot" />
                  <strong>AI</strong>
                  <small>Finance engine</small>
                </div>
                <div className="chart-sparkline">
                  <span className="sparkline-line" />
                  <span className="spark-point point-one" />
                  <span className="spark-point point-two" />
                  <span className="spark-point point-three" />
                  <span className="spark-point point-four" />
                </div>
              </div>
            </section>

            <section className="login-card">
              <div className="login-form-heading">
                <p className="eyebrow">Workspace access</p>
                <Typography variant="h4" sx={{ color: '#111827', fontWeight: 800 }}>Welcome back</Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.8 }}>Sign in to continue to your finance command centre.</Typography>
              </div>
              <Box component="form" onSubmit={handleLogin} sx={{ display: 'grid', gap: 2 }}>
                <TextField label="Username" value={loginState.username} onChange={(event) => setLoginState((current) => ({ ...current, username: event.target.value }))} fullWidth />
                <TextField label="Password" type="password" value={loginState.password} onChange={(event) => setLoginState((current) => ({ ...current, password: event.target.value }))} fullWidth />
                {loginError ? <Typography color="error.main">{loginError}</Typography> : null}
                <Button type="submit" variant="contained" size="large">Log in securely</Button>
              </Box>
              <div className="login-security-note">
                <span className="security-shield">✓</span>
                <span>Protected workspace · Toronto, Canada</span>
              </div>
            </section>
          </div>
        </Box>
      </ThemeProvider>
    );
  }

  const renderPageContent = () => {
    switch (page) {
      case 'receipts':
        return (
          <ReceiptsPage>
            <header className="topbar compact-topbar">
              <div className="page-heading">
                <span className="page-heading-icon"><ReceiptLongRoundedIcon /></span>
                <div>
                <p className="eyebrow">Receipts</p>
                <h2>Invoice workspace</h2>
                </div>
              </div>
              <div className="topbar-actions compact-actions">
                <button className="ghost" onClick={() => setAddReceiptDialogOpen(true)}>Add Receipt</button>
                <button className="primary" onClick={processSelected}>Process selected</button>
              </div>
            </header>

            <section className="page-mini-hero receipts-mini-hero">
              <div className="receipts-hero-copy">
                <span className="mini-hero-kicker"><ReceiptLongRoundedIcon /> Capture and control</span>
                <h1>Every receipt, ready for a clean GST/HST decision.</h1>
                <p>Review documentation, tax IDs, and transaction context from one focused invoice workspace.</p>
                <div className="receipts-hero-points">
                  <span><VerifiedRoundedIcon /> Tax ID checks</span>
                  <span><FactCheckRoundedIcon /> Document review</span>
                  <span><CalculateRoundedIcon /> ITC ready</span>
                </div>
              </div>
              <div className="receipts-hero-visual" aria-hidden="true">
                <div className="receipt-hero-paper">
                  <div className="receipt-hero-paper-head"><span>GST/HST</span><strong>READY</strong></div>
                  <div className="receipt-hero-line long" />
                  <div className="receipt-hero-line medium" />
                  <div className="receipt-hero-line short" />
                  <div className="receipt-hero-total"><span>Total captured</span><strong>{formatMoney(gstTotal)}</strong></div>
                </div>
                <div className="mini-hero-stat"><strong>{receipts.length}</strong><span>receipts in queue</span></div>
              </div>
            </section>

            <section className="invoice-layout">
              <div className="receipt-card invoice-queue">
                <div className="queue-header">
                  <span>Expense Queue</span>
                  <span className="pill">{receipts.length} receipts</span>
                </div>

                <ul className="receipt-list invoice-list">
                  {receipts.map((receipt) => (
                    <li
                      key={receipt.id}
                      className={receipt.id === selectedId ? 'receipt-item invoice-item selected' : 'receipt-item invoice-item'}
                      onClick={() => selectReceipt(receipt.id)}
                    >
                      <div className="receipt-topline">
                        <strong>{receipt.vendor}</strong>
                        <span className="money">{formatMoney(receipt.total)}</span>
                      </div>
                      <div className="receipt-meta">
                        <span>{receipt.date}</span>
                        <span>{receipt.id}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="receipt-card invoice-card">
                <div className="invoice-header">
                  <div>
                    <p className="eyebrow">Receipt / Invoice</p>
                    <h3>{selectedReceipt.vendor}</h3>
                  </div>
                  <div className="invoice-badge">{selectedReceipt.id}</div>
                </div>

                <div className="invoice-meta-row">
                  <div>
                    <label>Vendor</label>
                    <strong>{selectedReceipt.vendor}</strong>
                  </div>
                  <div>
                    <label>Date</label>
                    <strong>{selectedReceipt.date}</strong>
                  </div>
                  <div>
                    <label>GST/HST No.</label>
                    <strong>{selectedReceipt.gstHstNumber ?? 'Missing'}</strong>
                  </div>
                </div>

                <div className="invoice-table-wrap">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{selectedReceipt.description}</td>
                        <td>1</td>
                        <td>{formatMoney(selectedReceipt.subtotal)}</td>
                        <td>{formatMoney(selectedReceipt.subtotal)}</td>
                      </tr>
                      <tr>
                        <td>GST/HST</td>
                        <td>1</td>
                        <td>{formatMoney(selectedReceipt.taxAmount)}</td>
                        <td>{formatMoney(selectedReceipt.taxAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="invoice-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <strong>{formatMoney(selectedReceipt.subtotal)}</strong>
                  </div>
                  <div className="total-row">
                    <span>GST/HST</span>
                    <strong>{formatMoney(selectedReceipt.taxAmount)}</strong>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total</span>
                    <strong>{formatMoney(selectedReceipt.total)}</strong>
                  </div>
                </div>

                <div className="invoice-notes">
                  <label>Notes</label>
                  <p>{selectedReceipt.notes}</p>
                </div>
              </div>
            </section>

          </ReceiptsPage>
        );

      case 'compliance':
        return (
          <CompliancePage>
            <header className="topbar">
              <div className="page-heading">
                <span className="page-heading-icon"><FactCheckRoundedIcon /></span>
                <div>
                <p className="eyebrow">Compliance</p>
                <h2>CRA rule engine status</h2>
                </div>
              </div>
            </header>

            <section className="compliance-hero">
              <div className="compliance-hero-copy">
                <span className="hero-kicker"><SecurityRoundedIcon /> Canadian bookkeeping intelligence</span>
                <h1>GST/HST compliance agent for every transaction.</h1>
                <p>
                  A stateful, tool-using finance agent that validates tax IDs, calculates eligible ITCs,
                  enforces CRA policy, and routes exceptions to human review before filing.
                </p>
                <div className="hero-feature-row">
                  <span><VerifiedRoundedIcon /> CRA-aware controls</span>
                  <span><CalculateRoundedIcon /> Deterministic ITC logic</span>
                  <span><WarningAmberRoundedIcon /> Human review gates</span>
                </div>
              </div>
              <div className="compliance-hero-visual">
                <div className="hero-orbit orbit-top" />
                <div className="hero-orbit orbit-bottom" />
                <div className="hero-agent-core">
                  <div className="hero-core-icon"><FactCheckRoundedIcon /></div>
                  <strong>CRA Agent</strong>
                  <small>Monitoring {receipts.length} transactions</small>
                </div>
                <div className="hero-signal signal-tax"><VerifiedRoundedIcon /><span>Tax ID check</span></div>
                <div className="hero-signal signal-itc"><CalculateRoundedIcon /><span>ITC engine</span></div>
                <div className="hero-signal signal-review"><WarningAmberRoundedIcon /><span>{reviewCount} review queue</span></div>
              </div>
            </section>

            <section className="compliance-kpi-grid">
              <div className="compliance-score-card">
                <div className="score-ring" style={{ '--score': `${complianceScore * 3.6}deg` } as CSSProperties}>
                  <span>{complianceScore}</span>
                </div>
                <div>
                  <p className="eyebrow">Compliance score</p>
                  <strong>{complianceScore >= 80 ? 'Ready for review' : 'Attention required'}</strong>
                  <small>Based on tax IDs, receipts, classification, and ITC eligibility.</small>
                </div>
              </div>
              <div className="status-card">
                <div className="card-label"><CalculateRoundedIcon /><p className="eyebrow">Eligible ITC</p></div>
                <strong>{formatMoney(eligibleItc)}</strong>
                <small>{itcCoverage}% of captured GST/HST is currently eligible.</small>
              </div>
              <div className="status-card">
                <div className="card-label"><VerifiedRoundedIcon /><p className="eyebrow">Tax IDs verified</p></div>
                <strong>{validTaxIds} / {receipts.length}</strong>
                <small>CRA format checked locally; external registration remains unverified.</small>
              </div>
              <div className="status-card highlight">
                <div className="card-label"><WarningAmberRoundedIcon /><p className="eyebrow">Review queue</p></div>
                <strong>{reviewCount} receipt{reviewCount === 1 ? '' : 's'}</strong>
                <small>Missing tax IDs or unknown classifications need human review.</small>
              </div>
            </section>

            <section className="compliance-dashboard-grid">
              <div className="compliance-panel">
                <div className="panel-title-row">
                  <div>
                    <p className="eyebrow">GST/HST controls</p>
                    <h3>Compliance readiness</h3>
                  </div>
                  <SecurityRoundedIcon className="panel-title-icon" />
                </div>
                <div className="readiness-row">
                  <div className="readiness-label"><span>Documentation captured</span><strong>{documentationReady}/{receipts.length}</strong></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${receipts.length ? (documentationReady / receipts.length) * 100 : 0}%` }} /></div>
                </div>
                <div className="readiness-row">
                  <div className="readiness-label"><span>GST/HST number format</span><strong>{receipts.length ? Math.round((validTaxIds / receipts.length) * 100) : 0}%</strong></div>
                  <div className="progress-track"><div className="progress-fill dark" style={{ width: `${receipts.length ? (validTaxIds / receipts.length) * 100 : 0}%` }} /></div>
                </div>
                <div className="readiness-row">
                  <div className="readiness-label"><span>ITC eligibility coverage</span><strong>{itcCoverage}%</strong></div>
                  <div className="progress-track"><div className="progress-fill green" style={{ width: `${itcCoverage}%` }} /></div>
                </div>
                <div className="compliance-note">
                  <FactCheckRoundedIcon />
                  <span>Meal and entertainment receipts are automatically capped at the standard 50% ITC policy.</span>
                </div>
              </div>

              <div className="compliance-panel">
                <div className="panel-title-row">
                  <div>
                    <p className="eyebrow">Control summary</p>
                    <h3>Filing period view</h3>
                  </div>
                  <span className="pill live">October 2026</span>
                </div>
                <div className="control-summary">
                  <div><span>Taxable purchases</span><strong>{formatMoney(receipts.reduce((sum, row) => sum + row.subtotal, 0))}</strong></div>
                  <div><span>Gross GST/HST</span><strong>{formatMoney(gstTotal)}</strong></div>
                  <div><span>Estimated net ITC</span><strong className="green-text">{formatMoney(eligibleItc)}</strong></div>
                  <div><span>Exception rate</span><strong className="warning-text">{receipts.length ? Math.round((reviewCount / receipts.length) * 100) : 0}%</strong></div>
                </div>
              </div>
            </section>

            <section className="compliance-table-card">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Receipt-level evidence</p>
                  <h3>GST/HST validation register</h3>
                </div>
                <span className="pill">{complianceRows.length} transactions</span>
              </div>
              <div className="compliance-table-wrap">
                <table className="compliance-table">
                  <thead>
                    <tr><th>Vendor</th><th>Tax ID</th><th>Documentation</th><th>ITC</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {complianceRows.map(({ receipt, gstValidation, itc }) => (
                      <tr key={receipt.id}>
                        <td><strong>{receipt.vendor}</strong><small>{receipt.date} · {labelForCategory(receipt.category)}</small></td>
                        <td><span className={`validation-tag ${gstValidation.status}`}>{gstValidation.status === 'valid' ? 'Valid format' : gstValidation.status}</span></td>
                        <td>{receipt.hasReceipt ? 'Receipt attached' : 'Missing receipt'}</td>
                        <td>{formatMoney(itc.eligibleITC)} <small>{itc.status}</small></td>
                        <td><span className={itc.status === 'review' || gstValidation.status !== 'valid' ? 'review-tag' : 'ready-tag'}>{itc.status === 'review' || gstValidation.status !== 'valid' ? 'Review' : 'Ready'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </CompliancePage>
        );

      case 'audit':
        return (
          <AuditLogPage>
            <header className="topbar">
              <div className="page-heading">
                <span className="page-heading-icon"><ArticleRoundedIcon /></span>
                <div>
                <p className="eyebrow">Audit log</p>
                <h2>Agent actions</h2>
                </div>
              </div>
            </header>

            <section className="audit-intro">
              <div>
                <span className="hero-kicker audit-kicker"><SecurityRoundedIcon /> Evidence-grade agent trace</span>
                <h1>Reconstruct every bookkeeping decision.</h1>
                <p>Every action records what happened, when it happened, why it happened, which rule was used, and what changed.</p>
              </div>
              <div className="audit-contract">
                <span className="contract-icon"><ArticleRoundedIcon /></span>
                <div><strong>Audit contract</strong><small>Immutable event shape · Rule v2026.09.1</small></div>
              </div>
            </section>

            <section className="audit-summary-grid">
              <div className="audit-summary-card"><span className="audit-summary-icon"><ArticleRoundedIcon /></span><div><small>Total events</small><strong>{auditTimelineEvents.length}</strong></div></div>
              <div className="audit-summary-card"><span className="audit-summary-icon"><VerifiedRoundedIcon /></span><div><small>Successful actions</small><strong>{auditTimelineEvents.filter((event) => auditStatus(event) === 'success').length}</strong></div></div>
              <div className="audit-summary-card"><span className="audit-summary-icon warning"><WarningAmberRoundedIcon /></span><div><small>Review gates</small><strong>{auditTimelineEvents.filter((event) => auditStatus(event) === 'review').length}</strong></div></div>
              <div className="audit-summary-card"><span className="audit-summary-icon dark"><SecurityRoundedIcon /></span><div><small>Rule version</small><strong>2026.09.1</strong></div></div>
            </section>

            <section className="audit-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Agent actions</p>
                  <h3>Evidence timeline</h3>
                </div>
                <span className="pill live">Append-only trace</span>
              </div>
              <div className="audit-timeline">
                {auditTimelineEvents.length === 0 ? (
                  <div className="event-item idle">No events yet. Process a receipt to create an auditable trace.</div>
                ) : (
                  auditTimelineEvents.slice().reverse().map((event, index) => {
                    const receiptId = auditReceiptId(event);
                    const status = auditStatus(event);
                    const eventPayload = event.payload ? JSON.stringify(event.payload) : event.step;
                    const statusLabel = status === 'review' ? 'Review required' : status === 'running' ? 'Running' : status === 'error' ? 'Error' : 'Success';
                    return (
                      <article className="audit-event-card" key={`${event.type}-${event.step}-${index}`}>
                        <div className="audit-event-marker"><span className={`audit-status-dot ${status}`} /></div>
                        <div className="audit-event-content">
                          <div className="audit-event-heading">
                            <div>
                              <span className={`audit-status ${status}`}>{statusLabel}</span>
                              <h4>{event.step.replace(/-/g, ' ')}</h4>
                            </div>
                            <time>{new Date(event.timestamp).toLocaleString()}</time>
                          </div>
                          <div className="audit-event-grid">
                            <div><label>Event ID</label><strong>evt_{String(auditTimelineEvents.length - index).padStart(3, '0')}</strong></div>
                            <div><label>Actor</label><strong>agent</strong></div>
                            <div><label>Receipt ID</label><strong>{receiptId}</strong></div>
                            <div><label>Action</label><strong>{event.step}</strong></div>
                            <div><label>Rule version</label><strong>2026.09.1</strong></div>
                            <div><label>Model</label><strong>cra-deterministic-agent</strong></div>
                            <div><label>Input hash</label><code>{auditHash(`input:${eventPayload}`)}</code></div>
                            <div><label>Result hash</label><code>{auditHash(`result:${event.type}:${eventPayload}`)}</code></div>
                          </div>
                          <div className="audit-change">
                            <strong>Why / change</strong>
                            <span>{event.step === 'request-human-review' || event.type === 'agent:review'
                              ? 'The agent detected a policy or documentation exception and preserved the transaction for human review.'
                              : event.step === 'select-receipt'
                                ? 'The user changed the active receipt context for the agent.'
                                : `The agent recorded ${event.type.replace(':', ' ')} for ${receiptId} using the CRA workflow.`}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </AuditLogPage>
        );

      case 'settings':
        return (
          <SettingsPage>
            <header className="topbar">
              <div className="page-heading">
                <span className="page-heading-icon"><SettingsRoundedIcon /></span>
                <div>
                <p className="eyebrow">Settings</p>
                <h2>Workspace security</h2>
                </div>
              </div>
            </header>

            <section className="settings-hero">
              <div className="settings-hero-copy">
                <span className="hero-kicker"><SecurityRoundedIcon /> Control centre</span>
                <h1>Configure your Canadian bookkeeping agent with confidence.</h1>
                <p>Manage identity, CRA policy controls, review safeguards, and observability for a secure GST/HST workflow.</p>
                <div className="settings-hero-actions">
                  <span className="settings-live-state"><span /> All systems operational</span>
                  <span className="settings-rule-chip">Rule pack 2026.09.1</span>
                </div>
              </div>
              <div className="settings-hero-visual" aria-hidden="true">
                <div className="settings-orbit orbit-a" />
                <div className="settings-orbit orbit-b" />
                <div className="settings-control-core"><SettingsRoundedIcon /><strong>Agent controls</strong><small>Secure by default</small></div>
                <span className="settings-float-card float-security"><SecurityRoundedIcon /> Protected</span>
                <span className="settings-float-card float-policy"><FactCheckRoundedIcon /> CRA policy</span>
                <span className="settings-float-card float-audit"><ArticleRoundedIcon /> Audit ready</span>
              </div>
            </section>

            <section className="settings-grid">
              <div className="status-card">
                <div className="card-label"><AccountCircleRoundedIcon /><p className="eyebrow">Workspace owner</p></div>
                <strong>admin</strong>
                <small>Controller / Finance Administrator</small>
              </div>
              <div className="status-card">
                <div className="card-label"><FactCheckRoundedIcon /><p className="eyebrow">Authentication</p></div>
                <strong>Protected</strong>
                <small>Local secure session with controlled workspace access.</small>
              </div>
              <div className="status-card highlight">
                <div className="card-label"><WarningAmberRoundedIcon /><p className="eyebrow">Review safeguards</p></div>
                <strong>{reviewCount} exceptions monitored</strong>
                <small>High-risk GST/HST and unknown classifications pause for review.</small>
              </div>
              <div className="status-card">
                <div className="card-label"><VerifiedRoundedIcon /><p className="eyebrow">Compliance posture</p></div>
                <strong>{complianceScore}% ready</strong>
                <small>{receipts.length} transactions are covered by the current control set.</small>
              </div>
            </section>

            <section className="settings-control-grid">
              <div className="settings-panel">
                <div className="panel-title-row"><div><p className="eyebrow">Agent configuration</p><h3>Runtime behaviour</h3></div><SettingsRoundedIcon className="panel-title-icon" /></div>
                <div className="settings-option"><div><strong>Deterministic CRA rules</strong><small>Use explicit policy logic before any assistant explanation.</small></div><span className="toggle on">On</span></div>
                <div className="settings-option"><div><strong>Human approval gates</strong><small>Escalate missing tax IDs, weak documents, and uncertain GIFI codes.</small></div><span className="toggle on">On</span></div>
                <div className="settings-option"><div><strong>Observable activity stream</strong><small>Record tool calls, state changes, hashes, and decisions to the audit log.</small></div><span className="toggle on">On</span></div>
              </div>

              <div className="settings-panel">
                <div className="panel-title-row"><div><p className="eyebrow">CRA policy pack</p><h3>Current controls</h3></div><FactCheckRoundedIcon className="panel-title-icon" /></div>
                <div className="settings-policy-list">
                  <div><span>GST/HST format validation</span><strong>Enabled</strong></div>
                  <div><span>Meals and entertainment limit</span><strong>50% ITC</strong></div>
                  <div><span>GIFI catalogue verification</span><strong>Required</strong></div>
                  <div><span>Rule version</span><strong>2026.09.1</strong></div>
                </div>
              </div>
            </section>

            <section className="settings-bottom-grid">
              <div className="settings-panel settings-activity-card">
                <div className="panel-title-row"><div><p className="eyebrow">Observability</p><h3>Agent health</h3></div><span className="pulse-dot">Live</span></div>
                <div className="health-meter"><div className="health-meter-fill" style={{ width: `${Math.max(complianceScore, 10)}%` }} /></div>
                <div className="health-stats"><span><strong>{events.length}</strong> events</span><span><strong>{receipts.length}</strong> receipts</span><span><strong>99.9%</strong> uptime</span></div>
              </div>
              <div className="settings-panel">
                <div className="panel-title-row"><div><p className="eyebrow">Data handling</p><h3>Security commitments</h3></div><SecurityRoundedIcon className="panel-title-icon" /></div>
                <div className="security-list"><span><VerifiedRoundedIcon /> No silent policy overrides</span><span><VerifiedRoundedIcon /> Review decisions remain traceable</span><span><VerifiedRoundedIcon /> Receipt context stays selected and scoped</span></div>
              </div>
            </section>
          </SettingsPage>
        );

      default:
        return (
          <DashboardPage>
            <header className="topbar">
              <div className="page-heading">
                <span className="page-heading-icon"><DashboardRoundedIcon /></span>
                <div>
                <p className="eyebrow">Dashboard</p>
                <h2>Operational overview</h2>
                </div>
              </div>
              <div className="topbar-actions">
                <button className="primary" onClick={processSelected}>Process selected</button>
              </div>
            </header>

            <section className="page-mini-hero dashboard-mini-hero">
              <div>
                <span className="mini-hero-kicker"><DashboardRoundedIcon /> Finance command centre</span>
                <h1>Turn receipt activity into confident Canadian bookkeeping.</h1>
                <p>Monitor GST/HST exposure, agent decisions, and human review priorities at a glance.</p>
              </div>
              <div className="mini-hero-stat"><strong>{formatMoney(gstTotal)}</strong><span>GST/HST captured</span></div>
            </section>

            <section className="status-grid">
              <div className="status-card">
                <p className="eyebrow">Classification</p>
                <strong>{labelForCategory(selectedReceipt.category)}</strong>
                <small>{selectedReceipt.description}</small>
              </div>

              <div className="status-card">
                <p className="eyebrow">Processing Status</p>
                <strong>{state.processingStatus}</strong>
                <small>{selectedReceipt.hasReceipt ? 'Receipt attached' : 'No receipt attached'}</small>
              </div>

              <div className="status-card">
                <p className="eyebrow">Current GIFI</p>
                <strong>{state.currentAnalysis?.gifiCode ?? 'TBD'}</strong>
                <small>{state.currentAnalysis?.briefing ?? 'Awaiting validation'}</small>
              </div>
            </section>

            <section className="dashboard-insights">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <p className="eyebrow">Tax position</p>
                    <h3>GST/HST by receipt</h3>
                  </div>
                  <span className="chart-total">{formatMoney(gstTotal)}</span>
                </div>
                <div className="bar-chart" role="img" aria-label="GST/HST amount by receipt">
                  {gstChartData.map((item) => (
                    <div className="bar-column" key={item.label}>
                      <span className="bar-value">{formatMoney(item.amount)}</span>
                      <div className="bar-track">
                        <div
                          className={item.review ? 'bar-fill review' : 'bar-fill'}
                          style={{ height: `${Math.max((item.amount / maxGstAmount) * 100, 8)}%` }}
                        />
                      </div>
                      <span className="bar-label" title={item.label}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span><i className="legend-dot orange" /> GST/HST amount</span>
                  <span><i className="legend-dot dark" /> Selected or requires review</span>
                </div>
              </div>

              <div className="snapshot-card">
                <div className="chart-header">
                  <div>
                    <p className="eyebrow">Workspace pulse</p>
                    <h3>Operational snapshot</h3>
                  </div>
                  <span className="pulse-dot">Live</span>
                </div>
                <div className="snapshot-list">
                  <div><span>Receipts captured</span><strong>{receipts.length}</strong></div>
                  <div><span>GST/HST to review</span><strong className={reviewCount > 0 ? 'warning-text' : ''}>{reviewCount}</strong></div>
                  <div><span>Selected transaction</span><strong>{formatMoney(selectedReceipt.total)}</strong></div>
                </div>
                <div className="snapshot-callout">
                  <span className="dot" />
                  <div>
                    <strong>{reviewCount > 0 ? 'Human review queue active' : 'All receipts ready'}</strong>
                    <small>{reviewCount > 0 ? 'Missing tax IDs or classifications need attention.' : 'No blocking compliance exceptions detected.'}</small>
                  </div>
                </div>
              </div>
            </section>

            <section className="receipt-card">
              <div className="receipt-summary-grid">
                <div>
                  <label>Vendor</label>
                  <strong>{selectedReceipt.vendor}</strong>
                </div>
                <div>
                  <label>Date</label>
                  <strong>{selectedReceipt.date}</strong>
                </div>
                <div>
                  <label>Subtotal</label>
                  <strong>{formatMoney(selectedReceipt.subtotal)}</strong>
                </div>
                <div>
                  <label>GST/HST</label>
                  <strong>{formatMoney(selectedReceipt.taxAmount)}</strong>
                </div>
                <div>
                  <label>Total</label>
                  <strong>{formatMoney(selectedReceipt.total)}</strong>
                </div>
                <div>
                  <label>GST/HST Number</label>
                  <strong>{selectedReceipt.gstHstNumber ?? 'Missing'}</strong>
                </div>
              </div>
            </section>

            <section className="chat-panel">
              <div className="activity-header">
                <h3>GST/HST Calculator</h3>
                <span className="pill live">Live</span>
              </div>

              <div className="chat-thread">
                {chatMessages.map((message) => {
                  const isHeadingMessage = message.text.startsWith('### ');
                  return (
                    <div key={message.id} className={message.speaker === 'assistant' ? 'chat-message assistant' : 'chat-message user'}>
                      <div className="chat-meta">
                        <strong>{message.speaker === 'assistant' ? 'Assistant' : 'You'}</strong>
                        <span>{message.time}</span>
                      </div>
                      {isHeadingMessage ? (
                        <p className="agent-heading">{message.text.replace(/^###\s*/, '')}</p>
                      ) : (
                        <p>{message.text}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <form className="chat-input-row" onSubmit={handleChatSubmit}>
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about the selected receipt..."
                />
                <button type="submit" className="primary">Send</button>
              </form>
            </section>

            {state.pendingApproval ? (
              <section className="approval-card">
                <h3>Human review required</h3>
                <p>{state.pendingApproval.reason}</p>
                <div className="approval-grid">
                  <div><label>Proposed category</label><strong>{state.pendingApproval.proposedCategory}</strong></div>
                  <div><label>GIFI</label><strong>{state.pendingApproval.proposedGifiCode}</strong></div>
                  <div><label>ITC</label><strong>{formatMoney(state.pendingApproval.proposedITC)}</strong></div>
                </div>
                <div className="approval-actions">
                  <button className="primary" onClick={() => handleApproval(true)}>Approve</button>
                  <button className="secondary" onClick={() => handleApproval(false)}>Reject</button>
                  <button className="ghost">Edit</button>
                </div>
              </section>
            ) : null}
          </DashboardPage>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dialog open={addReceiptDialogOpen} onClose={() => setAddReceiptDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add new receipt</DialogTitle>
        <DialogContent>
          <form id="receipt-dialog-form" className="receipt-entry-form" onSubmit={handleReceiptSubmit} noValidate>
            <div className="form-grid">
              <label>
                Vendor
                <input
                  value={receiptForm.vendor}
                  onChange={(event) => handleReceiptFormChange('vendor', event.target.value)}
                  placeholder="e.g. Staples Canada"
                />
                {receiptErrors.vendor ? <small>{receiptErrors.vendor}</small> : null}
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={receiptForm.date}
                  onChange={(event) => handleReceiptFormChange('date', event.target.value)}
                />
                {receiptErrors.date ? <small>{receiptErrors.date}</small> : null}
              </label>

              <label>
                Subtotal
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiptForm.subtotal}
                  onChange={(event) => handleReceiptFormChange('subtotal', event.target.value)}
                  placeholder="0.00"
                />
                {receiptErrors.subtotal ? <small>{receiptErrors.subtotal}</small> : null}
              </label>

              <label>
                GST/HST Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiptForm.taxAmount}
                  onChange={(event) => handleReceiptFormChange('taxAmount', event.target.value)}
                  placeholder="0.00"
                />
                {receiptErrors.taxAmount ? <small>{receiptErrors.taxAmount}</small> : null}
              </label>

              <label className="wide">
                GST/HST Number
                <input
                  value={receiptForm.gstHstNumber}
                  onChange={(event) => handleReceiptFormChange('gstHstNumber', event.target.value)}
                  placeholder="123456789RT0001"
                />
                {receiptErrors.gstHstNumber ? <small>{receiptErrors.gstHstNumber}</small> : null}
              </label>

              <label>
                Classification
                <select
                  value={workflowForm.classification}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, classification: event.target.value }))}
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="MEAL">Meal</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="CASH_DEPOSIT">Cash Deposit</option>
                </select>
              </label>

              <label>
                Review status
                <select
                  value={workflowForm.reviewStatus}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, reviewStatus: event.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="review">Review</option>
                  <option value="approved">Approved</option>
                </select>
              </label>

              <label>
                Documentation tier
                <select
                  value={workflowForm.documentationTier}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, documentationTier: event.target.value }))}
                >
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
              </label>

              <label>
                GIFI code
                <input
                  value={workflowForm.gifiCode}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, gifiCode: event.target.value }))}
                />
              </label>

              <label className="wide">
                Policy note
                <textarea
                  value={workflowForm.policyNote}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, policyNote: event.target.value }))}
                  placeholder="CRA policy comment or review reason"
                />
              </label>

              <label className="wide">
                Notes
                <textarea
                  value={receiptForm.notes}
                  onChange={(event) => handleReceiptFormChange('notes', event.target.value)}
                  placeholder="Add business purpose or review notes"
                />
              </label>
            </div>
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            className="ghost"
            onClick={() => {
              setReceiptForm({ vendor: '', date: '', subtotal: '', taxAmount: '', gstHstNumber: '', notes: '' });
              setWorkflowForm({ classification: 'UNKNOWN', reviewStatus: 'pending', documentationTier: 'Tier 2', gifiCode: '8810', policyNote: '' });
              setAddReceiptDialogOpen(false);
            }}
          >
            Clear
          </Button>
          <Button type="submit" form="receipt-dialog-form" variant="contained">Add receipt</Button>
        </DialogActions>
      </Dialog>
      <div
        className={
          activityDrawerOpen
            ? `app-shell drawer-open ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`
            : `app-shell drawer-closed ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`
        }
        style={{ background: '#f5f5f5', color: '#111827' }}
      >
        <aside className={sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'} style={{ background: '#fff', borderRight: '1px solid #e5e7eb' }}>
          <div className="brand-block">
            <div className="brand-mark large">L</div>
            {!sidebarCollapsed ? (
              <div>
                <p className="eyebrow">Loopnow CPA Copilot</p>
                <h1 style={{ color: '#111827' }}>Bookkeeping</h1>
              </div>
            ) : null}
          </div>

          <nav className="nav-menu" aria-label="Sidebar navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={page === item.key ? 'nav-item active' : 'nav-item'}
                  onClick={() => handlePageChange(item.key)}
                  title={item.label}
                >
                  <span className="nav-icon-wrap">
                    <Icon sx={{ fontSize: 20, color: '#ff5c35' }} />
                  </span>
                  {!sidebarCollapsed ? <span>{item.label}</span> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="main-panel" style={{ background: '#f8fafc' }}>
          <div className="main-topbar">
            <IconButton
              onClick={() => setSidebarCollapsed((current) => !current)}
              sx={{
                color: '#ff5c35',
                backgroundColor: '#fff3ef',
                border: '1px solid rgba(255, 92, 53, 0.14)',
                '&:hover': { backgroundColor: '#ffe7df' },
              }}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Box sx={{ position: 'relative' }}>
              <IconButton
                onClick={() => setUserMenuOpen((current) => !current)}
                sx={{
                  color: '#ff5c35',
                  backgroundColor: '#fff3ef',
                  border: '1px solid rgba(255, 92, 53, 0.14)',
                  '&:hover': { backgroundColor: '#ffe7df' },
                }}
                aria-label="User menu"
              >
                <AccountCircleRoundedIcon />
              </IconButton>

              {userMenuOpen ? (
                <Paper elevation={2} className="user-menu" sx={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', minWidth: 240, p: 1.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                  <Box className="user-menu-header" sx={{ display: 'flex', alignItems: 'center', gap: 1.2, pb: 1.2 }}>
                    <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: '50%', backgroundColor: '#fff3ef', color: '#ff5c35' }}>
                      <AccountCircleRoundedIcon />
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#111827', fontWeight: 700 }}>admin</Typography>
                      <Typography variant="caption" sx={{ color: '#4b5563' }}>Controller</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 1, color: '#4b5563' }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#ff5c35' }} />
                    <Typography variant="body2">Toronto, ON, Canada</Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LogoutRoundedIcon />}
                    onClick={() => {
                      setIsLoggedIn(false);
                      setUserMenuOpen(false);
                    }}
                    sx={{ mt: 1.2 }}
                  >
                    Log out
                  </Button>
                </Paper>
              ) : null}
            </Box>
          </div>

          {renderPageContent()}
          <div className="page-toolbar floating-agent-controls">
            <span className="agent-ready-badge"><span className="agent-status-dot" />Agent ready</span>
            <button
              type="button"
              className="history-fab"
              onClick={() => setActivityDrawerOpen((current) => !current)}
              aria-label={activityDrawerOpen ? 'Hide activity history' : 'Show activity history'}
              title={activityDrawerOpen ? 'Hide activity history' : 'Show activity history'}
            >
              <HistoryRoundedIcon />
              <span>{activityDrawerOpen ? 'Hide activity' : 'Show activity'}</span>
            </button>
          </div>
        </main>

        <aside className="activity-drawer" aria-label="Agent activity drawer" style={{ background: '#fff', borderLeft: '1px solid #e5e7eb' }}>
          <div className="activity-header">
            <div>
              <p className="eyebrow">Agent activity</p>
              <h3 style={{ color: '#111827' }}>Runtime monitor</h3>
            </div>
            <button type="button" className="drawer-close" onClick={() => setActivityDrawerOpen(false)} aria-label="Close activity drawer">
              ×
            </button>
          </div>

          <div className="drawer-stack">
            <div className="drawer-summary">
              <span className="pill live">Selected</span>
              <strong>{selectedReceipt.vendor}</strong>
              <small>{selectedReceipt.date}</small>
            </div>

            <ul className="event-list drawer-events">
              {events.length === 0 ? (
                <li className="event-item idle">No events yet.</li>
              ) : (
                events.slice().reverse().slice(0, 10).map((event, index) => (
                  <li key={`${event.type}-${event.step}-${index}`} className="event-item">
                    <span className="dot" />
                    <div>
                      <strong>{event.step}</strong>
                      <small>{event.type}</small>
                      {event.payload ? <pre>{JSON.stringify(event.payload, null, 2)}</pre> : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </ThemeProvider>
  );
}
