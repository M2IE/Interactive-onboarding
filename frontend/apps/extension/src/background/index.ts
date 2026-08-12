import type {
  ActiveTabContextResponse,
  ExtensionMessage,
  TabContext,
} from '../shared/messages/types'

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) {
    return
  }

  void openStudio(tab.id)
})

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type !== 'GET_ACTIVE_TAB_CONTEXT') {
      return undefined
    }

    void getActiveTabContext().then(sendResponse)
    return true
  },
)

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    void ensureContentScript(details.tabId)
  }
})

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0) {
    void ensureContentScript(details.tabId)
  }
})

async function openStudio(tabId: number) {
  try {
    await chrome.sidePanel.open({ tabId })
    await ensureContentScript(tabId)
  } catch {
    // Chrome surfaces unsupported pages in the Side Panel state.
  }
}

async function getActiveTabContext(): Promise<ActiveTabContextResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (tab?.id === undefined || !tab.url) {
    return {
      status: 'unsupported',
      message: 'Не удалось получить активную вкладку',
    }
  }

  const context = parseTabContext(tab.id, tab.url, tab.title ?? '')

  if (!context) {
    return {
      status: 'unsupported',
      message: 'Chrome не разрешает запуск расширения на этой странице',
    }
  }

  try {
    await ensureContentScript(tab.id)
  } catch {
    return {
      status: 'unsupported',
      message: 'Нажмите иконку расширения ещё раз, чтобы дать доступ к вкладке',
    }
  }

  return { status: 'ready', context }
}

async function ensureContentScript(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'CONTENT_READY',
    } satisfies ExtensionMessage)
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.global.js'],
    })
  }
}

function parseTabContext(
  tabId: number,
  url: string,
  title: string,
): TabContext | null {
  const parsedUrl = new URL(url)

  if (!/^https?:$/.test(parsedUrl.protocol)) {
    return null
  }

  return {
    tabId,
    origin: parsedUrl.origin,
    pathname: parsedUrl.pathname,
    title,
    url: parsedUrl.href,
  }
}
