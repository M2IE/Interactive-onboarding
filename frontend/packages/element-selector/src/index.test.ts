import { describe, expect, it } from '@jest/globals'
import { describeElement } from './index'

describe('describeElement', () => {
  it('prefers a unique onboarding id', () => {
    document.body.innerHTML = `
      <button data-onboarding-id="publish-listing">Разместить</button>
      <button>Отмена</button>
    `

    const target = document.querySelector('[data-onboarding-id]')!
    const descriptor = describeElement(target)

    expect(descriptor).toMatchObject({
      selector: '[data-onboarding-id="publish-listing"]',
      confidence: 'high',
      matchCount: 1,
    })
  })

  it('does not hide a duplicated onboarding id behind a unique fallback', () => {
    document.body.innerHTML = `
      <button id="first-button" data-onboarding-id="publish-listing">Первый</button>
      <button data-onboarding-id="publish-listing">Второй</button>
    `

    const descriptor = describeElement(document.querySelector('button')!)

    expect(descriptor).toMatchObject({
      selector: '[data-onboarding-id="publish-listing"]',
      confidence: 'low',
      matchCount: 2,
    })
    expect(descriptor.warnings).toContain(
      'Селектор находит несколько элементов: 2',
    )
  })

  it('uses a stable unique id before structural selectors', () => {
    document.body.innerHTML = '<main><button id="create-listing">Создать</button></main>'

    expect(describeElement(document.querySelector('button')!).selector).toBe(
      '#create-listing',
    )
    expect(describeElement(document.querySelector('button')!).warnings).toContain(
      'На элементе нет data-onboarding-id. Добавьте стабильный атрибут перед публикацией.',
    )
  })

  it('warns when only a generated class path is available', () => {
    document.body.innerHTML = `
      <main>
        <section><button class="css-a8f4c931">Первый</button></section>
        <section><button class="css-b7a1c442">Второй</button></section>
      </main>
    `

    const descriptor = describeElement(document.querySelector('button')!)

    expect(descriptor.confidence).toBe('low')
    expect(descriptor.warnings).toContain(
      'Селектор зависит от структуры страницы и может стать нестабильным',
    )
  })

  it('does not include input values, page HTML or personal data', () => {
    document.body.innerHTML = `
      <form>
        <input name="email" value="private@example.com" aria-label="private@example.com" />
      </form>
    `

    const descriptor = describeElement(document.querySelector('input')!)
    const serialized = JSON.stringify(descriptor)

    expect(serialized).not.toContain('private@example.com')
    expect(serialized).not.toContain('<input')
    expect(descriptor.selector).toContain('[name="email"]')
  })

  it('ignores data attributes that identify a user or session', () => {
    document.body.innerHTML = `
      <button data-user-id="0198-user" data-session-id="private-session" class="publish-button">
        Publish
      </button>
    `

    const serialized = JSON.stringify(
      describeElement(document.querySelector('button')!),
    )

    expect(serialized).not.toContain('0198-user')
    expect(serialized).not.toContain('private-session')
    expect(serialized).toContain('publish-button')
  })

  it('reports when the selected selector is not unique', () => {
    document.body.innerHTML = '<button role="button"></button><button role="button"></button>'
    const descriptor = describeElement(document.querySelector('button')!)

    expect(descriptor.matchCount).toBe(1)
    expect(descriptor.selector).toContain(':nth-of-type(1)')
  })
})
