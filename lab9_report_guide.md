# Lab 9 Validation Report — Complete Details & Guide

> **LaTeX file:** [lab9_validation_report.tex](file:///f:/CPP/HCI&Visualization/AlgoTrading/AlgoTrade/Documentation/lab9_validation_report.tex)
> **Reference PDF:** [lab9-validation-report-v2.pdf](file:///f:/CPP/HCI&Visualization/AlgoTrading/AlgoTrade/lab9-validation-report-v2.pdf)
> **Reference screenshots:** [report/](file:///f:/CPP/HCI&Visualization/AlgoTrading/AlgoTrade/report)

---

## 1. Report Structure (matches reference PDF)

| Page(s) | Section | Subsection | Status |
|---------|---------|------------|--------|
| 1 | Title + At a Glance | — | ✅ Structure done, needs test results |
| 1 | Key Tasks | T1 & T2 definitions | ✅ Complete |
| 1 | **1. User Validation** | 1.1 Success criteria | ✅ Complete (4 targets) |
| 1 | | 1.2 Validation methods | ✅ Complete (3 methods + setup) |
| 2 | | 1.3 Results from new users | ⬜ **Needs user testing data** |
| 2 | | 1.4 Before vs. after (Lab 7 → Lab 9) | ⬜ **Needs user testing data** |
| 2–3 | | 1.5 Validation of major improvements | ✅ Mostly done (some need test confirmation) |
| 3 | **2. Inspection & Accessibility** | 2.1 Status of Lab 7 issues | ✅ Complete (verified from code) |
| 3 | | 2.2 Accessibility check | ✅ Complete (needs Lighthouse score) |
| 4 | | 2.3 Accessibility evidence | ⬜ **Needs screenshots** |
| 5 | **3. Validation Summary** | 3.1 Which targets were met | ⬜ **Needs user testing data** |
| 5 | | 3.2 What is still pending | ✅ Complete |
| 5 | | 3.3 Plan to complete | ✅ Complete (7-step action plan) |
| 7 | **4. Heuristic Issues** | Next iteration issues | ✅ Complete (4 new issues) |
| A | **Appendix A** | User testing evidence | ⬜ **Needs testing sheets** |
| B | **Appendix B** | Technical validation | ✅ Complete |

---

## 2. Verified Implementation Details (from code inspection)

All of the following are **verified in the actual codebase** and are already written into the LaTeX report.

### 2.1 Lab 7 Issue Resolution (10 issues)

| ID | Issue | Severity | Status | Evidence |
|----|-------|----------|--------|----------|
| H1 | Parameters may not reach LEAN correctly | 4 (catastrophic) | **✅ Fixed** | `StrategyStore.cs` persists params → `BacktestService` injects into Python → `LeanRunner` mounts config into Docker |
| H2 | Compare lacks configuration context | 3 (major) | **✅ Fixed** | [Compare.jsx](file:///f:/CPP/HCI&Visualization/AlgoTrading/AlgoTrade/frontend/src/pages/Compare.jsx) lines 124–158: Parameter Comparison table with per-run configs, "Changed?" column, yellow highlighting |
| H3 | Reset can destroy configuration | 3 (major) | **✅ Fixed** | [StrategyBuilder.jsx](file:///f:/CPP/HCI&Visualization/AlgoTrading/AlgoTrade/frontend/src/pages/StrategyBuilder.jsx) line 20: `showResetModal` state; line 337: opens modal; lines 366–390: confirmation dialog |
| H4 | Financial terminology unclear | 3 (major) | **✅ Fixed** | [DocTooltip.jsx](file:///f:/CPP/HCI&Visualization/AlgoTrading/AlgoTrade/frontend/src/components/DocTooltip.jsx) + `docsData.js` glossary; used on Dashboard, Explore, Compare, Results, Parameters (5 pages) |
| H5 | Python editor poor Tab | 2 (minor) | **✅ Fixed** | Monaco Editor replaces raw textarea; custom lint markers flag mixed tabs/spaces; `Ctrl+Enter` shortcut |
| H6 | Estimated Preview confusion | 2 (minor) | **✅ Fixed** | Dashboard/Explore distinguish real vs. estimated; Compare shows "sample placeholder data" message |
| U1 | Insufficient text contrast | 3 (major) | **✅ Fixed** | `#94a3b8` → `#64748b` for 13 text-bearing CSS selectors; ratio 3.77:1 → 5.38:1 (passes WCAG AA 4.5:1) |
| U2 | Small chart/helper text | 2 (minor) | **✅ Fixed** | `.chart-axis` 10px→11px; `.metric-label`, `.metric-helper`, `.info-grid span`, `.metric-grid.compact span`, `.config-card small` 11px→12px |
| U3 | Trade table not keyboard accessible | 3 (major) | **❌ Not Fixed** | Zero `tabIndex` or `onKeyDown` handlers on trade table rows in `BacktestResults.jsx` |
| U4 | Missing accessible labels | 2 (minor) | **⚠️ Partly Fixed** | 7 `aria-label` attributes added in `StrategyBuilder.jsx` (Delete, Save, Back, Reset, CODE, VISUAL, search). Profile page also has labels. Other pages still need them. |

**Summary: 7 fixed, 2 partly fixed, 1 not fixed**

### 2.2 Accessibility Features (verified in code)

| Feature | File | Line(s) | Details |
|---------|------|---------|---------|
| Reset confirmation modal | `StrategyBuilder.jsx` | 20, 337, 366–390 | `showResetModal` state → themed modal with Cancel/Reset buttons |
| ARIA labels (7+) | `StrategyBuilder.jsx` | 213, 215, 216, 222, 223, 300, 337 | Delete strategy, Save strategy, Back to Dashboard, Switch to code/visual, Search ticker, Reset to last saved |
| Focus-visible outline | `index.css` | 972–976 | `:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }` |
| Contrast fix | `index.css` | 13 selectors | `#94a3b8` (3.77:1) → `#64748b` (5.38:1). 12 remaining `#94a3b8` are in dark-mode section (different background). 36 total uses of `#64748b`. |
| Font size bump | `index.css` | Multiple | 10px→11px for `.chart-axis`, `.vb-connector-arrow`; 11px→12px for `.info-grid span`, `.metric-label`, `.metric-helper`, `.metric-grid.compact span`, `.config-card small` |
| Dark mode | `index.css` + `ThemeToggle.jsx` | 370–970 | 600+ lines of `html[data-theme="dark"]` styles; theme toggle component |
| DocTooltip | `DocTooltip.jsx` + `docsData.js` | — | Hover glossary for RSI, Drawdown, SMA etc. Used on 5 pages |
| Chart ARIA | `Sparkline.jsx`, `Profile.jsx` | Various | `role="img"` with `aria-label` on SVG charts |

### 2.3 Recent Git History

```
5b2c5f5 fix: add reset confirmation modal and improve accessibility    ← OUR LAB 9 CHANGES
a6a2919 fix(compare): add dark mode styling for parameter comparison table
30f362b fix(parameters): add dark mode styles for compiled rules, sliders, and tooltips
dc3c302 fix(profile): support theme toggle switching and prevent dark mode lock
26000f5 feat: add user profile page and theme toggle
c61c342 chore: force refresh GitHub contributors graph
d9d303c docs: Documentation for API endpoints added
7ddd4ed added user flow diagram
```

---

## 3. Lab 7 Baselines (for comparison tables)

These are the **only verified Lab 7 numbers**. All come from the Lab 7 questionnaire:

| Question | Lab 7 Score |
|----------|-------------|
| Q1 — Understanding strategy behaviour | 3.8/5 |
| Q2 — Understanding parameters | 4.2/5 |
| Q3 — Understanding backtest status | 4.8/5 |
| Q4 — Understanding performance | 4.0/5 |
| Q5 — Understanding parameter effects | 3.2/5 |
| **Overall average** | **4.0/5** |

> [!WARNING]
> Lab 7 did **NOT** record: task completion rates, task times, error counts, or SUS scores. The "Not recorded" entries in the comparison table are correct — do not invent baseline values.

---

## 4. Success Targets (freeze before testing)

| # | Target | Measurement | Lab 7 Baseline | Lab 9 Goal |
|---|--------|-------------|----------------|------------|
| 1 | Task Completion | User completes independently | Not recorded | ≥ 4 of 5 users, per task |
| 2 | Time | Seconds from task read to success | Not recorded | T1 ≤ 240s, T2 ≤ 300s |
| 3 | Errors | Wrong clicks, dead ends, going back | Not recorded | ≤ 1.0 per task |
| 4 | Understanding | Average of 5-question questionnaire | Overall 4.0/5 | Average ≥ 4.0/5 |

---

## 5. Two Tasks (unchanged from Lab 7)

### Task 1: Strategy Creation & Backtesting
> Create a strategy using the editor, configure parameters and historical period, execute a backtest, inspect performance, and explain the results.

**Workflow:** BUILD → CONFIGURE → TEST → UNDERSTAND

### Task 2: Exploration
> Modify one or more parameters, run a variation, compare it with the original, and explain the observed difference.

**Workflow:** EXPLORE → COMPARE → UNDERSTAND

---

## 6. What You Must Do Before Completing the Report

### Step 1: Test with 5 new users
- Recruit 5 participants **not** from Lab 7
- Each does **both** tasks
- Use anonymous IDs: N01, N02, N03, N04, N05
- **Do NOT guide them** — hint only after 60s stuck; fail after 8 min

### Step 2: Record for each participant

| Field | Record |
|-------|--------|
| Participant ID | N01–N05 |
| Task | 1 or 2 |
| Completed independently? | Yes / No |
| Completion time | Minutes and seconds |
| Errors | Number + brief description |
| Confusion observed | Brief observation |
| Result understood correctly? | 1–5 scale |
| Feedback | Important comments |

### Step 3: Administer the questionnaire (same 5 questions, 1–5 scale)
- Q1: How well do you understand the strategy's behaviour?
- Q2: How well do you understand the parameters?
- Q3: How well do you understand the backtest status?
- Q4: How well do you understand the performance results?
- Q5: How well do you understand how parameter changes affect results?

### Step 4: Run Lighthouse audit
- Open Chrome DevTools → Lighthouse → Accessibility
- Record the score
- Take a screenshot

### Step 5: Capture 3–4 screenshots
1. **Contrast:** DevTools showing `#64748b` contrast ratio on a text element
2. **Focus-visible:** Tab-focused button showing blue outline
3. **Lighthouse:** Accessibility score result
4. **DocTooltip:** Hovering over "RSI" or "Drawdown" showing the tooltip

---

## 7. Placeholder Checklist (search & replace in LaTeX)

Find these placeholders in the `.tex` file and replace with actual data:

| Placeholder | Count | What to fill in |
|-------------|-------|-----------------|
| `[LAB 9 TESTING DATE REQUIRED]` | 1 | Date you conduct testing |
| `[LAB 9: INSERT COMPLETION RESULT...]` | 1 | Summary for At a Glance box |
| `[LAB 9 RESULT REQUIRED]` | 2 | At a Glance + interpretation paragraphs |
| `[LAB 9 RESULT]` | ~17 | All data cells in results/comparison/targets tables |
| `[\_\_]` and `[\_/5]` | ~30 | Per-participant data in Table 3 |
| `[alone / hint]` | 5 | Outcome column |
| `[+/--]` | 5 | Change column in comparison table |
| `[X]` | 2 | Number of targets met |
| `[Met / Not Met]` | 5 | Target status |
| `[SCORE]` | 1 | Lighthouse accessibility score |
| `[SCREENSHOT_PATH]` | 4 | Paths to screenshot images |
| `[Fixed / Partially]` | 3 | Improvement validation results from testing |
| `[LAB 9 --- Any new issues...]` | 1 | New issues found during testing |

---

## 8. Team Information

| Name | Roll Number | GitHub |
|------|-------------|--------|
| Ravikant Sharma | 2024AIB1013 | thyravikant |
| Rishav Kumar | 2024AIB1014 | rishavrai563 |

**Course:** AI511 — HCI & Visualization, IIT Ropar
**Repo:** https://github.com/rishavrai563/Algorithmic-Trading-Workbench

---

## 9. Technical Architecture (for context)

```
React Frontend (Vite, localhost:5173)
       ↓
REST API / JSON (fetch)
       ↓
ASP.NET Core Backend (C#/.NET 8, localhost:5000)
       ↓
LeanRunner → Docker → QuantConnect LEAN
       ↓
Backtest Results → LeanResultParser → React Visualizations
```

**Key backend files:** `BacktestController.cs`, `StrategiesController.cs`, `LeanRunner.cs`, `StrategyStore.cs`, `AssetRegistry.cs`

**Key frontend pages:** StrategyBuilder, Parameters, BacktestResults, Explore, Compare, Dashboard, Profile

---

## 10. How to Compile the Report

### Option A: Overleaf
1. Copy `lab9_validation_report.tex` contents into a new Overleaf project
2. Fill in placeholders
3. Add screenshot images to the project
4. Compile with pdfLaTeX

### Option B: Local
```bash
pdflatex lab9_validation_report.tex
pdflatex lab9_validation_report.tex  # run twice for references
```

> [!IMPORTANT]
> The report is designed to produce ~8–10 pages when all data is filled in, matching the main body length of the reference PDF (pages 1–5 core + appendices).
