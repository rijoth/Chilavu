# AGENTS.md — Chilavu Developer & Architecture Guide

## 1. Project Overview
Chilavu (branding mark: **ചി**) is a lightweight, local-first event expense management web application. It organizes financial information around events (e.g. weddings, birthdays, trips, reunions) rather than isolated transactions. An event contains multiple expenses, and each expense can contain multiple payments. Underlying database and backup contracts remain backward-compatible with existing IndexedDB records (`EventLedgerDB`).

## 2. Technology Stack
- **Language**: TypeScript (strict mode)
- **UI Framework**: React 19 + Vite
- **Styling & Theme**: Tailwind CSS v4 with official Rosé Pine design tokens (Main for dark mode, Dawn for light mode)
- **Persistence**: IndexedDB managed via Dexie.js (`EventLedgerDB`)
- **Reactive Queries**: `dexie-react-hooks` (`useLiveQuery`)
- **State Management**: Zustand (theme and settings only; database remains in IndexedDB)
- **Routing**: React Router (DOM)
- **Reports**: jsPDF & jsPDF-AutoTable (client-side event summary reports)
- **PWA**: `vite-plugin-pwa` with offline caching and in-app install prompt
- **Icons**: Lucide React
- **Date Utilities**: `date-fns`

## 3. Architecture Rules
- **Local-First & Privacy**: Zero server-side persistence, zero telemetry, zero cookies. All records remain inside IndexedDB.
- **Financial Correctness**:
  - All monetary values are persisted as non-negative integer minor units (e.g., ₹100.50 -> 10050, $50.00 -> 5000, ¥500 -> 500).
  - Floating point arithmetic is strictly forbidden for calculations.
  - Derived balances (paid, pending, overpaid, status) are never stored in the database; they are calculated purely via pure functions in `src/features/expenses/expenseCalculations.ts`.
  - Never combine monetary amounts across different currencies.
- **Relational Integrity**:
  - Events have cascading deletion (deleting an event deletes all its expenses and payments within a single Dexie transaction).
  - Expenses have cascading deletion (deleting an expense deletes all associated payments).
  - If an event already contains expenses, changing its currency is locked.
- **Mobile First**:
  - Touch targets ≥ 44x44px.
  - Form modals adapt to bottom sheets on mobile.
  - Status badges use both icons and semantic colors (never color alone).

## 4. Coding Conventions
- Files are grouped cleanly by feature: `src/features/*`, `src/components/*`, `src/pages/*`, `src/lib/*`, `src/types/*`, `src/stores/*`, `src/db/*`.
- Avoid unnecessary external dependencies.
- Use explicit type imports and clean interfaces.
