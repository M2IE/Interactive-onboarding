import type {
  ActiveTabContextResponse,
  ExtensionMessage,
} from './types'

export async function getActiveTabContext() {
  return chrome.runtime.sendMessage<
    ExtensionMessage,
    ActiveTabContextResponse
  >({ type: 'GET_ACTIVE_TAB_CONTEXT' })
}

export async function sendMessageToTab(
  tabId: number,
  message: ExtensionMessage,
) {
  await chrome.tabs.sendMessage(tabId, message)
}
