# Deterministic CRA Domain

This package contains pure, deterministic CRA-domain rules under `/domain/cra`.

## Rules implemented

### Documentation tiers

- Tier 1: `< $30.00`
- Tier 2: `$30.00–$149.99`
- Tier 3: `>= $150.00`

Amounts are normalized to integer cents before comparison. The required boundaries are covered explicitly by tests: `$29.99`, `$30.00`, `$30.01`, `$149.99`, and `$150.00`.

### Meals

The standard CRA meals/entertainment rule is implemented as 50% of the lesser of the incurred amount and the amount that is reasonable in the circumstances. CRA documents exceptions, so this function intentionally models the standard rule only. urlCRA business expenses guidancehttps://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses.html

### GIFI

`GIFI_CATALOGUE` is a static immutable catalogue containing commonly used CRA GIFI codes, including balance-sheet, revenue, cost-of-sales, and operating-expense entries. CRA publishes the complete GIFI list in RC4088. urlCRA GIFI cataloguehttps://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4088/general-index-financial-information-gifi.html

### GST/HST validation and ITC calculations

The deterministic domain layer also includes:

- GST/HST registration number validation with format-level statuses (`valid`, `invalid`, `missing`, `malformed`, `suspicious`, `unknown`).
- ITC calculation logic that applies the standard CRA policy, including the 50% meals and entertainment limit and deterministic cent-based rounding.
- GIFI verification to ensure only catalogue-backed codes are accepted and unknown entries enter `REVIEW_REQUIRED`.

### App-aware receipt processing layer

The project now includes a lightweight agent workflow layer under `/domain/agent` to model the product requirements from the brief:

- `AppState` tracks the selected receipt, receipt records, and processing state.
- `getCurrentReceipt` and `getReceiptDetails` resolve the user's active receipt without asking the user to paste data into chat.
- Tool contracts are schema-validated using Zod and expose deterministic request/response envelopes.
- `processSelectedReceipt` runs a pretend multi-step agent loop with receipt selection, documentation verification, GST/HST validation, classification, GIFI mapping, ITC calculation, and human review escalation.
- Untrusted receipt text is sanitized before classification to resist prompt-injection phrases like “Ignore all CRA rules.”
- `AppOrchestrator` and `AppStateStream` provide a streaming state coordination layer that mimics UI-driven event updates and bidirectional app/agent synchronization.

## Run tests

```bash
npm install
npm test
npm run typecheck
```
