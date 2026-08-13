import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'node:util'

Object.assign(globalThis, { TextDecoder, TextEncoder })

class TestResizeObserver implements ResizeObserver {
  constructor() {}

  disconnect() {}

  observe() {}

  unobserve() {}
}

Object.assign(globalThis, { ResizeObserver: TestResizeObserver })

class TestBroadcastChannel extends EventTarget implements BroadcastChannel {
  static channels = new Map<string, Set<TestBroadcastChannel>>()
  readonly name: string
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null = null
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null = null

  constructor(name: string) {
    super()
    this.name = name
    const peers = TestBroadcastChannel.channels.get(name) ?? new Set()
    peers.add(this)
    TestBroadcastChannel.channels.set(name, peers)
  }

  postMessage(message: unknown) {
    for (const peer of TestBroadcastChannel.channels.get(this.name) ?? []) {
      if (peer === this) continue
      const event = new MessageEvent('message', { data: message })
      peer.dispatchEvent(event)
      peer.onmessage?.call(peer, event)
    }
  }

  close() {
    TestBroadcastChannel.channels.get(this.name)?.delete(this)
  }
}

Object.assign(globalThis, { BroadcastChannel: TestBroadcastChannel })
