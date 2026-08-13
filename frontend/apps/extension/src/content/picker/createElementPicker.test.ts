import { describe, expect, it, jest } from '@jest/globals'
import { createElementPicker } from './createElementPicker'

describe('createElementPicker', () => {
  it('blocks the host click and returns a selected element', () => {
    document.body.innerHTML = '<button data-onboarding-id="target">Target</button>'
    const hostClick = jest.fn()
    const onSelect = jest.fn()
    const target = document.querySelector('button')!
    target.addEventListener('click', hostClick)
    jest.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      bottom: 50,
      height: 40,
      left: 10,
      right: 110,
      top: 10,
      width: 100,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    })
    const picker = createElementPicker({
      document,
      onCancel: jest.fn(),
      onSelect,
    })

    picker.start()
    target.dispatchEvent(new Event('pointerover', { bubbles: true }))
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    target.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(true)
    expect(hostClick).not.toHaveBeenCalled()
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: '[data-onboarding-id="target"]',
      }),
    )
  })

  it('selects the closest onboarding ancestor when a nested child is clicked', () => {
    document.body.innerHTML = `
      <button data-onboarding-id="create-listing">
        <span class="label">Разместить объявление</span>
      </button>
    `
    const onSelect = jest.fn()
    const button = document.querySelector('button')!
    const label = document.querySelector('span')!
    jest.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      bottom: 50,
      height: 40,
      left: 10,
      right: 210,
      top: 10,
      width: 200,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    })
    const picker = createElementPicker({
      document,
      onCancel: jest.fn(),
      onSelect,
    })

    picker.start()
    label.dispatchEvent(new Event('pointerover', { bubbles: true }))
    label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: '[data-onboarding-id="create-listing"]',
        matchCount: 1,
      }),
    )
  })

  it('warns when the selected element has no onboarding marker', () => {
    document.body.innerHTML = '<button id="create-listing">Создать</button>'
    const onSelect = jest.fn()
    const target = document.querySelector('button')!
    const picker = createElementPicker({
      document,
      onCancel: jest.fn(),
      onSelect,
    })

    picker.start()
    target.dispatchEvent(new Event('pointerover', { bubbles: true }))
    target.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: '#create-listing',
        warnings: expect.arrayContaining([
          'На элементе нет data-onboarding-id. Добавьте стабильный атрибут перед публикацией.',
        ]),
      }),
    )
  })

  it('cancels on Escape and restores normal clicks', () => {
    document.body.innerHTML = '<button>Target</button>'
    const onCancel = jest.fn()
    const hostClick = jest.fn()
    const target = document.querySelector('button')!
    target.addEventListener('click', hostClick)
    const picker = createElementPicker({
      document,
      onCancel,
      onSelect: jest.fn(),
    })

    picker.start()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
    )
    target.click()

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(hostClick).toHaveBeenCalledTimes(1)
  })
})
