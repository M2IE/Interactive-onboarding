import { describe, expect, it } from '@jest/globals'
import { defaultScenarios } from '@/entities/scenario/defaultScenario'
import { validateScenario } from './scenarioValidation'

describe('scenario validation', () => {
  it('accepts a complete scenario with stable selectors', () => {
    const result = validateScenario(defaultScenarios[0])

    expect(result.status).toBe('valid')
    expect(result.errors).toEqual([])
  })

  it('blocks publication when required fields are invalid', () => {
    const result = validateScenario({
      ...defaultScenarios[0],
      name: ' ',
      url: 'demo/profile',
      steps: [
        {
          ...defaultScenarios[0].steps[0],
          selector: '[broken',
          title: '',
          body: '',
          nextUrl: 'not a url',
        },
      ],
    })

    expect(result.status).toBe('invalid')
    expect(result.errors.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'missing_name',
        'invalid_page_url',
        'invalid_selector',
        'missing_title',
        'missing_body',
        'invalid_next_url',
      ]),
    )
  })

  it('warns about selectors that are valid but likely unstable', () => {
    const result = validateScenario({
      ...defaultScenarios[0],
      steps: [
        {
          ...defaultScenarios[0].steps[0],
          selector: '.generated-button-123',
        },
      ],
    })

    expect(result.status).toBe('valid')
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: 'unstable_selector' }),
    ])
  })
})
