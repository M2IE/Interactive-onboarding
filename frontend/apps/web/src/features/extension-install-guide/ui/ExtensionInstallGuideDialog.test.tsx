import { fireEvent, render, screen } from '@testing-library/react'
import { ExtensionInstallGuideDialog } from './ExtensionInstallGuideDialog'

describe('ExtensionInstallGuideDialog', () => {
  it('explains how to install the unpacked extension', () => {
    render(<ExtensionInstallGuideDialog />)

    fireEvent.click(screen.getByRole('button', { name: 'Как установить' }))

    expect(
      screen.getByRole('dialog', { name: 'Установка Onboarding Studio' }),
    ).toBeInTheDocument()
    expect(screen.getByText('chrome://extensions')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /полная инструкция/i }),
    ).toHaveAttribute(
      'href',
      'https://github.com/M2IE/Interactive-onboarding/blob/main/frontend/apps/extension/README.md',
    )
  })
})
