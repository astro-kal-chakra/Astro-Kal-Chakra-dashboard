# AstroAdmin — admin dashboard

Admin panel for the astrology platform. Every page reads from and writes to the backend's admin API (`AstroBackend`, `/api/v1/admin`). Sign-in is email + password + an authenticator app code. All permissions are enforced by the backend.

Stack: Next.js 16 (App Router, JS), React 19, Tailwind CSS v4, Recharts, lucide-react.

## Run

1. Start the backend (`D:\AstroBackend`: `npm run dev` and `npm run worker`).
2. Configure and start the dashboard:

   ```bash
   cp .env.example .env.local   # set API_BASE_URL to the backend, e.g. http://localhost:5000
   npm install
   npm run dev                  # http://localhost:3000
   ```

3. Create the first Super Admin on the backend:

   ```bash
   npm run create-admin -- you@company.in "Your Name" "Str0ng!Passw0rd#"
   ```

   Then sign in. The first sign-in shows a QR code for the authenticator app and then one-time recovery codes. Invite other admins from **Admin management**. The invite email links to `/accept-invite`, so set `ADMIN_DASHBOARD_URL` on the backend to this dashboard's URL. Without SMTP on the backend, the invite link is copied for you instead.

`.env.local` (server-side only, never sent to the browser):

| Key | |
| --- | --- |
| `API_BASE_URL` | Backend URL without `/api/v1` |
| `TRUSTED_PROXY_HOPS` | Proxies in front of the browser, counting this Next server (default 1). The admin's IP for audit logs is read that many entries from the right of `X-Forwarded-For`. |
| `ADMIN_SESSION_DAYS` | Session cookie lifetime. Keep it equal to the backend's `ADMIN_REFRESH_TOKEN_DAYS` (default 1). |

In production, serve the dashboard over **HTTPS**: session cookies are `Secure`.

## How it talks to the backend

```
Browser ──(httpOnly cookies)──▶ Next.js server ──(Bearer token)──▶ AstroBackend /api/v1/admin
```

- **Session**: `src/actions/auth.js` signs in (`/auth/admin/login` → `/login/verify`). The access and refresh tokens are stored only in httpOnly cookies, so browser JavaScript never sees them. The 2FA challenge is a cookie too.
- **Refresh**: `src/proxy.js` refreshes the access token shortly before it expires. Refresh tokens rotate, and the backend signs the whole session out if an old one is reused. Parallel requests therefore share one refresh (`src/lib/tokenRefresh.js`). This in-memory sharing assumes one Next.js server process; run more than one only behind sticky sessions.
- **Idle timeout**: the backend ends a session after 30 minutes without requests. `IdleTimeout` warns at 29 minutes and pings the backend while the admin is active.
- **Reads**: `src/services/*.js`. Each function calls `api()` in `src/lib/api.js` and returns the backend's shape: lists are `{ rows, total, page, pageSize, pageCount, ...extras }`, amounts are rupees, dates are epoch ms.
- **Writes**: Server Actions in `src/actions/*.js`, one file per area. Server pages bind them to ids and pass them down, for example `<ActionButton run={blockUser.bind(null, user.id)} />`. They return `{ ok, data, error }`. When an action fails, its dialog stays open and the backend's message is shown. When it succeeds, the page re-renders with fresh data.
- **Exports**: `ExportButton endpoint="users"` downloads the backend's CSV of every matching row through `/export/<endpoint>`. Each export is audit-logged.
- **Any 401** (signed out elsewhere, idle, revoked) goes to `/signout`, which clears the cookies and opens `/login` with a notice.

API reference and endpoint mapping: `AstroBackend/docs/ADMIN_API.md`.

## Structure

```
src/
  app/
    login/ accept-invite/  Sign-in (password → 2FA / first-time enrolment), invite acceptance
    signout/ export/       Route handlers: clear session, CSV export proxy
    (admin)/               Everything behind auth; layout = sidebar + topbar + idle logout
  actions/                 Server Actions (mutations) per area: users, astrologers, sessions, payments…
  services/                Page data (reads) from the admin API
  lib/                     api client, session (GET /admin/me), cookies, token refresh, formatting
  components/              ui/, common/ (ActionButton, ReasonDialog, MaskedValue, ExportButton), charts/, layout/
  config/                  navigation, roles & permission matrix (UI mirror), option lists
  proxy.js                 Session refresh + redirect to /login
```

## Rules (enforced by the backend, mirrored in the UI)

- Permissions come from `GET /admin/me`. `checkAccess()` and `can()` only hide what the role can't use; the backend checks every call. A Super Admin can **Preview as role** from the profile menu. That changes only what the UI shows; the backend keeps using the real role.
- A reason is required for block, wallet adjust, refund, force-end, opening a chat and revealing hidden details. The reason is written to the audit log.
- Phone numbers, birth details and bank numbers arrive masked. Revealing one calls the backend's reveal endpoint, which needs a reason and is audit-logged.
- Chat transcripts are never sent with the page. They arrive only after a logged reason, and stay available for 15 minutes. Support agents can open a chat only through a ticket linked to it.
- KYC documents open through 5-minute signed links.
- Audit logs are append-only.
- Layout works down to 360px wide.
