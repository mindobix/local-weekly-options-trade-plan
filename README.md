# Weekly Options Trade Plan (WOTP)

A local, offline-first web app for planning and tracking weekly options trades. No server, no login — all data lives in your browser's `localStorage`.

## Features

- **Monthly / Weekly / Daily views** — navigate trades by month, week, or day
- **Call & Put tracking** — log calls and puts with strike, expiry, trigger price, up to 3 targets, and a stop price
- **Status workflow** — mark trades as Active, Triggered, Target Hit, or Stopped
- **Filter & search** — filter by option type, status, or ticker symbol
- **Color-coded cards** — assign card colors for quick visual grouping
- **Backup & Restore** — export all trades to a JSON file and restore from it anytime

## Trade Fields

| Field | Description |
|---|---|
| Symbol | Ticker (e.g. TSLA, SPY) |
| Option Type | Call or Put |
| Strike Price | Option strike |
| Expiry Date | Option expiration date |
| Trigger (AT) Price | Underlying price at which to enter |
| Target 1 / 2 / 3 | Price targets (T2 and T3 optional) |
| Stop Price | Stop-loss level |
| Week Of | The Monday of the trade's target week |
| Created Date | Date the plan was added |
| Status | Active / Triggered / Target Hit / Stopped |
| Notes | Free-form notes |

## Usage

Open `index.html` directly in a browser — no build step or server needed.

```
open index.html
```

Data is stored under the `localStorage` key `ow-ideas-v1`.

## File Structure

```
local-weekly-options-trade-plan/
├── index.html        # App shell and modal markup
├── css/
│   └── styles.css    # All styles
└── js/
    ├── app.js        # State management, view routing, nav
    ├── cards.js      # Card rendering (monthly/weekly/daily)
    ├── modal.js      # Add/edit modal logic
    ├── storage.js    # localStorage read/write, UID generation
    └── helpers.js    # Date utilities and formatters
```
