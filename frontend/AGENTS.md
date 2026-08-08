# AGENTS.md

This file is the operating guide for Codex agents working in `frontend/`.
Read it before changing code. Keep all work scoped to `frontend/` unless the
user explicitly asks otherwise.

## Product Context

We are building an interactive onboarding platform for a classifieds flow.
The frontend must demonstrate three connected surfaces:

- Admin panel for creating, editing, publishing and analyzing onboarding scenarios.
- Test classifieds site under `/demo/*`.
- Embeddable onboarding SDK/widget that can be connected to a host web app.

The widget is universal. Admin-created scenario configs are dynamic. Do not
hardcode final onboarding behavior directly into demo UI components.

## Required Stack

- React 19
- Redux + Redux Toolkit
- Vite
- TypeScript
- Jest + React Testing Library

If a required part of the stack is missing, add it deliberately and wire it into
the workspace scripts. Do not introduce a parallel state or test tool without a
clear reason and user approval.

## Repository Architecture

This frontend uses npm workspaces:

```text
frontend/
├── apps/
│   └── web/
├── packages/
│   ├── onboarding-sdk/
│   ├── shared/
│   └── ui/
├── package.json
└── tsconfig.base.json
```

### `apps/web`

`apps/web` is the deployable React app. It must follow Feature-Sliced Design:

```text
apps/web/src/
├── app/       # app providers, store setup, routing, global composition
├── pages/     # route-level screens only
├── widgets/   # large page sections composed from features/entities/shared
├── features/  # user actions and business use cases
├── entities/  # domain models and entity-specific UI/model code
└── shared/    # reusable infrastructure with no business knowledge
```

Layer import rule:

- `app` can import any lower layer.
- `pages` can import `widgets`, `features`, `entities`, `shared`.
- `widgets` can import `features`, `entities`, `shared`.
- `features` can import `entities`, `shared`.
- `entities` can import `shared`.
- `shared` must not import higher layers.

Keep route components thin. A page should compose widgets/features and delegate
logic to hooks or model files.

### `packages/onboarding-sdk`

The SDK is a reusable package, not an FSD app. Keep it library-shaped:

```text
packages/onboarding-sdk/src/
├── api/
├── core/
├── dom/
├── react/
├── types/
└── ui/
```

The SDK must not import from `apps/web`. Shared contracts belong in
`packages/shared`.

### `packages/shared`

Put cross-package types, DTOs, discriminated unions, API contracts and pure
helpers here. Do not put browser-only logic here unless the package contract is
explicitly browser-only.

### `packages/ui`

Put reusable visual primitives here: buttons, badges, panels, inputs, form
controls, empty states and other UI that does not know onboarding business
rules.

Admin controls wrap Radix primitives in this package instead of importing Radix
directly throughout `apps/web`. Use Lucide icons for familiar interface actions.
Do not make `packages/onboarding-sdk` depend on Radix or `packages/ui`; the
embeddable widget must remain lightweight and isolated from the host app's UI
stack.

## State Management

Use Redux Toolkit for application state in `apps/web`:

- Create the store in `apps/web/src/app/store`.
- Use typed hooks such as `useAppDispatch` and `useAppSelector`.
- Model scenario editing, publication, analytics and async API calls in slices
  or RTK async thunks.
- Keep local `useState` only for truly local UI state, for example one open menu
  or temporary input focus. Do not use local component state as the main source
  of truth for scenarios, events, server responses or workflow status.

The SDK package can keep small internal React state for widget runtime, but
business state and persisted scenario/event data must live behind API clients or
shared contracts.

## UI And Business Logic Separation

All non-trivial components must separate presentation from behavior:

- UI component: receives props, renders markup, emits callbacks.
- Custom hook: owns state selection, derived data, commands and side effects.
- Model/helpers: pure transformations, reducers, validators and mappers.

Preferred shape:

```text
features/scenario-editor/
├── model/
│   ├── scenarioEditorSlice.ts
│   ├── selectors.ts
│   └── types.ts
├── hooks/
│   └── useScenarioEditor.ts
├── ui/
│   ├── ScenarioEditor.tsx
│   └── StepForm.tsx
└── index.ts
```

Avoid large files that mix storage, routing, event handlers, rendering and
derived analytics in one component. If a component starts needing multiple
handlers, derived arrays, API calls or workflow rules, extract a hook before
adding more logic.

## Async And UI State Modeling

Model request and workflow states with discriminated unions. Do not scatter
boolean flags like `isLoading`, `isSaving`, `hasError`, `isSuccess` when those
flags can contradict each other.

Use this pattern:

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

For richer flows, each state variant owns the fields that are valid only in
that state:

```ts
type PublishScenarioState =
  | { status: 'idle' }
  | { status: 'publishing'; scenarioId: string }
  | { status: 'published'; scenarioId: string; versionId: string }
  | { status: 'failed'; scenarioId: string; error: string }
```

Render with exhaustive checks. When adding new statuses, update all rendering
branches and tests.

## Shared Patterns

Create reusable patterns early instead of copying local solutions:

```text
apps/web/src/shared/
├── api/       # API clients, adapters, transport helpers
├── config/    # env/config constants
├── hooks/     # app-wide reusable hooks
├── lib/       # pure utilities
└── ui/        # app-only UI primitives, if not generic enough for packages/ui
```

Examples:

- `shared/lib/asyncState.ts` for common async/discriminated-union helpers.
- `shared/hooks/useStableEvent.ts` or `useLatest.ts` for callback refs.
- `shared/api/createApiClient.ts` for fetch conventions and error mapping.
- `shared/lib/storage.ts` for localStorage schema/version wrappers.

Before creating a new helper, search for an existing one. Before copying a
helper, extract or generalize the pattern.

## Testing Standard

Tests are part of development quality, not a metric to fill at the end.

Use Jest + React Testing Library:

- Test reducers/selectors and pure helpers near their model files.
- Test custom hooks for state transitions and commands.
- Test UI components through user-visible behavior, not implementation details.
- Test SDK target lookup, event tracking, step transitions, target-not-found
  behavior and cross-page handoff.
- Test admin editing/publishing flows before broad visual polish.

Prefer a small useful test added with the feature over a large brittle snapshot
added later. Do not add tests that only assert that a component renders without
checking meaningful behavior.

Suggested file pattern:

```text
*.test.ts
*.test.tsx
```

Useful examples:

- Scenario editor changes a step title and marks the scenario as draft.
- Publish action creates a new version id and updates step `versionId`.
- Widget emits `step_viewed`, then `step_completed`, then
  `scenario_completed`.
- Widget emits `target_not_found` when selector does not match any element.
- Analytics funnel counts views and completions per step.

## Routing

Current routes:

```text
/
/admin
/admin/analytics
/demo/profile
/demo/new
/demo/new/transport
/demo/new/auto
```

`apps/web` uses React Router at the app boundary. Keep route state explicit and
testable. Do not duplicate route constants across pages and scenario configs;
keep them in `shared/config/routes.ts`.

One published scenario belongs to one page URL. The scenario owns its `url`;
steps inherit that page and must not duplicate `pagePath` or `pageId`. A larger
user journey can group page-local scenarios with `flowKey` and `flowOrder`.

## SDK Contract

Public integration shape:

```ts
import { initOnboarding } from '@interactive-onboarding/onboarding-sdk'

initOnboarding({
  projectKey: 'avito-demo',
  apiBaseUrl: 'https://api.example.com',
})
```

React integration shape:

```tsx
import { OnboardingProvider } from '@interactive-onboarding/onboarding-sdk/react'

<OnboardingProvider
  apiClient={apiClient}
  navigate={routerNavigate}
  pageUrl={location.pathname}
  projectKey="avito-demo"
/>
```

The SDK should:

- Read page URL/context.
- Request published config from an API client.
- Find DOM targets by stable selectors, preferably `data-onboarding-id`.
- Render overlay, spotlight and tooltip.
- Scroll offscreen targets into view.
- Accept an optional host `navigate(url)` adapter. React SPA hosts pass their
  router navigation function; plain sites rely on the SDK fallback to
  `window.location.assign`.
- Emit analytics events with `sessionId`, `versionId`, optional `stepId` and
  stable event keys.

Do not make the SDK depend on the demo classifieds implementation.

## Current Compliance Snapshot

Validated on 2026-08-07:

- Monorepo workspaces exist under `apps/*` and `packages/*`.
- `apps/web` follows the intended FSD direction: route pages are thin, scenario
  editing lives in `features/scenario-editor`, analytics lives in
  `features/scenario-analytics`, shared browser/storage helpers live under
  `shared/hooks` and `shared/lib`.
- Redux Toolkit is wired in `apps/web/src/app/store`. Scenario editor state,
  selected scenario/step and publish workflow are modeled in a slice.
- Jest + React Testing Library are wired at the workspace root. Existing tests
  cover scenario publication/versioning, analytics aggregation and fixed SDK
  button labels.
- SDK is split into `packages/onboarding-sdk` and does not import from
  `apps/web`.
- Admin primitives wrap Radix UI in `packages/ui`; Lucide provides action icons.
  The SDK remains independent from both dependencies.
- Shared domain contracts exist in `packages/shared`; unsupported custom widget
  button-label fields are not part of `OnboardingStep`.
- Mock persistence is behind `shared/lib/storage` and `shared/api`, not direct
  `localStorage` calls in presentational UI.
- Workflow/report states use discriminated unions (`ScenarioEditorWorkflow`,
  `AsyncState<T>`) instead of contradictory boolean flag sets.
- Scenario URL is edited as free text in the admin constructor and stored once
  on the scenario. The mock widget API resolves a published page-local scenario
  by `projectKey + pageUrl`.
- Demo navigation uses React Router without document reloads. The SDK delegates
  cross-page transitions to the host navigation adapter and keeps a full-page
  fallback for non-SPA integrations.

Treat regressions from this snapshot as architectural debt to fix before
expanding product surface area.

Important SDK/product constraint:

- The widget action buttons are fixed: `назад`, `пропустить`, `далее`.
- Do not add button label editing back into the admin constructor unless the SDK
  public contract is intentionally expanded and tested in the same change.

## Required Checks

Before handing off frontend changes, run:

```bash
npm run typecheck
npm run lint
npm run build
```

When tests are added, also run:

```bash
npm test
```

If a rendered UI flow changes, verify it in the browser:

- `/admin`
- `/admin/analytics`
- `/demo/profile`
- the onboarding path through `/demo/new`, `/demo/new/transport`, and
  `/demo/new/auto`

Check desktop and at least one mobile viewport for overlay positioning,
horizontal overflow, hidden targets and console errors.

## Coding Rules

- Keep TypeScript strict and avoid `any`.
- Prefer pure functions for transformations and analytics calculations.
- Keep side effects in hooks, thunks, API clients or SDK runtime boundaries.
- Do not read from `window` or `localStorage` directly inside presentational UI.
- Keep localStorage usage behind an adapter while the backend is mocked.
- Keep CSS reusable and avoid one-off class growth when a UI primitive exists.
- Remove unused starter assets and dead files when they are no longer needed.
- Update this file when architecture decisions change.
