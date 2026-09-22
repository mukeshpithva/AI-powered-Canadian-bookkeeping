# AI-powered Canadian bookkeeping

AI-powered Canadian bookkeeping and GST/HST compliance workspace built with React, TypeScript, Material UI, Tailwind CSS, and deterministic CRA-aware domain rules.

## Features

- Secure local workspace login
- Dashboard with GST/HST visualizations
- Receipt queue and invoice-style receipt review
- CRA-aware GST/HST number validation
- Deterministic eligible ITC calculations
- Meals and entertainment 50% ITC limitation
- GIFI catalogue verification
- Human review escalation for high-risk transactions
- Compliance readiness and filing-period views
- Evidence-grade agent audit timeline
- Responsive desktop, iPad, tablet, and mobile layouts
- GitHub Pages deployment workflow

## Local development

```bash
npm install
npm run dev
```

Login credentials for the prototype:

```text
Username: admin
Password: Admin@2026
```

## Validation

```bash
npm run build
npm test
```

## GitHub Pages deployment

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

Enable GitHub Pages using **Settings → Pages → Source: GitHub Actions**. The production site will be available at:

```text
https://mukeshpithva.github.io/AI-powered-Canadian-bookkeeping/
```
