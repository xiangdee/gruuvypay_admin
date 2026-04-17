# GruuvyPay Admin Panel — Code README

## Overview

Internal admin dashboard for GruuvyPay operations team. Built with Next.js 14.
Manages users, transactions, KYC, finances, and site configuration.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts · TanStack Table · TanStack Query

**Auth:** Admin-only JWT auth. Any email can be an admin — role-based access controls what they can see and do.

**API Base URL:** `NEXT_PUBLIC_API_URL` (points to NestJS backend)

---

## Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Everything — including managing other admins. First admin is created directly in DB. |
| `FINANCE` | Financial screens, balances, revenue — read only |
| `SUPPORT` | Users, transactions, KYC — can suspend users |

---

## Project Structure

```
gruuvypay-admin/
├── app/
│   ├── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx    # Step 1 + 2: request + confirmation
│   │   └── reset-password/page.tsx     # Step 3: set new password (token in URL)
│   └── (dashboard)/
│       ├── layout.tsx              # Sidebar + topbar layout
│       ├── page.tsx                # Dashboard overview
│       ├── users/
│       │   ├── page.tsx            # User list
│       │   └── [id]/page.tsx       # User detail
│       ├── transactions/
│       │   ├── page.tsx            # All transactions
│       │   └── [id]/page.tsx       # Transaction detail + edit/delete
│       ├── bills/
│       │   └── page.tsx            # Bill payment transactions
│       ├── crypto/
│       │   └── page.tsx            # Crypto transactions
│       ├── finance/
│       │   └── page.tsx            # Float balances + revenue
│       ├── analytics/
│       │   └── page.tsx            # Charts: revenue, volume, users
│       ├── kyc/
│       │   └── page.tsx            # KYC review queue
│       ├── admins/
│       │   └── page.tsx            # Manage admin users (SUPER_ADMIN only)
│       ├── settings/
│       │   └── page.tsx            # Site defaults
│       └── profile/
│           └── page.tsx            # Admin profile, change password, sessions
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── RecentTransactions.tsx
│   │   └── BalanceAlerts.tsx
│   ├── users/
│   │   ├── UserTable.tsx
│   │   ├── UserDetail.tsx
│   │   └── UserStatusBadge.tsx
│   ├── transactions/
│   │   ├── TransactionTable.tsx
│   │   ├── TransactionDetail.tsx
│   │   └── EditTransactionModal.tsx
│   ├── finance/
│   │   ├── FloatCard.tsx
│   │   └── RevenueBreakdown.tsx
│   └── charts/
│       ├── VolumeChart.tsx
│       ├── RevenueChart.tsx
│       └── UserGrowthChart.tsx
├── lib/
│   ├── api.ts                      # Axios client with admin JWT
│   ├── auth.ts                     # Session management
│   └── utils.ts
└── hooks/
    ├── useUsers.ts
    ├── useTransactions.ts
    └── useFinance.ts
```

---

## First Admin Setup

Since there's no self-registration, the first SUPER_ADMIN must be created directly in the database:

```bash
# Run this once after deploying the backend
npx ts-node scripts/create-admin.ts \
  --email "your@email.com" \
  --name "Your Name" \
  --password "StrongPassword123!" \
  --role SUPER_ADMIN
```

After that, all other admins are added through the Admin Management page in the dashboard by a SUPER_ADMIN.

---

```bash
npx create-next-app@latest gruuvypay-admin --typescript --tailwind --app --no-src-dir
cd gruuvypay-admin
npx shadcn-ui@latest init
npm install @tanstack/react-query @tanstack/react-table
npm install recharts
npm install axios
npm install date-fns
npm install next-auth
npm install react-hot-toast
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.gruuvypay.com/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://admin.gruuvypay.com

# Admin API — backend must verify this is an admin user
# All admin requests include Authorization: Bearer <admin_jwt>
```

---

## Authentication

### Login (`app/(auth)/login/page.tsx`)

- Email + password form (no OTP — admin accounts use strong passwords)
- No domain restriction — any email can be an admin (domain restriction can be added later)
- On success: store JWT in httpOnly cookie via NextAuth
- On failure: show error — "Invalid credentials" or "Account not authorized"
- "Forgot password?" link below the form → navigates to forgot password page
- POST to `/admin/auth/login` — backend verifies admin role

```ts
// lib/auth.ts
// NextAuth config with credentials provider
// Backend validates credentials and admin role — no domain restriction
```

---

### Admin Forgot Password (`app/(auth)/forgot-password/page.tsx`)

**Flow — 3 steps on the same page, step state managed with useState:**

#### Step 1: Enter email
- Single email input
- "Send Reset Link" button
- Basic email format validation only
- POST `/admin/auth/forgot-password` → backend generates a time-limited token (15 min) and emails reset link
- On success: show step 2 — "If this email is registered, a reset link has been sent"

#### Step 2: Check your email
- Static confirmation screen
- "Didn't receive it? Resend" button with 60-second cooldown (use same ResendOtpButton pattern from the mobile app)
- "Back to login" link
- User clicks the link in their email → navigates to step 3 with token in URL query param

#### Step 3: Set new password (`app/(auth)/reset-password/page.tsx`)
- URL: `/reset-password?token=xxxxx`
- Two fields: New Password + Confirm Password
- Password requirements shown inline:
  - Minimum 8 characters
  - At least one uppercase
  - At least one number
  - At least one special character
- "Reset Password" button
- POST `/admin/auth/reset-password` with `{ token, newPassword }`
- On success: show "Password reset successfully" → redirect to login after 3 seconds
- On failure (expired/invalid token): "This link has expired. Request a new one." with link back to forgot password

**Security notes for backend:**
- Token is single-use — invalidated immediately after use
- Token expires in 15 minutes
- All active admin sessions for that account are revoked on successful reset
- Reset emails are logged with IP + timestamp in admin audit log
- Rate limit: max 3 reset requests per email per hour

**Backend endpoints needed:**
```
POST /admin/auth/forgot-password
  body: { email }
  → generates token, sends email, returns generic success

POST /admin/auth/reset-password
  body: { token, newPassword }
  → validates token, hashes password, revokes all sessions, returns success

GET  /admin/auth/validate-reset-token?token=xxx
  → returns { valid: boolean, email: string } — used to show whose password is being reset on step 3
```

**Email template for reset:**
Subject: "Reset your GruuvyPay Admin password"
Content:
- Admin name
- "You requested a password reset for your GruuvyPay Admin account."
- Large CTA button: "Reset Password" → links to `/reset-password?token=xxx`
- "This link expires in 15 minutes."
- "If you did not request this, contact the system administrator immediately."
- Warning alert: "Never share this link with anyone."

---

### User PIN Reset (Admin-triggered, `users/[id]/page.tsx`)

**This is separate from admin forgot password — this is for helping app users who forgot their PIN.**

Important clarification: **admins cannot see or set a user's PIN directly.** PINs are bcrypt hashed. What admins can do is trigger the same forgot-PIN OTP flow the user would use themselves — an SMS OTP is sent to the user's verified phone number, and the user resets their own PIN.

**UI: "Reset User PIN" button in User Detail page (SUPPORT+ role)**

On click → confirm modal:
```
"Send PIN Reset OTP to +234XXXXXXXXXX?

This will send an SMS to the user's registered phone number.
The user must enter the OTP to set a new PIN.

[Cancel]  [Send Reset OTP]"
```

On confirm:
- POST `/admin/users/:id/reset-pin` → backend calls Termii to send OTP to user's phone
- Show success toast: "OTP sent to user's phone. They can now reset their PIN."
- Log the action: "PIN reset triggered by admin@gruuvypay.com at [datetime]"

**What the user receives:**
- SMS: "Your GruuvyPay PIN reset code is XXXXXX. Valid for 10 minutes. If you did not request this, contact support."
- User opens app → goes through same forgot PIN flow they already have

**Backend endpoint:**
```
POST /admin/users/:id/reset-pin
  → finds user phone, calls termii.sendOtp(phone)
  → logs admin action in audit table
  → returns { message: 'OTP sent', phone: '+234XXXXXXXX' }
```

---

### Password Change for Logged-in Admins (`app/(dashboard)/profile/page.tsx`)

Admins should also be able to change their password while logged in (without going through the forgot password flow).

**Admin Profile page — accessible from sidebar bottom (click avatar/name):**

Sections:
- **Profile info**: name, email (read-only), role badge
- **Change Password**:
  - Current Password
  - New Password (with requirements)
  - Confirm New Password
  - "Update Password" button
  - POST `/admin/auth/change-password` with `{ currentPassword, newPassword }`
  - On success: "Password updated. You will be logged out of all other devices."
  - Revokes all other sessions except current one
- **Active Sessions**: list of active admin sessions with device + IP + last seen, "Revoke" button per session
- **Danger Zone**: "Log out all devices" button

---

## Pages

### 1. Dashboard Overview (`app/(dashboard)/page.tsx`)

**Top stats row** (4 cards):
```
Total Users          Total Volume (Today)     Active Transactions     Revenue (This Month)
12,847               ₦84,234,100              247                     ₦1,203,450
+12% vs last week    +8% vs yesterday         —                       +23% vs last month
```

**Two-column layout:**
- Left: Volume Chart (line chart, toggle: Daily/Weekly/Monthly)
- Right: Recent Transactions (last 10, with status badges)

**Alert banners** (conditional):
- 🔴 "VTpass balance low: ₦23,400 remaining" (show when < threshold)
- 🔴 "Quidax balance low: ₦150,000 remaining"
- These pull from `/admin/finance/balances`

**Bottom row:**
- User growth chart (bar chart)
- Top bill categories (pie chart: airtime/data/electricity/cable)
- Recent KYC submissions pending review

---

### 2. User Management (`app/(dashboard)/users/`)

#### User List (`users/page.tsx`)

**Filters bar:**
- Search: name, email, @username, phone
- Filter: Tier (All/TIER_0/TIER_1/TIER_2/TIER_3)
- Filter: Status (All/active/suspended/deactivated)
- Filter: Date joined (date range picker)
- Export: CSV button

**Table columns** (TanStack Table, sortable):
| Column | Detail |
|---|---|
| User | Avatar initial + name + @username |
| Email | |
| Phone | |
| Tier | Badge (color coded: grey/blue/purple/gold) |
| Status | Badge (green=active, red=suspended) |
| Balance | NGN wallet balance |
| Joined | Relative date |
| Actions | View · Suspend · More |

Pagination: 25 per page, server-side.

API: `GET /admin/users?page=1&limit=25&search=&tier=&status=`

#### User Detail (`users/[id]/page.tsx`)

Two-column layout:

**Left column:**
- Profile card: avatar, name, email, phone, @tag, joined date
- Tier + status badges
- Action buttons:
  - **Suspend Account** (SUPPORT+) — modal with reason
  - **Reactivate Account**
  - **Upgrade KYC Tier** (SUPER_ADMIN only)
  - **Reset PIN** (sends SMS OTP) (SUPER_ADMIN only)

**Right column tabs:**

*Overview tab:*
- Wallet balance (NGN)
- Virtual account NUBAN
- Quidax sub-account ID
- KYC details: BVN verified?, NIN verified?, Address verified?
- Push tokens count

*Transactions tab:*
- Table of user's last 50 transactions
- Filter by type, status, date
- Each row: tap to open Transaction Detail modal

*Crypto tab:*
- Quidax wallets (BTC, ETH, USDT, SOL balances)
- Crypto transaction history

*KYC tab:*
- BVN: verified/pending/failed + verification date
- NIN: verified/pending/failed
- Address: submitted document preview (if available)
- Manual override buttons (SUPER_ADMIN only)

*Sessions tab:*
- Active device sessions
- Button to revoke all sessions

API: `GET /admin/users/:id` — returns full user with nested relations

---

### 3. Transactions (`app/(dashboard)/transactions/`)

#### All Transactions (`transactions/page.tsx`)

**Filters:**
- Search: reference, narration
- Type: All / DEPOSIT / WITHDRAWAL / TRANSFER / FEE
- Status: All / PENDING / SUCCESS / FAILED / REVERSED
- Date range
- Amount range
- Export CSV

**Table columns:**
| Column | Detail |
|---|---|
| Reference | Monospace, copy button |
| User | Name + @tag (clickable → user detail) |
| Type | Badge |
| Amount | Formatted NGN |
| Status | Badge |
| Date | Full datetime |
| Actions | View · Edit · Delete |

#### Transaction Detail Modal

Shows all transaction fields + metadata JSON.

**Edit Transaction** (SUPER_ADMIN only):
- Editable fields: status, narration, metadata
- Confirm modal: "Are you sure? This action is logged."
- POST `/admin/transactions/:id` — backend records who made the change

**Delete Transaction** (SUPER_ADMIN only):
- Hard confirmation: type "DELETE" to confirm
- POST `/admin/transactions/:id/delete`
- This is destructive — log the action

---

### 4. Bill Transactions (`app/(dashboard)/bills/page.tsx`)

Filtered view of transactions where `metadata.type` is a bill category.

**Extra columns:**
- Service (airtime/data/electricity/cable/betting)
- Provider (VTpass serviceID)
- Meter/Phone/Smartcard number
- Electricity token (if applicable — show in green badge)
- VTpass reference

**Stats at top:**
- Total bill payments today
- Success rate (%)
- Most popular category (bar mini-chart)
- Total volume

---

### 5. Crypto Transactions (`app/(dashboard)/crypto/page.tsx`)

**Stats row:**
- Total crypto buy volume (NGN)
- Total crypto sell volume (NGN)
- Platform revenue from crypto (buy spread 2% + sell spread 1.5%)
- Most traded coin

**Table columns:**
| Column | Detail |
|---|---|
| User | Name + @tag |
| Type | BUY / SELL / RECEIVE / SEND |
| Symbol | BTC / ETH / USDT etc |
| Amount | Crypto amount |
| NGN Value | At time of transaction |
| Revenue | Platform spread earned |
| Status | SUCCESS / PENDING / FAILED |
| Date | |

**Revenue breakdown card:**
- Total earned from buy spread
- Total earned from sell spread
- Combined total

---

### 6. Finance (`app/(dashboard)/finance/page.tsx`)

**This page requires FINANCE or SUPER_ADMIN role.**

**Float Balances section:**

Two cards:

*VTpass Balance:*
- Current balance: ₦XXX,XXX
- Alert threshold: ₦50,000 (editable by SUPER_ADMIN)
- Status: 🟢 Healthy / 🔴 Low
- Button: "View VTpass Dashboard" (external link)
- Last refreshed: timestamp + refresh button
- API: `GET /admin/finance/vtpass-balance`

*Quidax Balance:*
- Current NGN balance in Quidax master account
- Status indicator
- Button: "View Quidax Dashboard" (external link)
- API: `GET /admin/finance/quidax-balance`

**Revenue Breakdown section:**

Three cards:
1. **Bill Payments Revenue** — total commissions earned from VTpass (3–5% per tx)
2. **Crypto Revenue** — spread earned: (2% buy + 1.5% sell) × volume
3. **Total Revenue** — sum of above

Each card shows:
- Total all time
- This month
- Last month
- % change

Time filter: This Week / This Month / This Year / Custom

Bar chart: revenue by source (bills vs crypto) over time

**Transaction Summary:**
- Total transaction volume (all time)
- Total transaction count
- Average transaction size
- Daily average volume

---

### 7. Analytics (`app/(dashboard)/analytics/page.tsx`)

**Time range selector:** Daily / Weekly / Monthly (affects all charts)

**Charts (Recharts):**

1. **Transaction Volume** — line chart, ₦ on Y axis, date on X axis
   - Multiple lines: total / bills / crypto / transfers
   
2. **User Growth** — bar chart, new users per day/week/month

3. **Revenue** — area chart, revenue by source stacked
   - Bills commission
   - Crypto spread

4. **Transaction Count** — bar chart by type (deposit/withdrawal/transfer/bills/crypto)

5. **KYC Funnel** — horizontal bar:
   - TIER_0: N users
   - TIER_1: N users (BVN)
   - TIER_2: N users (NIN)
   - TIER_3: N users (Address)

6. **Top Bill Categories** — donut chart (airtime/data/electricity/cable/betting)

7. **Geographic** — placeholder for future (most users by state)

All charts: responsive, dark theme, tooltips with formatted values.

API: `GET /admin/analytics?period=weekly&from=&to=`

---

### 8. KYC Queue (`app/(dashboard)/kyc/page.tsx`)

**Stats:**
- Pending reviews: N
- Approved today: N
- Rejected today: N

**Table** (sorted by submission date, oldest first):
| Column | Detail |
|---|---|
| User | Name + @tag + tier |
| Type | BVN / NIN / Address |
| Status | Pending / Approved / Rejected |
| Submitted | Date |
| Fincra Status | Raw status from Fincra |
| Actions | Review · Approve · Reject |

**Review Modal:**
- User info
- Document type
- Fincra verification result
- Approve button → emits `kyc.bvn.verified` or `kyc.nin.verified`
- Reject button + reason textarea

---

### 9. Admin Management (`app/(dashboard)/admins/page.tsx`)

**SUPER_ADMIN only.** Redirect others.

**Table:**
| Column | Detail |
|---|---|
| Name | |
| Email | Must be @gruuvypay.com |
| Role | Badge |
| Last Login | |
| Actions | Edit Role · Deactivate |

**Add Admin button:**
- Modal form: email, name, role
- POST `/admin/admins` — generates temporary password, sends email
- Roles: SUPER_ADMIN / FINANCE / SUPPORT

---

### 10. Settings (`app/(dashboard)/settings/page.tsx`)

**SUPER_ADMIN only.**

Sections:

*Balance Alert Thresholds:*
- VTpass minimum balance (₦) — editable input
- Quidax minimum balance (₦) — editable input
- Alert email recipients (comma-separated admin emails)
- Save button

*Transaction Limits Override:*
- Per-tier daily/monthly limits (view and edit)
- Note: "Changes take effect immediately"

*Maintenance Mode:*
- Toggle: Enable/disable maintenance mode
- Message to display to users

*App Config:*
- App store URL (iOS)
- Play store URL (Android)
- Support email
- Help URL

API: `GET/POST /admin/settings`

---

## Sidebar Navigation

```
Dashboard          (all roles)
Users              (all roles)
  └── KYC Queue
Transactions       (all roles)
  ├── All
  ├── Bills
  └── Crypto
Finance            (FINANCE + SUPER_ADMIN)
Analytics          (all roles)
Admin Users        (SUPER_ADMIN only)
Settings           (SUPER_ADMIN only)
```

Sidebar:
- Dark background (`#0F0F0F`)
- Logo at top
- Active item: left blue border + slightly lighter bg
- Role badge at bottom (your name, role, logout)
- Collapsed state on mobile (icon only)

---

## API Client (`lib/api.ts`)

```ts
import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach admin JWT to all requests
adminApi.interceptors.request.use((config) => {
  const token = getAdminToken(); // from cookie/session
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login
adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
```

---

## Data Fetching (`hooks/`)

Use TanStack Query for all data:

```ts
// hooks/useUsers.ts
export function useUsers(params: UserQueryParams) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminApi.get('/admin/users', { params }).then(r => r.data),
    staleTime: 30_000,
  });
}

// hooks/useTransaction.ts
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['admin-transaction', id],
    queryFn: () => adminApi.get(`/admin/transactions/${id}`).then(r => r.data),
  });
}
```

---

## UI/UX Rules

1. **Color scheme**: dark sidebar (`#0F0F0F`), light main area (`#F9FAFB` or white)
2. **Tables**: use TanStack Table with shadcn Table component — sorting, pagination built in
3. **Status badges**: use consistent colors — green=success, red=failed/suspended, yellow=pending, blue=active
4. **Confirmations**: always use a confirm modal for destructive actions (delete, suspend)
5. **Toast notifications**: use react-hot-toast for action feedback
6. **Loading states**: skeleton loaders (not spinners) for tables and cards
7. **Empty states**: meaningful empty state message + action button for each table
8. **Amounts**: always format as ₦X,XXX,XXX.XX — never show raw kobo values
9. **Dates**: show relative time (2 hours ago) in tables, full datetime in detail views
10. **Audit trail**: every admin action (edit/delete/suspend) must be logged — show "Action by admin@gruuvypay.com at 12:34" in detail views

---

## Build Order for  Code

1. Setup + auth (login page + NextAuth)
2. Forgot password flow (forgot-password + reset-password pages)
3. Sidebar + Topbar layout
4. Admin profile page (change password + sessions)
5. Dashboard overview (stats cards + basic charts)
6. Users list + User detail (including Reset User PIN button)
7. Transactions list + detail + edit modal
8. Bills transactions
9. Crypto transactions
10. Finance page (balances + revenue)
11. Analytics (all charts)
12. KYC queue
13. Admin management
14. Settings