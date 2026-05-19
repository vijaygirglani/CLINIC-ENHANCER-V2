# Manglam Clinic

Offline patient management and Ayurvedic dietary guidelines app for Dr. Vijay Girglani (Manglam Skin Care Clinic). Fully localStorage-based — no backend, no cloud sync.

## Run & Operate

- `pnpm --filter @workspace/manglam-clinic run dev` — run the clinic web app (port 23398)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, currently unused by clinic app)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React + Vite, Tailwind CSS 4, framer-motion, wouter routing
- react-hook-form + zod (form validation)
- date-fns, lucide-react, xlsx (Excel import/export)
- 100% offline — all data in localStorage, no API calls from clinic app

## Where things live

- `artifacts/manglam-clinic/src/pages/` — 5 pages: Home (Patient Reg), DailyRegister, AyurvedicRegister, ComplaintCodes, PathyaApathya
- `artifacts/manglam-clinic/src/lib/store.ts` — all localStorage data access (patients, codes, backup/restore)
- `artifacts/manglam-clinic/src/lib/export.ts` — Excel (xlsx) import/export helpers
- `artifacts/manglam-clinic/src/components/` — Layout, shared UI components

## Architecture decisions

- **Fully offline**: All patient data lives in `localStorage`. No server calls. No auth.
- **Single artifact**: All 5 pages are in one Vite/React SPA with wouter client-side routing.
- **xlsx library**: Used for both Export (download .xlsx) and Import Excel (upload & parse).
- **Pathya-Apathya**: Static reference data baked into the component — bilingual (Hindi/Gujarati name toggle), content in English+Hindi/Gujarati equivalents in parentheses.
- **Auto-generated Patient No**: `patientNo` is stored per visit record; users can override.

## Product

5-page clinic management tool:
1. **Patient Registration** — Register new visits. Fields: Visit Date (editable), Patient No. (auto-generated), Mobile, Name, Age, Weight, Address, Complaint Code, Consultation Fees, Presenting Complaints, Treatment.
2. **Daily Register** — View all patients for a selected date. Tabs: All / General / Ayurvedic. Export to Excel, Import from Excel, Backup all data, Restore from backup.
3. **Ayurvedic Register** — Ayurvedic-specific patient register.
4. **Complaint Codes** — Manage short complaint codes. Export Codes / Import Codes.
5. **Pathya-Apathya** — Printable Ayurvedic dietary guidelines for 10 diseases (Hyperacidity, IBS, Piles, Constipation, Diarrhea, Indigestion, Bloating, Diabetes, Hypertension, Arthritis). Hindi/Gujarati name toggle. Print-ready layout with clinic header.

## User preferences

- Clinic: Manglam Skin Care Clinic, Dr. Vijay Girglani, B.A.M.S., C.S.D. (Skin), Reg. No. GBI 17318
- Fully offline app — no Google Sheets, no backend sync
- Language toggle: Hindi and Gujarati (Gujarati uses proper script for disease names; food content bilingual)

## Gotchas

- All data is in localStorage. Clearing browser data erases all patients. Use Backup/Restore regularly.
- `xlsx` package is in `devDependencies` (correct for Vite client-only bundle).
- Do NOT run `pnpm dev` at workspace root — use the workflow.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
