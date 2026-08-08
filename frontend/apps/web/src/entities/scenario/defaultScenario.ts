import type { OnboardingScenario } from '@interactive-onboarding/shared'
import { appRoutes } from '@/shared/config/routes'

const now = '2026-08-04T10:00:00.000Z'

const commonScenario = {
  projectId: 'project-avito-demo',
  projectKey: 'avito-demo',
  flowKey: 'first-listing',
  status: 'published' as const,
  version: 3,
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
}

export const defaultScenarios: OnboardingScenario[] = [
  {
    ...commonScenario,
    id: 'scenario-first-listing-profile',
    flowOrder: 1,
    name: 'Первое объявление: профиль',
    description: 'Точка входа после регистрации нового пользователя.',
    url: appRoutes.demo.profile,
    versionId: 'scenario-first-listing-profile-v3',
    steps: [
      {
        id: 'step-profile-create',
        versionId: 'scenario-first-listing-profile-v3',
        order: 1,
        selector: '[data-onboarding-id="profile-create-button"]',
        title: 'Начните с первого объявления',
        body: 'После регистрации профиль пустой. Самый короткий путь к продаже начинается с кнопки размещения.',
        placement: 'top',
        completion: 'navigate',
        nextUrl: appRoutes.demo.newListing,
      },
    ],
  },
  {
    ...commonScenario,
    id: 'scenario-first-listing-category',
    flowOrder: 2,
    name: 'Первое объявление: категория',
    description: 'Выбор верхнеуровневой категории объявления.',
    url: appRoutes.demo.newListing,
    versionId: 'scenario-first-listing-category-v3',
    steps: [
      {
        id: 'step-category-transport',
        versionId: 'scenario-first-listing-category-v3',
        order: 1,
        selector: '[data-onboarding-id="category-transport"]',
        title: 'Выберите транспорт',
        body: 'В транспорте важны дополнительные данные: тип, состояние, фото, VIN и пробег. Поэтому путь здесь подробнее.',
        placement: 'right',
        completion: 'navigate',
        nextUrl: appRoutes.demo.transport,
      },
    ],
  },
  {
    ...commonScenario,
    id: 'scenario-first-listing-transport',
    flowOrder: 3,
    name: 'Первое объявление: тип транспорта',
    description: 'Уточнение типа транспорта и состояния автомобиля.',
    url: appRoutes.demo.transport,
    versionId: 'scenario-first-listing-transport-v3',
    steps: [
      {
        id: 'step-transport-used',
        versionId: 'scenario-first-listing-transport-v3',
        order: 1,
        selector: '[data-onboarding-id="transport-used-car"]',
        title: 'Уточните тип объявления',
        body: 'Для автомобиля с пробегом откроется форма с данными, которые помогают покупателю быстрее принять решение.',
        placement: 'right',
        completion: 'navigate',
        nextUrl: appRoutes.demo.auto,
      },
    ],
  },
  {
    ...commonScenario,
    id: 'scenario-first-listing-auto',
    flowOrder: 4,
    name: 'Первое объявление: автомобиль',
    description: 'Заполнение полной формы автомобиля с пробегом.',
    url: appRoutes.demo.auto,
    versionId: 'scenario-first-listing-auto-v3',
    steps: [
      {
        id: 'step-auto-photos',
        versionId: 'scenario-first-listing-auto-v3',
        order: 1,
        selector: '[data-onboarding-id="auto-photos"]',
        title: 'Добавьте фото автомобиля',
        body: 'Первые фото снаружи и внутри помогают покупателю оценить состояние до переписки и осмотра.',
        placement: 'right',
        completion: 'next_button',
      },
      {
        id: 'step-auto-details',
        versionId: 'scenario-first-listing-auto-v3',
        order: 2,
        selector: '[data-onboarding-id="auto-details"]',
        title: 'Заполните данные для доверия',
        body: 'VIN, пробег и технические параметры снижают сомнения покупателя и уменьшают лишние вопросы.',
        placement: 'right',
        completion: 'next_button',
      },
      {
        id: 'step-auto-publish',
        versionId: 'scenario-first-listing-auto-v3',
        order: 3,
        selector: '[data-onboarding-id="auto-publish"]',
        title: 'Проверьте цену и опубликуйте',
        body: 'Цена, контакты и способ связи завершают объявление. После проверки его можно размещать.',
        placement: 'right',
        completion: 'next_button',
      },
    ],
  },
]

export const defaultScenario = defaultScenarios[0]
