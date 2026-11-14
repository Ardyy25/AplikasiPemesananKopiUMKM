# Kopikita delivery

- [x] Recover the original Vite prototype without replacing the Payload template.
- [x] Migrate the interface and verify email/password signup, login, logout and account points.
- [x] Verify production delivery: preview all routes, run `figma make verify-deploy`,
      inspect the route table, and visit every generated public route.

## Content lifecycle

Public pages `/`, `/menu`, `/rewards`, `/pesanan`, `/akun`, `/login`, and `/staff` are
intentional static, build-time menu snapshots. Menu and menu-photo changes in
Payload require another **Publish**. There is no on-write route revalidation.
Account balances and staff operations are private request-time data loaded through
`/api/account` and `/api/staff`, with no caching. New accounts start with zero
points and stamps.

Cart, customizations and order tracking remain an explicitly labeled prototype
simulation; simulated orders never award real account points or reach a shop.

## Verification

- `pnpm exec tsc --noEmit`: passed.
- `pnpm format --check` for all changed application files: passed.
- `figma make verify-deploy`: passed; all six public pages are `○ (Static)`.
  `/api/account` is intentionally request-time for private customer data.
- Chromium mobile checks: signup, invalid and valid login, logout, persisted
  sessions after reload, zero initial points/stamps, private-profile access,
  and rejection of customer-written loyalty balances passed.
- Menu filtering, empty state, milk, sugar/ice selection, topping, quantity,
  barista notes, cart total and simulated queue passed; simulated ordering
  leaves actual loyalty balances unchanged.
- All public routes were visited in preview and in a local production standalone
  runtime. Production home/menu photos loaded with nonzero dimensions. Missing
  routes return HTTP 404. No browser runtime errors or mobile horizontal overflow.
- Mobile and desktop account screenshots were inspected.
- Preview initially retained a pre-schema Payload auth strategy list. A managed
  `verify-bootstrap --force` refreshed it; no custom auth strategy or platform
  bootstrap changes were introduced.
- App logout changes only `app-session`. Automated tests did not have a real
  Figma SSO session, so simultaneous CMS/app SSO login-order testing was not
  possible. No Payload Admin route or CMS auth code was edited.

Menu names, prices, categories, descriptions and upload relationships were
migrated into four verified Payload Product documents and four Media documents.
Navigation, fixed promotional copy and customization options stay presentational.
QA-only customer records use the reserved `example.test` domain.

## Role-based operations

- Public registration always creates a Customer. `role`, staff status, loyalty
  balances, HPP, and cashier-wide reporting permissions are server-controlled.
- Owner: `/staff` includes POS, complete sales/HPP/gross-profit and expense
  reporting, product/stock/HPP management, suppliers, staff role/access
  management, and Customer loyalty top-ups.
- Cashier: `/staff` includes POS and only their own transactions unless an Owner
  enables the explicit all-sales permission. HPP and profit fields remain hidden.
- Customer: retains personal account, loyalty, menu, cart, and prototype
  self-ordering access and receives no operational store data.
- Existing user documents with no role remain Customer by fallback; no existing
  account or product document was mutated by this schema addition.

Role verification covers the server-side access matrix, transaction price/HPP
recalculation, stock eligibility and reduction, Customer denial, Cashier
own-sales filtering, Owner-only controls, mocked Owner/Kasir UI states, mobile
overflow, and anonymous `/api/staff` denial.
