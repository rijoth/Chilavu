# Chilavu (ചി)

> **Chilavu** (ചിലവ് - Malayalam for *expense/expenditure*) is a lightweight, local-first event expense and payment management Progressive Web Application (PWA).

Standalone Brand Mark: **ചി**

---

## Highlights

- **Event-Centric Organization**: Organizes budgets and transactions around events (weddings, birthdays, road trips, reunions) rather than isolated daily records.
- **Hierarchical Expense & Payment Tracking**: Each event contains multiple expenses, and each expense tracks multiple installments, advances, or final settlements with overpayment protection.
- **Local-First & 100% Private**: Zero cloud backend, zero trackers, zero telemetry, and zero cookies. All records live directly in your browser's IndexedDB (`EventLedgerDB` engine).
- **Financial Precision**: All calculations are performed using non-negative integer minor units (avoiding floating-point arithmetic errors).
- **Rosé Pine Aesthetics**: Tailored dark (`Main`) and light (`Dawn`) themes adhering to the official Rosé Pine design specification.
- **Complete Offline PWA**: Installable on Android, iOS Safari, macOS, Windows, and Linux with full offline caching and custom in-app install prompts.
- **Export & Reports**: Export event summaries into styled PDF reports or complete transactional JSON backups (supporting Replace and Merge restore modes).

---

## Tech Stack

- **Framework**: React 19 + TypeScript (strict)
- **Bundler**: Vite + `vite-plugin-pwa`
- **Styling**: Tailwind CSS v4
- **Database**: IndexedDB via Dexie.js + `dexie-react-hooks`
- **State**: Zustand (theme and preferences)
- **Typography**: Manjari (Malayalam brand logo mark), Plus Jakarta Sans, JetBrains Mono
- **Icons**: Lucide React + custom **ചി** asset suite

---

## Brand Assets & Script

Brand assets are generated using the standalone Malayalam logo mark **ചി**:

```bash
# Generate vector icon.svg, PWA icons (192, 512, maskable), Apple Touch Icon, and Favicon
node scripts/generate-icons.js
```

---

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Production build
npm run build

# Run unit tests
npm test
```
