# Pricing glass preview rollback

Snapshot of the working files immediately before trying the photo backdrop and glass pricing cards.

Restore only these files to revert this preview; the snapshot includes earlier uncommitted homepage changes.

- `src/app/page.tsx`: `page.tsx.before` (SHA-256 `ecd1ccbbb8f58e57a173bc15e30e8006b6161f13cd37babae4cb6fcd01565435`)
- `src/app/globals.css`: `globals.css.before` (SHA-256 `f73c74ed8cd02c0d207a79d0e33e735e7d3660ed1077544d132f35f42f3213b8`)

Preview changes: reuse the hero photograph with a different crop behind Pricing, add a dark overlay and three responsive glass placeholder cards, remove the previous Pricing background gradient. No actual prices or plan benefits added.

Restore with PowerShell from the repository root:

```powershell
Copy-Item -LiteralPath 'outputs/pricing-glass-preview-before/page.tsx.before' -Destination 'src/app/page.tsx'
Copy-Item -LiteralPath 'outputs/pricing-glass-preview-before/globals.css.before' -Destination 'src/app/globals.css'
```
