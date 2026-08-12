import { createElementPicker } from './picker/createElementPicker'
import { createPreviewRuntime } from './preview/createPreviewRuntime'
import type { ExtensionMessage } from '../shared/messages/types'

declare global {
  interface Window {
    __M2IE_ONBOARDING_STUDIO_CONTENT__?: boolean
  }
}

if (!window.__M2IE_ONBOARDING_STUDIO_CONTENT__) {
  window.__M2IE_ONBOARDING_STUDIO_CONTENT__ = true
  startContentRuntime()
}

function startContentRuntime() {
  const preview = createPreviewRuntime()
  const picker = createElementPicker({
    document,
    onCancel: () => sendRuntimeMessage({ type: 'PICKER_CANCEL' }),
    onSelect: (element) =>
      sendRuntimeMessage({ type: 'ELEMENT_SELECTED', element }),
  })
  let pathname = window.location.pathname

  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    switch (message.type) {
      case 'PICKER_START':
        preview.stop()
        picker.start()
        break
      case 'PICKER_CANCEL':
        picker.stop()
        break
      case 'PREVIEW_START':
        picker.stop()
        preview.start({
          ...message.config,
          steps: message.config.steps.filter((step) =>
            reportTargetAvailability(step.selector),
          ),
        })
        break
      case 'PREVIEW_STOP':
        preview.stop()
        break
      default:
        break
    }
  })

  window.addEventListener('popstate', reportPageChange)
  const observer = new MutationObserver(reportPageChange)
  observer.observe(document.documentElement, { childList: true, subtree: true })

  sendRuntimeMessage({ type: 'CONTENT_READY' })
  sendRuntimeMessage({
    type: 'PAGE_CHANGED',
    pathname,
    title: document.title,
    url: window.location.href,
  })

  function reportPageChange() {
    if (pathname === window.location.pathname) {
      return
    }

    pathname = window.location.pathname
    picker.stop()
    preview.stop()
    sendRuntimeMessage({
      type: 'PAGE_CHANGED',
      pathname,
      title: document.title,
      url: window.location.href,
    })
  }
}

function reportTargetAvailability(selector: string) {
  try {
    if (document.querySelector(selector)) {
      return true
    }
  } catch {
    // Invalid selectors are reported through the same editor notice.
  }

  sendRuntimeMessage({ type: 'TARGET_NOT_FOUND', selector })
  return false
}

function sendRuntimeMessage(message: ExtensionMessage) {
  void chrome.runtime.sendMessage(message).catch(() => undefined)
}
