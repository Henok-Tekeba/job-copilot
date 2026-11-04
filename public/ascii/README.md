# ASCII Magic runtime

Vendored from [`ascii-magic-art@1.1.0`](https://www.npmjs.com/package/ascii-magic-art)
(MIT, see `LICENSE` and `NOTICE`).

Only the runtime files needed by the landing page are included:

- `runtime/` — the `<ascii-art>` custom element and its canvas player
- `lib/kit.js` — the shared grid/noise/colour toolkit
- `pieces/wireframe-globe.js` — recoloured to the Shortlist blue palette

The piece is loaded only on the landing page and only after hydration.
