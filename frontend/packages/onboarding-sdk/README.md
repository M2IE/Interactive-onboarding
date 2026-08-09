# Onboarding SDK: подключение к React

SDK загружает опубликованный сценарий для текущей страницы, находит целевой
DOM-элемент по CSS-селектору, показывает spotlight и подсказку, а затем отправляет
события прохождения на бэкенд.

## Текущий статус пакета

Сейчас `@interactive-onboarding/onboarding-sdk` является приватным пакетом npm
workspace внутри этого monorepo. Приложения в `frontend/apps/*` подключают его как
обычную workspace-зависимость:

```json
{
  "dependencies": {
    "@interactive-onboarding/onboarding-sdk": "*"
  }
}
```

Для установки в отдельный репозиторий пакет сначала нужно опубликовать во
внутреннем npm registry или подготовить самостоятельный дистрибутив. Публичный
React API и изолированные стили виджета уже входят в пакет; стили подключаются
автоматически при первом рендере Provider.

## Базовое подключение

Создавайте HTTP-клиент один раз за пределами React-компонента. Если создавать
его при каждом рендере, Provider будет повторно запрашивать конфигурацию.

```tsx
import { createHttpOnboardingClient } from '@interactive-onboarding/onboarding-sdk'
import { OnboardingProvider } from '@interactive-onboarding/onboarding-sdk/react'

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

Provider нужно разместить внутри React-приложения после подключения основных
провайдеров. Целевые элементы страницы должны существовать в DOM к моменту
показа шага.

## Подключение к React Router

Для SPA рекомендуется явно передавать текущий путь и функцию навигации. Тогда
при переходе между страницами документ не перезагружается, а SDK запрашивает
сценарий нового URL.

```tsx
import { createHttpOnboardingClient } from '@interactive-onboarding/onboarding-sdk'
import { OnboardingProvider } from '@interactive-onboarding/onboarding-sdk/react'
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

`OnboardingIntegration` должен находиться внутри Router, чтобы `useLocation` и
`useNavigate` были доступны.

## Пропсы Provider

| Проп | Обязателен | Тип | Назначение |
| --- | --- | --- | --- |
| `projectKey` | Да | `string` | Стабильный ключ проекта из onboarding-платформы. По нему бэкенд отделяет сценарии разных приложений. |
| `apiClient` | Да | `OnboardingApiClient` | Клиент получения конфигурации и отправки аналитических событий. Обычно создаётся через `createHttpOnboardingClient`. |
| `pageUrl` | Нет | `string` | Текущий путь страницы. По умолчанию используется `window.location.pathname`. Для SPA рекомендуется передавать значение из роутера. |
| `navigate` | Нет | `(url: string) => void` | Адаптер клиентской навигации. Без него межстраничный шаг использует `window.location.assign` и перезагружает документ. |
| `userId` | Нет | `string` | Стабильный обезличенный ID авторизованного пользователя из системы хоста. Для анонимного пользователя проп нужно опустить. |
| `enabled` | Нет | `boolean` | Разрешает загрузку и показ онбординга. По умолчанию `true`. Можно связать с feature flag или правилом аудитории. |
| `refreshKey` | Нет | `number` | При изменении значения принудительно запрашивает конфигурацию заново. Обычно не требуется. |

### Откуда брать `userId`

`userId` передаёт само приложение из своей системы авторизации. SDK не создаёт
ID пользователя и не должен получать email, телефон или другие персональные
данные. Значение должно быть стабильным между страницами, но его можно не
передавать для анонимного прохождения.

SDK самостоятельно создаёт отдельный `sessionId`, сохраняет его в
`sessionStorage` и прикладывает к запросам и событиям. Передавать `sessionId` в
Provider не нужно.

## Стабильные селекторы элементов

Шаг сценария содержит CSS-селектор целевого элемента. Для интеграции лучше
добавлять специальные атрибуты, не зависящие от CSS-классов и текста:

```tsx
<button data-onboarding-id="create-listing" type="button">
  Разместить объявление
</button>
```

В конструкторе шага указывается:

```text
[data-onboarding-id="create-listing"]
```

Не рекомендуется использовать сгенерированные CSS-классы, длинные цепочки
вложенности или `nth-child`: такие селекторы легко ломаются после изменения
вёрстки.

## HTTP-контракт встроенного клиента

`createHttpOnboardingClient` выполняет два запроса:

```text
GET  {apiBaseUrl}/widget/scenario?projectKey=...&pageUrl=...
POST {apiBaseUrl}/widget/event
```

В GET-запрос передаются `projectKey` и точный `pageUrl`. POST отправляет
`step_viewed`, `step_completed` или `scenario_dismissed` в формате MVP API с
полями `session_id`, `type`, `step_id`/`scenario_id` и `event_key`. Ответ `204`
или `404` на получение конфигурации означает, что для страницы нет доступного
сценария, и виджет не показывается. Остальные ошибки не подменяются mock-данными.

Если API приложения имеет другой контракт, можно реализовать адаптер:

```tsx
import type { OnboardingApiClient } from '@interactive-onboarding/onboarding-sdk'

const apiClient: OnboardingApiClient = {
  async getConfig(request) {
    return hostApi.getOnboardingScenario(request)
  },
  async trackEvent(event) {
    await hostApi.sendOnboardingEvent(event)
  },
}
```

Ссылку на `apiClient` также нужно сохранять стабильной между рендерами.

## Управление показом

Решение о доступности онбординга может принимать бэкенд, возвращая сценарий или
`404`. Хост-приложение также может отключить SDK локально:

```tsx
<OnboardingProvider
  apiClient={onboardingClient}
  enabled={featureFlags.onboarding && currentUser?.isNew === true}
  projectKey="classified-production"
/>
```

Проверки аудитории и бизнес-правила не следует зашивать внутрь SDK.

## Стили и инфраструктура

Для работы HTTP-клиента API должен разрешать запросы с домена приложения через
CORS. CSP хоста также должна разрешать соединение с `apiBaseUrl`.

SDK один раз добавляет в `document.head` собственный stylesheet с префиксом
`.onboarding-sdk`. Он не зависит от Radix, UI-пакета админки или глобальных CSS
переменных хост-приложения.

## Приложения без React

Для сайта без React-обвязки доступен императивный API:

```ts
import { initOnboarding } from '@interactive-onboarding/onboarding-sdk'

const onboarding = initOnboarding({
  apiBaseUrl: 'https://onboarding-api.example.com',
  projectKey: 'classified-production',
})

onboarding.refresh()
onboarding.destroy()
```
