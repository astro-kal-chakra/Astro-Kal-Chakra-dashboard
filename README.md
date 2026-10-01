# AstroAdmin — admin dashboard (UI)

Front-end for the astrology platform's admin panel. **This repo is UI only**: every page reads from an in-memory mock data layer, and every action (block, refund, approve…) is simulated in the browser with a toast. No real backend, database or auth is connected.

Stack: Next.js 16 (App Router, JS), React 19, Tailwind CSS v4, Recharts, lucide-react.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Sign in with a demo account (password `Admin@123` for all, then any 6-digit 2FA code). The sidebar, pages and action buttons change with the role.

| Role | Email |
| --- | --- |
| Super Admin | superadmin@astroadmin.in |
| Ops Admin | ops@astroadmin.in |
| Support Agent | support@astroadmin.in |
| Finance | finance@astroadmin.in |
| Moderator | moderator@astroadmin.in |
| Marketing / Content | marketing@astroadmin.in |

The accounts live in `src/config/demoAccounts.js`; delete that file when login is connected to the real auth API. You can also switch roles without signing out from **profile menu → Preview as role**.

## Structure

```
src/
  app/
    login/                 Email + password → 2FA step, lockout after 5 failed codes
    (admin)/               Everything behind auth; layout = sidebar + topbar + idle logout
      page.jsx             Overview (live numbers, KPIs with trends, needs-attention cards)
      analytics/           Date presets, custom range, group by, compare, CSV export
      users/ astrologers/ sessions/ chats/ calls/ payments/ payouts/
      support/ marketing/ content/ settings/ admins/ audit-logs/ profile/
  components/
    ui/                    Button, Badge, Card, Input, Modal, DataTable, Pagination, Tabs, StatCard…
    common/                FilterBar, ReasonDialog, ActionButton, MaskedValue, ExportButton, AccessDenied
    charts/                TrendChart, BarChart, DonutChart, DateRangeFilter
    layout/                AdminShell, Sidebar, Topbar, IdleTimeout
  config/                  navigation, roles & permission matrix, shared option lists
  services/                The ONLY data source for pages (async, REST-shaped params)
  data/                    Mock database (deterministic seed) — delete when the API is live
  actions/auth.js          Demo login/logout/role-preview server actions
  proxy.js                 Redirects signed-out visitors to /login
```

## Connecting the real backend

1. **Data**: replace each function body in `src/services/*.js` with a `fetch` to the API. Keep the same params (`q`, filters, `sort`, `page`) and return shape (`{ rows, total, page, pageSize, pageCount }`). Pages won't need changes. Then delete `src/data/`.
2. **Actions**: `ActionButton`, `ReasonDialog` and the `_components` forms currently toast on submit. Swap the simulated delay for a server action or API call, and send the `reason` with it.
3. **Auth**: replace `src/actions/auth.js` and `getCurrentAdmin()` in `src/lib/session.jsx` with the real session (email + password + TOTP). The session must expire after 30 minutes idle; `IdleTimeout` only mirrors that in the UI.
4. **Permissions**: `checkAccess()` on each page and `can()` in the UI mirror the matrix in `src/config/permissions.js`. **The backend must enforce the same checks on every API.** Hiding a button is not security.

## Rules the UI already reflects (the backend must enforce them too)

- A reason is required for block, wallet adjust, refund, force-end, opening a chat, and revealing hidden details. The reason goes to the audit log.
- Phone numbers and birth details are masked. A reveal needs a reason and is logged. In production the API should return masked values only and expose a separate reveal endpoint.
- Tables use server-side search, filters, sorting and pagination through URL params.
- KYC documents are shown through short-lived signed links, never public URLs.
- The live session monitor is read-only. The only action is force-end, with a reason.
- Calls are not recorded.
- Audit logs are append-only: there are no edit or delete controls.
- Analytics read pre-computed daily stats (`dailyStats`), which should be filled by a background job.
- Layout works down to 360px wide.
