# @m2ie/onboarding-sdk

An embeddable onboarding SDK for configurable product tours. It loads the
published scenario for the current page, finds the target DOM element by CSS
selector, renders a spotlight and tooltip, and reports progress to the backend.

## Installation

After publication, install the package from the public npm registry. The SDK
supports React 18.2 and React 19.

```bash
npm install @m2ie/onboarding-sdk
```

The package includes its public React API and isolated widget styles. Styles are
injected automatically when the provider renders for the first time.

## Basic React setup

Create the HTTP client once, outside the React component. Creating it during
each render would cause the provider to request the configuration repeatedly.

```tsx
import { createHttpOnboardingClient } from '@m2ie/onboarding-sdk'
import { OnboardingProvider } from '@m2ie/onboarding-sdk/react'

const onboardingClient = createHttpOnboardingClient({
  apiBaseUrl: 'https://onboarding-api.example.com',
})

export function App() {
  return (
    <>
      <ApplicationRoutes />

      <OnboardingProvider
        apiClient={onboardingClient}
        projectKey="classified-production"
      />
    </>
  )
}
```

Place the provider inside the React application, after its primary providers.
The target elements must exist in the DOM when their onboarding steps are
displayed.

## React Router integration

For an SPA, pass the current path and navigation function explicitly. This lets
the SDK request the scenario for the new URL without reloading the document.

```tsx
import { createHttpOnboardingClient } from '@m2ie/onboarding-sdk'
import { OnboardingProvider } from '@m2ie/onboarding-sdk/react'
import { useLocation, useNavigate } from 'react-router-dom'

const onboardingClient = createHttpOnboardingClient({
  apiBaseUrl: import.meta.env.VITE_ONBOARDING_API_URL,
})

export function OnboardingIntegration() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()

  return (
    <OnboardingProvider
      apiClient={onboardingClient}
      navigate={navigate}
      pageUrl={location.pathname}
      projectKey="classified-production"
      userId={currentUser?.id}
    />
  )
}
```

`OnboardingIntegration` must be rendered inside the router so `useLocation` and
`useNavigate` are available.

## Provider props

| Prop | Required | Type | Description |
| --- | --- | --- | --- |
| `projectKey` | Yes | `string` | Stable project key from the onboarding platform. The backend uses it to isolate scenarios belonging to different applications. |
| `apiClient` | Yes | `OnboardingApiClient` | Client used to load configuration and report analytics events. Usually created with `createHttpOnboardingClient`. |
| `pageUrl` | No | `string` | Current page path. Defaults to `window.location.pathname`. SPA integrations should pass the router location explicitly. |
| `navigate` | No | `(url: string) => void` | Client-side navigation adapter. Without it, cross-page steps use `window.location.assign` and reload the document. |
| `userId` | No | `string` | Stable pseudonymous identifier from the host application's authentication system. Omit it for anonymous users. |
| `enabled` | No | `boolean` | Enables configuration loading and widget rendering. Defaults to `true`; it can be connected to a feature flag or audience rule. |
| `refreshKey` | No | `number` | Changing the value forces the provider to request its configuration again. Most integrations do not need it. |

### Providing `userId`

The host application supplies `userId` from its authentication system. The SDK
does not create a user identifier and should not receive an email address,
phone number, or other personal data. Keep the value stable between pages, or
omit it for anonymous onboarding.

The SDK creates a separate `sessionId`, stores it in `sessionStorage`, and
includes it in requests and analytics events. Do not pass `sessionId` to the
provider.

## Stable target selectors

Each scenario step contains a CSS selector for its target element. Prefer
dedicated attributes that do not depend on visual classes or text content.

```tsx
<button data-onboarding-id="create-listing" type="button">
  Post a listing
</button>
```

Use the following selector in the step editor:

```text
[data-onboarding-id="create-listing"]
```

Avoid generated CSS classes, long descendant chains, and `nth-child`. These
selectors are likely to break after layout changes.

## Built-in HTTP client contract

`createHttpOnboardingClient` makes two requests:

```text
GET  {apiBaseUrl}/widget/scenario?projectKey=...&pageUrl=...
POST {apiBaseUrl}/widget/event
```

The GET request includes `projectKey` and the exact `pageUrl`. The POST request
sends `step_viewed`, `step_completed`, or `scenario_dismissed` using the MVP API
fields `session_id`, `type`, `step_id`/`scenario_id`, and `event_key`.

A `204` or `404` response while loading configuration means that no onboarding
scenario is available for the page, so the widget remains hidden. Other errors
are surfaced and never replaced with mock data.

If the host application uses a different API contract, provide an adapter:

```tsx
import type { OnboardingApiClient } from '@m2ie/onboarding-sdk'

const apiClient: OnboardingApiClient = {
  async getConfig(request) {
    return hostApi.getOnboardingScenario(request)
  },
  async trackEvent(event) {
    await hostApi.sendOnboardingEvent(event)
  },
}
```

Keep the `apiClient` reference stable between renders.

## Controlling eligibility

The backend can determine eligibility by returning either a scenario or `404`.
The host application can also disable the SDK locally.

```tsx
<OnboardingProvider
  apiClient={onboardingClient}
  enabled={featureFlags.onboarding && currentUser?.isNew === true}
  projectKey="classified-production"
/>
```

Keep audience checks and business eligibility rules outside the SDK.

## Styles and infrastructure

The API must allow requests from the host application's domain through CORS.
The host application's CSP must also allow connections to `apiBaseUrl`.

The SDK injects one stylesheet into `document.head`. All selectors use the
`.onboarding-sdk` prefix. The widget does not depend on Radix, the admin UI
package, or global CSS variables from the host application.

## Non-React applications

An imperative API is available for applications without a React integration.

```ts
import { initOnboarding } from '@m2ie/onboarding-sdk'

const onboarding = initOnboarding({
  apiBaseUrl: 'https://onboarding-api.example.com',
  projectKey: 'classified-production',
})

onboarding.refresh()
onboarding.destroy()
```

## License

This package is currently `UNLICENSED`.
