# HalalNest — Developer & AI Assistant Guide

> Read this file before touching any code. It documents every non-obvious architectural decision so you don't repeat mistakes or break the shared infrastructure.

---

## What This Is

HalalNest (`halal-nest-kappa.vercel.app`) is a US Muslim student housing platform. Tenants find halal-friendly rentals near universities; landlords list properties. It is a **fork of EasyHouseHunt** (`easyhousehunt.vercel.app`) and the two apps share a single Supabase instance.

**Repo:** `github.com/naveedam/HalalNest`  
**Stack:** React 18 + TypeScript, Vite, Tailwind CSS, MapLibre GL, Supabase, Vercel  
**Owner Supabase ID:** `a9b83e6b-6abb-4752-a8a6-2c2cceaaf0a3`

---

## Critical: Shared Supabase Database

HalalNest and EasyHouseHunt share **the same Supabase project** (`skvlnxlbdyjxroxwqmeq`). Every table is shared. Market segmentation is done via a `market` column:

| App | market value |
|-----|-------------|
| EasyHouseHunt | `'in'` (India) |
| HalalNest | `'us'` or `'us_student'` |

**Always filter by market in every query.** Forgetting this will show Indian listings on HalalNest or vice versa.

```typescript
// Correct — HalalNest property query
supabase.from("properties").select("*").eq("market", "us_student")

// Correct — HalalNest tenant requirements query  
supabase.from("tenant_requirements").select("*").eq("market", "us")

// Correct — HalalNest users query
supabase.from("profiles").select("*").eq("market", "us")
```

The `messages` table has **no market filter** — messages are scoped by `property_id` which implicitly scopes them.

---

## No React Router

There is **no React Router** in this app. All navigation is state-driven modals managed in `src/App.tsx`. Every screen (owner dashboard, tenant dashboard, admin, chat, listing wizard, etc.) is a `fixed inset-0` overlay toggled by a boolean `useState`.

### App.tsx state map

```
authModalOpen        → AuthModal (Google OAuth)
wizardOpen           → ListingWizard (post a property)
ownerDashOpen        → OwnerDashboard
tenantDashOpen       → TenantDashboard
postRequirementOpen  → PostRequirement (3-step wizard)
tenantBoardOpen      → TenantBoard (landlords browse tenant needs)
adminDashOpen        → AdminDashboard
inboxOpen            → Inbox
chatProperty         → ChatModal (property-based chat)
```

### sharedProps pattern

All handler functions flow from `App.tsx` down to `MobileLayout` and other components via a single `sharedProps` object:

```typescript
const sharedProps = {
  onListProperty: handleListProperty,
  onOwnerDash: () => setOwnerDashOpen(true),
  onTenantDash: () => setTenantDashOpen(true),
  onInbox: () => setInboxOpen(true),
  onConnectOwner: handleConnectWithOwner,
  onSignIn: () => { setAuthIntent("tenant"); setAuthModalOpen(true); },
  onPostRequirement: () => setPostRequirementOpen(true),
  onBrowseTenants: () => setTenantBoardOpen(true),
};

<MobileLayout {...sharedProps} />
```

If you add a new screen, add its boolean state + setter to App.tsx, add a handler to `sharedProps`, and pass it down.

---

## File Structure

```
src/
├── App.tsx                        # Root — all modal state lives here
├── components/
│   ├── MobileLayout.tsx           # Mobile shell: header, bottom sheet, 3 FABs
│   ├── SearchFilters.tsx          # Filter bar (halal, prayer space, etc.)
│   ├── EditListingModal.tsx       # Edit existing listing (used by admin too)
│   ├── map/
│   │   ├── MapView.tsx            # MapLibre GL full-screen map
│   │   ├── PropertyList.tsx       # Bottom sheet property cards
│   │   └── PropertyDetail.tsx     # Property detail overlay
│   └── ui/
│       └── AuthModal.tsx          # Google OAuth modal
├── modules/
│   └── chat/
│       ├── ChatModal.tsx          # Real-time chat (property or direct)
│       ├── Inbox.tsx              # All conversations
│       └── ListingWizard.tsx      # 5-step property listing wizard
├── pages/
│   ├── AdminDashboard.tsx         # Admin: listings, messages, users, reqs (HalalNest-scoped)
│   ├── OwnerDashboard.tsx         # Landlord: manage own listings
│   ├── TenantDashboard.tsx        # Tenant: saved properties, My Requirements tab
│   ├── PostRequirement.tsx        # 3-step modal: tenant posts housing needs
│   ├── TenantBoard.tsx            # Landlords browse active tenant requirements
│   └── AdminDashboard.tsx
├── hooks/
│   └── useAuth.tsx                # Supabase auth — exposes { user, loading, signOut }
├── integrations/
│   └── supabase/
│       └── client.ts              # Supabase client (import this everywhere)
└── types/
    └── property.ts                # Property TypeScript type
```

---

## Key Database Tables

### `properties`
| Column | Notes |
|--------|-------|
| `market` | `'us_student'` for HalalNest |
| `is_halal_kitchen`, `is_prayer_space`, `is_alcohol_free`, `near_mosque`, `near_university`, `gender_preference` | HalalNest-specific filters |
| `landlord_id` | FK → `auth.users` |
| `media_urls` | Array of Supabase Storage URLs (bucket: `property-media`) |

### `tenant_requirements`
| Column | Notes |
|--------|-------|
| `market` | `'us'` for HalalNest |
| `tenant_id` | FK → `auth.users` |
| `status` | `'active'` \| `'fulfilled'` |
| `expires_at` | Auto-set to 30 days by DB trigger |
| `needs_halal_kitchen`, `needs_prayer_space`, `needs_alcohol_free`, `near_mosque`, `near_university` | Requirement filters |

### `messages`
| Column | Notes |
|--------|-------|
| `property_id` | Text (NOT a FK, not UUID-typed) — used as channel key |
| | For property chat: real property UUID |
| | For tenant-match chat: synthetic key `uid1_req_uid2` (sorted) |

### `profiles`
| Column | Notes |
|--------|-------|
| `market` | `'us'` = HalalNest user, `'in'` = EasyHouseHunt user |
| `is_admin` | Boolean — gates AdminDashboard access |
| `role` | `'tenant'` \| `'owner'` |

New HalalNest users are tagged `market='us'` on first sign-in via `useAuth.tsx` → `onAuthStateChange` SIGNED_IN event.

---

## ChatModal — Direct Chat Workaround

`ChatModal` was originally built for property-based chat (landlord ↔ tenant about a listing). For tenant requirements matching (landlord contacts tenant directly, no property involved), we use a synthetic channel key:

```typescript
// In TenantBoard.tsx — when landlord clicks "I have a match"
propertyId={[user.id, chatTarget.tenantId].sort().join("_req_")}
```

This produces a deterministic, bidirectional key like `aaa-uid_req_bbb-uid`. It gets stored in `messages.property_id` as a plain string. This works because `property_id` is text type with no FK constraint.

The `isDirectChat` and `chatTitle` props on ChatModal handle the UI copy difference:

```typescript
<ChatModal
  propertyId={[user.id, chatTarget.tenantId].sort().join("_req_")}
  propertyTitle="Tenant Match"
  chatTitle="Message Tenant"
  receiverId={chatTarget.tenantId}
  isDirectChat={true}
  onClose={() => setChatTarget(null)}
/>
```

**Do not add a FK constraint on `messages.property_id`** — it will break this flow.

---

## Mobile Layout

`MobileLayout.tsx` renders on screens below `md` breakpoint. It has:

- Fixed header with hamburger menu
- Full-screen MapLibre map
- Draggable bottom sheet (peek → half → full) showing `PropertyList`
- **3 FABs** floating above the bottom sheet (always visible, no sign-in required):
  - 🏠 List Property (green)
  - 📋 Browse Tenants (orange)  
  - ✍️ Post Needs (teal)
- Hamburger menu with full nav options (sign-in gated where appropriate)

FAB position tracks bottom sheet height via inline style: `bottom: calc(${sheetHeights[sheetState]} + 12px)`.

---

## Auth Flow

Google OAuth only (no email/password). Flow:

1. User clicks any gated action → `setAuthModalOpen(true)` with `authIntent` set to `'tenant'` or `'owner'`
2. `AuthModal` triggers `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. On return, `useAuth.tsx` `onAuthStateChange` fires `SIGNED_IN`
4. Hook upserts `profiles` row with `market: 'us'` (HalalNest-specific tagging)
5. `user` becomes available app-wide via `useAuth()`

---

## Environment Variables

Set these in Vercel dashboard and locally in `.env.local`:

```
VITE_SUPABASE_URL=https://skvlnxlbdyjxroxwqmeq.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

No other env vars needed. Razorpay key will be added when payment is activated.

---

## Deployment

Auto-deploys to Vercel on every push to `main`. Build command: `npm run build`. No special config — `vercel.json` is in `src/`.

Before pushing always run:
```bash
npx tsc --noEmit
```

Common build failures:
- **Duplicate state declarations** — if a Python patch script runs twice, check for duplicate `useState` lines
- **Unexpected end of file** — file got truncated during a line-deletion patch; restore from `git checkout origin/main -- <file>` and rewrite cleanly
- **Missing closing tags** — heredoc pastes in terminal can get garbled; always use `cat > /tmp/fix.py << 'EOF'` then `python3 /tmp/fix.py` pattern

---

## What's NOT Built Yet (Intentional)

- **Razorpay listing fee** — wired up to wizard but not activated
- **TenantDashboard "My Requirements" tab** — state exists, UI pending
- **Deep links / SEO URLs** — all state-driven, no shareable URLs
- **Push notifications** — no implementation
- **Email on new match** — no implementation

---

## Relationship to EasyHouseHunt

| | HalalNest | EasyHouseHunt |
|--|-----------|---------------|
| Repo | `naveedam/HalalNest` | `naveedam/easyhousehunt` |
| URL | `halal-nest-kappa.vercel.app` | `easyhousehunt.vercel.app` |
| Supabase project | shared | shared |
| market value | `us` / `us_student` | `in` |
| Unique features | Halal filters, tenant requirements, TenantBoard | Indian city search, INR pricing |
| Shared | Auth, ChatModal, ListingWizard, Inbox, MapView, all DB tables | ← same |

Changes to shared Supabase tables (schema, RLS policies) affect both apps. Always test both after any migration.
