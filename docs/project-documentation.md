# BursRadar Project Documentation

Last updated: 2026-05-02

## Purpose

BursRadar is an Expo / React Native app for tracking private school scholarship exams, school registration periods, and user-specific exam plans. The primary user interface is the HTML app under `public/bursradar/`, hosted inside Expo through iframe on web and WebView on native mobile. The app supports Supabase-backed school/exam data, account login, Google OAuth, user favorites, reminders, and Android preparation for Google Play.

## Tech Stack

- Expo SDK 54
- Expo Router 6
- React 19
- React Native 0.81
- TypeScript
- Supabase Auth and REST API
- `react-native-webview` for the native mobile HTML app shell
- `expo-web-browser` and `expo-linking` for native OAuth handoff/deep links
- AsyncStorage for persisted sessions
- Expo Notifications for local reminder notifications
- EAS Build for Android release builds

## App Configuration

Main config file: `app.json`

Current production-facing identifiers:

- App name: `BursRadar`
- Expo slug: `bursradar`
- URL scheme: `bursradar`
- Android package id: `com.orchi35.bursradar`
- Android versionCode: `1`
- App version: `1.0.0`
- Android notification permission: `POST_NOTIFICATIONS`

Important: the Android package id cannot be changed after the first Google Play upload.

## Project Structure

- `app/`: Expo Router screens and route layouts.
- `app/(tabs)/`: Expo Router shell. The native/web tab bar is hidden; the HTML app owns the visible bottom navigation.
- `app/(tabs)/index.tsx`: Mounts the HTML app shell through `components/BursRadarHtmlApp.tsx`.
- `app/(tabs)/account.tsx`: Native fallback account route kept for compatibility with earlier route-level auth work.
- `app/auth.tsx`: Compatibility redirect to `/account`.
- `app/exam/[id].tsx`: Exam detail screen.
- `app/school/[id].tsx`: School profile/detail screen.
- `components/BursRadarHtmlApp.tsx`: Web iframe + native WebView wrapper for `public/bursradar/BursRadar.html`.
- `components/`: Shared UI cards and layout components.
- `context/AuthContext.tsx`: Supabase auth session state and auth actions.
- `context/AppContext.tsx`: Favorites/reminders state, Supabase persistence, notification scheduling.
- `context/DataContext.tsx`: Schools/exams data state. Fetches from Supabase if configured, falls back to mock data.
- `services/dataService.ts`: Supabase row → app type mapping and combined fetch helper.
- `data/mock.ts`: Mock school/exam data used as fallback and offline reference.
- `utils/supabaseClient.ts`: Supabase client and REST helper.
- `utils/notifications.ts`: Local notification scheduling/cancel helpers.
- `utils/date.ts`: Date formatting and date status helpers.
- `utils/format.ts`: String formatting helpers (school initials, etc.).
- `scripts/`: Bot and local bot server scripts.
- `supabase/`: SQL schema, seed files, edge function, migrations.
- `docs/`: Project documentation and release notes.
- `public/bursradar/`: Primary HTML user interface, including screens, styles, Supabase REST/auth helpers, and in-app bottom navigation.

## Environment Variables

Example file: `.env.example`

Required local file: `.env.local`

### Mobile app (bundled into binary — use `EXPO_PUBLIC_` prefix)

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
EXPO_PUBLIC_BURSRADAR_WEB_URL=https://your-domain.com/bursradar/BursRadar.html
```

`EXPO_PUBLIC_BURSRADAR_WEB_URL` is optional in local development. If omitted, `BursRadarHtmlApp` uses `/bursradar/BursRadar.html` on web and the Expo dev host on native. For production native builds, set it to the hosted HTML app URL so the WebView can load the same interface outside the local dev server.

### Bot / server-side (never bundled — no `EXPO_PUBLIC_` prefix)

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BOT_SERVER_TOKEN=random-secret-for-local-bot-server
SUPABASE_BOT_SECRET=random-secret-for-edge-function
RESEND_API_KEY=your-resend-api-key
PACKAGE_REQUEST_MAIL_TO=orcun@bursradar.info
PACKAGE_REQUEST_MAIL_FROM=BursRadar <noreply@bursradar.info>
```

### Optional local bot server

```env
BOT_SERVER_PORT=8787
BOT_SERVER_HOST=127.0.0.1
```

Rules:
- Never use `EXPO_PUBLIC_` prefix on secret/service keys.
- Never commit `.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local` before running `npm run bot:scrape`.
- `SUPABASE_BOT_SECRET` must also be registered in Supabase Dashboard → Edge Functions → run-bot → Secrets.
- `RESEND_API_KEY`, `PACKAGE_REQUEST_MAIL_TO`, and `PACKAGE_REQUEST_MAIL_FROM` must be registered in Supabase Dashboard → Edge Functions → package-request-notify → Secrets before package request email notifications can be sent.

## Supabase

The app uses Supabase for authentication and user-specific plan data.

### Auth

Implemented in:

- `utils/supabaseClient.ts`
- `context/AuthContext.tsx`
- `app/auth.tsx`
- `public/bursradar/supabase-client.js`
- `public/bursradar/screens.jsx` (`AccountScreen`)
- `components/BursRadarHtmlApp.tsx`

Behavior:

- Email/password sign up and sign in.
- Session persistence through AsyncStorage.
- SSR/static-render safe storage adapter for Expo web export.
- The HTML app account section supports email/password sign-in, sign-up, forgot password, and Google OAuth.
- On web, Google OAuth redirects to `http://localhost:8081/?auth=google` in development.
- On native mobile, Google OAuth is handed off from WebView to the system browser via `expo-web-browser`, then returns through the `bursradar://auth/callback` deep link.
- `Planım` in the HTML app is protected at the visible navigation level: unauthenticated users are sent to the in-app `Hesap` section.

### User Exam Marks

SQL file:

- `supabase/auth_user_exam_marks.sql`
- `supabase/migrations/202604301_auth_user_exam_marks.sql`

Table:

- `user_exam_marks`

Purpose:

- Stores user-specific favorite and reminder marks.
- Uses RLS so each user can only read/write/delete their own plan rows.

Columns:

- `user_id`
- `exam_id`
- `is_favorite`
- `has_reminder`
- `created_at`
- `updated_at`

### School Packages And Roles

SQL file:

- `supabase/migrations/202605011_school_packages.sql`
- `supabase/functions/package-request-notify/index.ts`

Tables:

- `user_profiles`: maps auth users to `user`, `school_user`, or `admin`; school users must be linked to one `school_id`.
- `school_packages`: stores active/inactive/pending/expired package status per school.
- `package_requests`: stores school package requests created from the HTML app.

Package types:

- `profile_management`: Profil Yönetimi Paketi, 1000 TL. Lets a school manage its own profile data after approval. It does not boost public lists.
- `featured_school`: Öne Çıkan Okul Paketi, 5000 TL. Includes profile management and marks the school as premium/featured.

Behavior:

- Package cards are rendered only in the HTML school detail screen when the signed-in profile is `school_user` and `user_profiles.school_id` matches the viewed school.
- Normal users do not see package prices, package cards, or school management controls.
- Admin users see an `Admin` tab in the HTML app with package requests, active package management, manual package assignment, and school list visibility.
- Admin users can use `Kullanıcı Rol Yönetimi` to find a registered auth user by email and update the persistent `user_profiles.role` and `user_profiles.school_id` mapping.
- Package CTA creates a `package_requests` row; no real payment is triggered.
- After a package request is created by a `school_user` account, the HTML app calls the `package-request-notify` Supabase Edge Function. The function verifies that the request belongs to the same school account, sends an email notification to `orcun@bursradar.info` through Resend using server-side secrets, includes the requesting account email in the body, and sets that email as `Reply-To`.
- If the package request row is created but the email notification fails, the package panel now shows a visible diagnostic message instead of silently showing the normal success state.
- Package requests do not unlock features by themselves. Admin approval calls `admin_approve_package_request`, marks the request `approved`, and creates an active row in `school_packages`.
- Admin rejection calls `admin_reject_package_request`, marks the request `rejected`, and does not create any active package.
- Admin can deactivate or expire active packages through `admin_deactivate_school_package`.
- If a school has an active `profile_management` or `featured_school` package, the school account sees a profile editing panel for description, contact links, campus, and registration dates. Supabase RLS still enforces that the school can update only its own row and only while an active management-capable package exists.
- Active `featured_school` packages sync `schools.is_premium` through a database trigger. The HTML app uses that flag to show the featured badge and prioritize school/exam/registration lists.
- The HTML UI uses the active package state to open profile image preview upload, profile editing, registration date editing, and local exam creation controls only for the linked school account on its own profile. Featured schools use a restrained premium card variant and sort above standard schools in UI lists.
- `202605014_school_management_features.sql` adds `schools.logo_url`, the public `school-assets` Storage bucket, storage policies for active-package school users/admins, and insert/delete policies so active management packages can create or remove their own exam rows.
- `202605015_data_trust_system.sql` adds the Veri Güven Sistemi: school profile, registration date, and exam verification metadata with admin-only update protection.
- `202605016_school_profile_theme.sql` adds `schools.hero_color`; `202605017_featured_theme_guard.sql` limits school-account theme color edits to active `featured_school` packages while admins can still manage all schools.
- `202605019_realtime_publication.sql` adds BursRadar tables to Supabase Realtime. The HTML app uses a central realtime service to listen for school, exam, package, request, role, and plan-mark changes.

## Authentication Flow

1. The Expo home route mounts `BursRadar.html`.
2. On web, the HTML app is rendered in an iframe.
3. On Android/iOS, the HTML app is rendered in `react-native-webview`.
4. User opens `Planım` from the HTML bottom navigation.
5. If not logged in, the HTML router sends the user to the `Hesap` section with `returnTo: 'plan'`.
6. User signs in by email/password, creates an account, requests a password reset, or chooses Google login.
7. Email/password auth uses Supabase Auth REST endpoints directly from `public/bursradar/supabase-client.js`.
8. Google auth builds the Supabase `/auth/v1/authorize?provider=google` URL.
9. On web, the top page redirects to Google and returns with an OAuth hash. `components/BursRadarHtmlApp.tsx` forwards that hash into the iframe.
10. On native, WebView posts an OAuth message to React Native. `expo-web-browser` opens the system browser and returns to `bursradar://auth/callback`; the returned hash is injected back into WebView.
11. The HTML auth helper stores the session in `localStorage` and decodes the access token for user email/id display.
12. On successful login, the HTML app returns to `Planım`.

## Data Layer

Implemented in:

- `services/dataService.ts`
- `context/DataContext.tsx`
- `data/mock.ts`

Behavior:

- On app start the `DataProvider` initializes state with mock data so the
  UI renders instantly.
- It then attempts to fetch `schools` and `exams` from Supabase via
  `selectRows`. Supabase column names are mapped to the TypeScript types
  declared in `types/index.ts` (e.g. `is_verified` → `verified`,
  `applicable_grades` → `eligibleGrades`, `scholarship_rate` →
  `scholarshipScore`, `registration_end_date` → `registrationDeadline`,
  `about_text` → `description`, etc.).
- Exam status (`open`/`upcoming`/`closed`) is derived from the application
  start/deadline dates, since the schema does not store a status column.
- If Supabase is not configured, returns no rows, or fails for any reason,
  the provider falls back to mock data. The active source is exposed as
  `source: 'supabase' | 'mock'` for diagnostics.
- All screens and shared cards read schools/exams via `useData()`. Mock
  imports are limited to the static UI lists (`GRADES`, `IZMIR_DISTRICTS`).

## Navigation

- Expo Router is still present for shell routing, deep-link handling, and compatibility routes.
- The visible app navigation is owned by the HTML app in `public/bursradar/BursRadar.html`.
- `app/(tabs)/_layout.tsx` hides the Expo tab bar on all platforms to avoid duplicate navigation.
- The HTML bottom navigation includes `Ana Sayfa`, `Sınavlar`, `Planım`, `Okullar`, and `Hesap`.
- `app/auth.tsx` redirects to `/account` for backward compatibility with earlier auth URLs.
- `app/(tabs)/admin.tsx` remains hidden and redirects to `/`.

## HTML App Shell

Primary files:

- `components/BursRadarHtmlApp.tsx`
- `public/bursradar/BursRadar.html`
- `public/bursradar/screens.jsx`
- `public/bursradar/styles.css`
- `public/bursradar/supabase-client.js`

Behavior:

- Web uses an iframe source of `/bursradar/BursRadar.html`, forwarding any OAuth `access_token` hash into the iframe.
- Native uses `react-native-webview`.
- In development native sessions, the WebView loads the HTML from the Expo dev server host.
- Production native builds should set `EXPO_PUBLIC_BURSRADAR_WEB_URL` to the hosted HTML app URL.
- `public/bursradar/supabase-client.js` fetches schools/exams from Supabase REST and also handles HTML-side auth.
- Google OAuth inside WebView is not opened inside the embedded WebView. It posts a message to React Native and opens the system browser.

## Google OAuth Setup

Supabase Google provider:

- `Client IDs`: Google Cloud OAuth Web Client ID, for example `1234567890-abc.apps.googleusercontent.com`.
- `Client Secret`: Google Cloud OAuth client secret.
- Callback URL shown by Supabase must be registered in Google Cloud Authorized redirect URIs:
  `https://retphdxaoblwczvrzsru.supabase.co/auth/v1/callback`

Supabase URL Configuration redirect allow list:

```text
http://localhost:8081/?auth=google
bursradar://auth/callback
```

For production, also add:

```text
https://your-domain.com/?auth=google
```

Google Cloud OAuth client:

- Application type: Web application.
- Authorized JavaScript origins for local dev: `http://localhost:8081`.
- Authorized redirect URI: the Supabase callback URL above, not the app URL.

## Favorites And Reminders

Implemented in:

- `context/AppContext.tsx`
- `components/ExamCard.tsx`
- `app/(tabs)/plan.tsx`

Behavior:

- Favorite toggle updates UI immediately.
- Reminder toggle updates UI immediately.
- If logged in, state is persisted to `user_exam_marks`.
- If a row has neither favorite nor reminder enabled, it is deleted.
- On login/app load, favorites and reminders are reloaded from Supabase.

## Notifications

Implemented in:

- `utils/notifications.ts`
- `context/AppContext.tsx`
- `app.json`

Package:

- `expo-notifications`

Behavior:

- When user enables a reminder, app requests notification permission.
- If permission is granted on native platforms, a local notification is scheduled.
- Reminder target date priority:
  - 1 day before application deadline at 09:00.
  - If that is past, 1 day before exam date at 09:00.
  - If that is also past, 1 minute from now as a fallback.
- When user disables reminder, scheduled notification is canceled.
- On login/app load, saved reminders are rescheduled.
- Web stores reminder intent but native iOS/Android is the reliable notification target.

Android channel:

- `exam-reminders`

## School Profiles

Screen:

- `app/school/[id].tsx`

Current behavior:

- Shows school identity, district, city, campus, description, registration status, contact info, and exams.
- Phone, website, and Instagram rows are clickable links in both the HTML app and the native fallback detail screen.
- Phone uses `tel:`.
- Website auto-adds `https://` when needed.
- Instagram converts `@handle` to `https://www.instagram.com/handle`.
- Link helpers reject unsafe protocols such as `javascript:`, `data:`, and `vbscript:` by allowing only `http(s)`, `mailto:`, `tel:`, and `maps:`.
- In the HTML app, contact rows use click and keyboard activation (`role="link"` + Enter/Space handling). Invalid links show an `alert`; blocked windows show a pop-up blocker warning.
- In the native fallback screen, `ContactLink` validates links before `Linking.openURL`; invalid or unsupported links show `Alert.alert`.

## Exam Details

Screen:

- `app/exam/[id].tsx`

Current behavior:

- The HTML app exam detail can open `applicationUrl` / başvuru links.
- Application links use the same web URL normalization as school websites: `https://` is added when missing and unsafe protocols are blocked.

- Shows school, score, dates, source, notes, grades, status, verification state.
- If `applicationUrl` exists, shows a CTA to open the application page.

## Google Play Readiness

Primary checklist:

- `docs/google-play-release.md`

Build profiles:

- `eas.json`

Commands:

```powershell
npm run android:preview
npm run android:production
npm run android:submit
```

Profiles:

- `preview`: internal APK build for device testing.
- `production`: Play Store `.aab` build.
- `submit.production`: internal track draft submit.

Before first upload:

- Confirm Android package id: `com.orchi35.bursradar`.
- Prepare privacy policy URL.
- Complete Data Safety form.
- Complete content rating.
- Prepare screenshots, app icon, feature graphic, short and long descriptions.

## Bot And Automation

Scripts:

- `npm run bot:scrape`
- `npm run bot:dry-run`
- `npm run bot:server`
- `npm run bot`

Files:

- `scripts/bot.mjs`
- `scripts/bot-server.mjs`
- `supabase/functions/run-bot/index.ts`

Key usage:

- `bot.mjs` uses the **anon key** (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) for reads only.
- Writes (INSERT to `exams`) require the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`).
- The edge function `run-bot` runs server-side and uses `SUPABASE_SERVICE_ROLE_KEY` from Supabase Secrets.
- Bot inserts rows with `is_verified=false`. Admin review required before they are shown to users.

Security:

- Local bot server binds to `127.0.0.1` by default.
- `POST /run-bot` on the local server is protected by `BOT_SERVER_TOKEN` if set.
- The edge function `run-bot` is protected by `SUPABASE_BOT_SECRET` if set (Bearer token in Authorization header).
- CORS origin on the local server defaults to `http://{host}:{port}` instead of wildcard.

## Security Model

### Supabase RLS

- `schools` and `exams`: public read-only with anon key. Approved `school_user` accounts can update only their own school/exam rows when an active `profile_management` or `featured_school` package exists; admin/service role remains the operational owner.
- `user_exam_marks`: full RLS. Each user can only read/write/delete their own rows via `auth.uid() = user_id`.
- `user_profiles`: each user can read their own role profile; admins can manage role mappings.
- `school_packages`: only the linked school user for that school or admin can read package status; only admin can approve/update packages.
- `package_requests`: linked school users can create requests only for their own school; requesters and admins can read them; only admin can update request status.
- `admin_approve_package_request`, `admin_reject_package_request`, and `admin_deactivate_school_package`: database functions check `app_user_role() = 'admin'` before changing request/package state.
- `202605013_super_admin_controls.sql` adds explicit admin `FOR ALL` policies for school rows, exam rows, package requests, and user plan marks; it also adds user restriction metadata, admin-only user profile email listing, manual package assignment, and package expiry updates.

### Key separation

| Key | Bundled in app | Used for |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | App reads (schools, exams) and auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Never | Bot writes (server-side only) |

### Auth hardening

- `returnTo` parameter in `app/auth.tsx` is validated to start with `/` to prevent open-redirect attacks.
- Error messages from Supabase auth are passed through to the user only in the auth screen. Supabase REST errors are not exposed to the UI.
- HTML-side Google OAuth uses a fixed redirect URL on web and the `bursradar://auth/callback` scheme on native.
- Native Google OAuth uses system browser handoff instead of keeping the Google login page inside WebView.

### Notification security

- Only local notifications are used. No remote push tokens are stored in Supabase.
- Notification IDs are stored in AsyncStorage with a `bursradar:exam-reminder:` prefix.

### Admin panel

- The active admin UI lives inside the HTML app and appears only for users whose `user_profiles.role` is `admin`.
- Admin users can review package requests, approve/reject requests, manage active packages, manually assign packages, change package expiry dates, view school profiles, and edit school profile fields from the school detail screen.
- `app/(tabs)/admin.tsx` still redirects to `/` because the Expo native tab is not the active admin surface for the HTML-first app.
- Operational database checks still live in Supabase RLS and admin-only RPCs; the HTML UI is only the visible control layer.

### Manual Supabase steps required for production

1. Register `SUPABASE_BOT_SECRET` in Supabase Dashboard → Project Settings → Edge Functions → Secrets.
2. Confirm that no INSERT/UPDATE/DELETE policies exist for `schools` and `exams` tables for the `anon` role.
3. Confirm `user_exam_marks` RLS is enabled (see `supabase/auth_user_exam_marks.sql`).
4. Run `supabase/migrations/202605011_school_packages.sql` before enabling school package UI in production.
5. Run `supabase/migrations/202605012_admin_package_approval.sql` to enable admin approval, rejection, active package creation, and package deactivation RPCs.
6. Run `supabase/migrations/202605013_super_admin_controls.sql` to enable super-admin school/exam management, manual package assignment, package expiry changes, and user restriction metadata.
7. Run `supabase/migrations/202605014_school_management_features.sql` to enable school logo storage and active-package exam creation.
8. Run `supabase/migrations/202605015_data_trust_system.sql` to enable admin-managed verification status, source, dates, and notes.
9. Run `supabase/migrations/202605016_school_profile_theme.sql` to add the school profile hero background color field.
10. Run `supabase/migrations/202605017_featured_theme_guard.sql` so only active `featured_school` school accounts can change their own profile theme color.
11. Run `supabase/migrations/202605018_admin_user_role_management.sql` so admins can find users by email and update `user_profiles.role` / `school_id` from the HTML Admin panel.
12. Run `supabase/migrations/202605019_realtime_publication.sql` so Supabase Realtime emits changes for schools, exams, packages, requests, roles, and plan marks.
13. Create `user_profiles` rows for school accounts and link each `school_user` to its own `school_id`, or use the admin role-management UI after `202605018`.
14. Create at least one `user_profiles` row with `role = 'admin'` for package approval.
15. Enable the Google provider and register the Google Client ID / Client Secret.
16. Add `http://localhost:8081/?auth=google`, `bursradar://auth/callback`, and the production `?auth=google` URL to Supabase Redirect URLs.
17. Optionally, restrict Edge Function invocation to authenticated callers only via Supabase dashboard.

## Developer Commands

Install dependencies:

```powershell
npm install
```

Start Expo:

```powershell
npm start
```

Start web:

```powershell
npm run web -- --port 8081
```

Typecheck:

```powershell
npm run typecheck
```

Expo Doctor:

```powershell
npm run doctor
```

Full check:

```powershell
npm run check
```

Web export check:

```powershell
npx expo export --platform web
```

## Quality Gates

Before committing or pushing meaningful changes, run:

```powershell
npm run check
npx expo export --platform web
```

For security/dependency checks:

```powershell
npm audit --omit=dev
```

Known note:

- `dist/`, `.expo/`, `.env.local`, `node_modules/`, and `.claude/` are ignored and should not be committed.

## Documentation Maintenance Rule

After every meaningful project change, update this file in the same change set.

Update the relevant section and add a dated entry to the Change Log. Examples of meaningful changes:

- New feature or user flow.
- Supabase schema or RLS change.
- Auth/session behavior change.
- Notification behavior change.
- Google Play/build configuration change.
- New environment variable.
- New script or operational command.
- Security or privacy behavior change.

## Change Log

### 2026-05-02 (safe clickable links)

- Audited the rewritten `public/bursradar/supabase-client.js` after the Claude rollback and restored compatibility with the HTML app contract: school logo fields map back to `profileImageUrl`, trust metadata returns the nested `trust` / `registrationTrust` shapes, profile/exam/package/admin helper parameter names match the current screens, package request email notification is invoked again, and Realtime refresh waits for data reload before bumping UI state.
- Restored the missing `notifyPackageRequest` Edge Function call after the `supabase-client.js` rewrite so new package requests send the Resend notification again.
- Fixed the school verification read/write mapping: `verification_status = official_verified` is now the source of truth for the green verified UI state, and admin verification updates also write `is_verified`, `verified_at`, `last_checked_at`, and `verified_by` so legacy profile badges stay in sync.
- Added an `Okuluma Git` CTA to the HTML Account screen for signed-in `school_user` profiles with a linked `school_id`; it opens the user's own school detail page and stays hidden for normal users/admins.
- Documented the link-safety work after the `public/bursradar/supabase-client.js` rewrite: school contact links and exam application links now normalize web, phone, and Instagram URLs before opening.
- HTML contact rows in `public/bursradar/screens.jsx` use safe protocol checks, click handling, keyboard activation, and user-facing alerts for invalid or blocked links.
- The native fallback school detail screen in `app/school/[id].tsx` uses `ContactLink`, `validateAndNormalize`, `Linking.canOpenURL`, and `Alert.alert` so phone, website, and Instagram links behave consistently with the HTML app.

### 2026-05-01 (school packages + role-based visibility)

- Added admin approval workflow for school package requests:
  `supabase/migrations/202605012_admin_package_approval.sql` adds request review fields,
  package update metadata, and admin-only RPCs for approve, reject, deactivate, and expire.
- Added HTML `Admin` tab for admin users with `Paket Talepleri` and `Aktif Paketler` sections.
  Pending requests are listed first and can be approved/rejected with an admin note.
- Changed package authority model so a request does not unlock features by itself. Features
  open only when admin approval creates an active `school_packages` row.
- Added school-account request state messaging for pending, approved, and rejected requests.
- Added a guarded school profile editing panel that appears only after an active management-capable package exists.
- Updated package request reads to alias the request note field and avoid Supabase embedded-select ambiguity; admin and school package request lists now collapse duplicate rows by school, package type, and status, keeping the latest request visible.
- Renamed admin approval RPC parameters from `note` to `admin_note_value` so admin notes remain optional and do not collide with the `package_requests.note` column.
- Added `202605013_super_admin_controls.sql` for the super-admin model: admin gets explicit `FOR ALL` database policies on the operational tables, can list user profiles with email through an admin-only RPC, manually assign packages, update package expiry, and restrict/unrestrict user profiles.
- Extended the HTML Admin tab with school list visibility, manual package assignment, package expiry updates, and admin school-profile editing from the school detail screen.
- Activated package-based UI controls without changing auth/RLS: active management packages expose profile image preview upload, profile editing, registration date fields, and a school-owned exam creation form; active featured packages use the featured card variant and UI-first list priority.
- Added `202605014_school_management_features.sql` and wired the UI to production paths: logos upload to Supabase Storage and save to `schools.logo_url`; school-created exams insert into `exams` as pending/unverified rows and can be removed from the same management panel. Admins use the same management panel with forced permission on every school profile.
- Added `202605015_data_trust_system.sql` and the HTML Veri Güven Sistemi admin UI. Admins can manage verification status, source, verified date, last checked date, and admin notes for school profile, registration dates, and each exam from the school detail admin panel. The public school-profile trust card is currently hidden from the user-facing profile view.
- Added `202605016_school_profile_theme.sql`, `202605017_featured_theme_guard.sql`, and a profile hero color picker. Only active `featured_school` school accounts can change their own profile header background color; admins can change the same field for every school through the existing admin school management flow.
- Matched featured school surfaces to the school profile theme: the home `Öne Çıkan Okullar` cover and featured school list cards now use the same `hero_color` and uploaded logo data as the school profile.
- Added `202605018_admin_user_role_management.sql` and an HTML Admin `Kullanıcı Rol Yönetimi` section. Admins can search a registered user by email, see current role/school mapping, and persist changes to `user_profiles.role` and `user_profiles.school_id`; the RPC blocks non-admin callers and prevents an admin from downgrading their own account.
- Added `202605019_realtime_publication.sql` and a centralized Supabase Realtime service in the HTML app. School/exam changes refresh shared data with debounce, while package/request/profile changes bump a realtime version so admin and school panels reload their existing fetches without a full app refresh.
- Added the school package request model for the HTML app: `Profil Yönetimi Paketi` at 1000 TL and `Öne Çıkan Okul Paketi` at 5000 TL.
- Added role-aware package visibility so normal users never see package cards, `school_user` accounts see them only on their own school profile, and admins see a compact package status panel.
- Removed the old public school-detail upsell from the active UI and replaced it with a guarded request flow that inserts `package_requests` instead of simulating payment.
- Added featured-school sorting and badge behavior based on `schools.is_premium`.
- Added `supabase/migrations/202605011_school_packages.sql` with `user_profiles`, `school_packages`, `package_requests`, helper functions, RLS policies, and premium-flag sync trigger.
- Extended `public/bursradar/supabase-client.js` and the HTML app auth object to load role profiles, read school packages, and create package requests with the signed-in Supabase session.
- Added `supabase/functions/package-request-notify/index.ts` so `school_user` package requests can send a server-side Resend email notification to `orcun@bursradar.info`; the function verifies school ownership, includes the requesting account email, and uses it as `Reply-To`.
- Updated the package request UI to surface email notification failures separately from package request insert failures.

### 2026-05-01 (HTML app shell + WebView auth)

- Reoriented the app around the existing HTML interface in `public/bursradar/`
  instead of replacing it with new native screens. `app/(tabs)/index.tsx` now
  mounts `components/BursRadarHtmlApp.tsx`, which renders the same
  `BursRadar.html` experience in an iframe on web and in `react-native-webview`
  on Android/iOS.
- Added `react-native-webview@13.15.0` and hid the Expo tab bar on all
  platforms. The visible bottom navigation now remains the HTML app's own
  navigation: Ana Sayfa, Sınavlar, Planım, Okullar, Hesap.
- Added an in-HTML `Hesap` section in `public/bursradar/screens.jsx` with
  email/password login, register, forgot password, Google login, signed-in
  account state, and sign-out.
- Added password confirmation to the in-HTML register form. Registration is
  blocked client-side when `Şifre` and `Şifre Doğrulama` do not match.
- Extended `public/bursradar/supabase-client.js` with Supabase Auth REST calls:
  password sign-in, sign-up, password recovery, sign-out, Google OAuth URL
  generation, OAuth hash session parsing, and access-token user decoding.
- Added Google OAuth UX with a real Google SVG icon and a short institutional
  login subtitle: "Hesabınıza erişmek için oturum açın."
- Added native-safe Google OAuth handoff: WebView posts OAuth requests to
  React Native, `expo-web-browser` opens the system browser, and the result
  returns via `bursradar://auth/callback` before being injected back into the
  HTML app session.
- Added `EXPO_PUBLIC_BURSRADAR_WEB_URL` to `.env.example` for production
  native builds that should load the hosted HTML app outside the local dev
  server.
- Kept `/auth` and `/account` compatibility routes from the earlier native
  auth separation work, but the primary user-facing auth surface is now the
  HTML app's `Hesap` tab.
- Validation: `npm run check` passed after pinning `react-native-webview` to
  the Expo SDK expected version.

### 2026-04-30 (security audit)

- **CRITICAL fix**: `utils/notifications.ts` was importing `getExam`/`getSchool`
  from `data/mock.ts` — functions that were removed in the data-layer refactor.
  This caused a runtime crash on any notification operation. Fixed by changing
  the API: `scheduleExamReminder(examId)` → `scheduleExamReminder(exam, schoolName?)`,
  `syncExamReminders(ids)` → `syncExamReminders(entries)`. Callers in `AppContext`
  now look up exam/school via `useData()` before calling notification helpers.
- **CRITICAL fix**: `supabase/functions/run-bot/index.ts` accepted any anonymous
  POST request. Added `SUPABASE_BOT_SECRET` Bearer token check — the function
  returns 401 if the header does not match when the secret is configured.
  Internal error details no longer leak in the 500 response body.
- **HIGH fix**: `scripts/bot.mjs` was using the public anon key for INSERT
  operations, which RLS would silently block. Bot now requires
  `SUPABASE_SERVICE_ROLE_KEY` for writes. Reads continue to use the anon key.
  Dry-run mode is allowed without the service key. Hard exit if service key is
  missing and not in dry-run.
- **MEDIUM fix**: `scripts/bot-server.mjs` `/run-bot` endpoint had no auth.
  Added optional `BOT_SERVER_TOKEN` Bearer check. CORS origin changed from
  wildcard `*` to `http://{host}:{port}` (configurable via `BOT_CORS_ORIGIN`).
- **MEDIUM fix**: `.env.example` now documents `SUPABASE_SERVICE_ROLE_KEY`,
  `BOT_SERVER_TOKEN`, and `SUPABASE_BOT_SECRET` with usage notes.
- Added Security Model section to documentation covering RLS, key separation,
  auth hardening, notification security, admin panel, and manual Supabase steps.

### 2026-04-30 (data layer + navigation + auth)

- Added `services/dataService.ts` and `context/DataContext.tsx` to fetch
  schools/exams from Supabase at runtime, with mock data as a graceful
  fallback. Column names from `schema.sql` are mapped to the existing
  TypeScript types so screens did not need to change shape.
- Wired `DataProvider` into `app/_layout.tsx`. All screens and shared
  cards (`ExamCard`, `SchoolCard`, exam/school detail screens, exams list,
  schools list, plan, home) now read data through `useData()` instead of
  importing arrays from `data/mock.ts`. Mock imports are limited to
  `GRADES` and `IZMIR_DISTRICTS` static UI lists. The unused `getSchool`,
  `getExam`, `getExamsBySchool` helpers were removed from `data/mock.ts`.
- Bottom tab navigation enabled on native: `app/(tabs)/_layout.tsx` now
  shows a tab bar with FontAwesome icons for Ana Sayfa, Sınavlar, Okullar,
  Planım. The `admin` route is hidden from the tab bar. Web continues to
  hide the tab bar to preserve the iframe home prototype.
- `AuthContext.signUp` now returns `{ session }`. `app/auth.tsx` redirects
  to `returnTo` when sign-up returns an active session (email confirmation
  disabled), and otherwise asks the user to verify their email.
- Removed orphan test `components/__tests__/StyledText-test.js` referring
  to a deleted component.

### 2026-04-30 (refactor)

- Removed unused Expo template files: `app/modal.tsx`, `components/EditScreenInfo.tsx`,
  `components/StyledText.tsx`, `components/Themed.tsx`, `components/ExternalLink.tsx`,
  `components/useColorScheme.ts(.web.ts)`, `components/useClientOnlyValue.ts(.web.ts)`,
  `constants/Colors.ts`. None of these were used by the production app and they
  produced TypeScript alias errors.
- Rewrote `app/+not-found.tsx` to depend on the project's own theme system
  (`constants/theme.ts`) instead of the deleted `Themed.tsx`. Localized to Turkish.
- `context/AppContext.tsx`: wrapped `toggleFavorite` and `toggleReminder` in
  `useCallback`, and the Provider value in `useMemo`, to avoid unnecessary
  re-renders of `ExamCard` and `SchoolCard` consumers.
- `utils/notifications.ts`: `syncExamReminders` now schedules reminders in
  parallel via `Promise.all` instead of a sequential `for` loop.
- `components/ui/SelectSheet.tsx`: replaced raw `x` close button with the
  FontAwesome `times` icon and added `accessibilityLabel`.
- `app/exam/[id].tsx`: extended `sourceLabel` to support all bot source types
  (instagram, facebook, twitter, phone, email, manual) instead of falling back
  to the raw key.
- Moved `schoolInitials` from `utils/date.ts` to a new `utils/format.ts`.
  Updated `components/ui/SchoolLogo.tsx` import accordingly. `utils/date.ts`
  now contains only date helpers.
- Renamed the home component `BursRadarDesignScreen` to `HomeScreen` in
  `app/(tabs)/index.tsx` for clarity.

### 2026-04-30

- Added project documentation and documentation maintenance rule.
- Added Google Play release structure: Android package id, EAS profiles, Play Store checklist.
- Added Supabase authentication with persisted sessions.
- Added protected `Planım` flow.
- Added user-specific favorite/reminder persistence through `user_exam_marks` with RLS.
- Added local reminder notification scheduling with `expo-notifications`.
- Added clickable school profile contact links for phone, website, and Instagram.
- Added mobile/native home dashboard while preserving web iframe prototype.
- Added developer health scripts: `typecheck`, `doctor`, `check`.
