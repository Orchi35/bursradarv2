# BursRadar Project Documentation

Last updated: 2026-04-30

## Purpose

BursRadar is an Expo / React Native app for tracking private school scholarship exams, school registration periods, and user-specific exam plans. The app currently supports web preview, Android preparation for Google Play, Supabase authentication, user favorites, reminders, and local notification scheduling.

## Tech Stack

- Expo SDK 54
- Expo Router 6
- React 19
- React Native 0.81
- TypeScript
- Supabase Auth and REST API
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
- `app/(tabs)/`: Main app sections: home, exams, schools, plan.
- `app/auth.tsx`: Login and sign-up screen.
- `app/exam/[id].tsx`: Exam detail screen.
- `app/school/[id].tsx`: School profile/detail screen.
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
- `public/bursradar/`: Web prototype assets.

## Environment Variables

Example file: `.env.example`

Required local file: `.env.local`

### Mobile app (bundled into binary — use `EXPO_PUBLIC_` prefix)

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

### Bot / server-side (never bundled — no `EXPO_PUBLIC_` prefix)

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BOT_SERVER_TOKEN=random-secret-for-local-bot-server
SUPABASE_BOT_SECRET=random-secret-for-edge-function
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

## Supabase

The app uses Supabase for authentication and user-specific plan data.

### Auth

Implemented in:

- `utils/supabaseClient.ts`
- `context/AuthContext.tsx`
- `app/auth.tsx`

Behavior:

- Email/password sign up and sign in.
- Session persistence through AsyncStorage.
- SSR/static-render safe storage adapter for Expo web export.
- `Planım` is protected and requires login.

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

## Authentication Flow

1. User opens `Planım`.
2. If not logged in, app shows a protected-state card and CTA.
3. CTA routes to `/auth?returnTo=/plan`.
4. User signs in or signs up.
5. On sign-in success, app returns to `returnTo`.
6. On sign-up success, app returns to `returnTo` if a session was created
   (email confirmation disabled). If email confirmation is enabled, a
   message is shown asking the user to verify the email and sign in.
7. Favorites/reminders load from Supabase.
8. User can sign out from `Planım`.

Tested with a manually created Supabase Auth user.

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

- Tab navigation is implemented in `app/(tabs)/_layout.tsx`.
- Native (iOS/Android): visible bottom tab bar with FontAwesome icons for
  Ana Sayfa, Sınavlar, Okullar, Planım. The `admin` tab is hidden via
  `{ href: null }`.
- Web: tab bar is hidden (`tabBarStyle: { display: 'none' }`) because
  the home screen renders the `BursRadar.html` prototype as an iframe.

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
- Phone, website, and Instagram rows are clickable links.
- Phone uses `tel:`.
- Website auto-adds `https://` when needed.
- Instagram converts `@handle` to `https://www.instagram.com/handle`.

## Exam Details

Screen:

- `app/exam/[id].tsx`

Current behavior:

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

- `schools` and `exams`: public read-only with anon key. No write policies for anon or authenticated users. Only the service role (Dashboard / edge function) can write.
- `user_exam_marks`: full RLS. Each user can only read/write/delete their own rows via `auth.uid() = user_id`.

### Key separation

| Key | Bundled in app | Used for |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | App reads (schools, exams) and auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Never | Bot writes (server-side only) |

### Auth hardening

- `returnTo` parameter in `app/auth.tsx` is validated to start with `/` to prevent open-redirect attacks.
- Error messages from Supabase auth are passed through to the user only in the auth screen. Supabase REST errors are not exposed to the UI.

### Notification security

- Only local notifications are used. No remote push tokens are stored in Supabase.
- Notification IDs are stored in AsyncStorage with a `bursradar:exam-reminder:` prefix.

### Admin panel

- `app/(tabs)/admin.tsx` simply redirects to `/`. There is no admin UI in the mobile app.
- Admin operations (approving bot-found exams, editing school data) are performed through the Supabase Dashboard with a service role session.

### Manual Supabase steps required for production

1. Register `SUPABASE_BOT_SECRET` in Supabase Dashboard → Project Settings → Edge Functions → Secrets.
2. Confirm that no INSERT/UPDATE/DELETE policies exist for `schools` and `exams` tables for the `anon` role.
3. Confirm `user_exam_marks` RLS is enabled (see `supabase/auth_user_exam_marks.sql`).
4. Optionally, restrict Edge Function invocation to authenticated callers only via Supabase dashboard.

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
