import type { Node } from '@xyflow/react'
import type { JourneyNodeData } from './JourneyNodeCard'
import { mergeJourneyNodes } from './mergeJourneyNodes'

describe('mergeJourneyNodes', () => {
  it('preserves a dragged position while refreshing node data', () => {
    const current = createNode({ x: 420, y: 180 }, 'Old title')
    const next = createNode({ x: 20, y: 30 }, 'Updated title')

    const [merged] = mergeJourneyNodes([current], [next], true)

    expect(merged?.position).toEqual({ x: 420, y: 180 })
    expect(merged?.data.name).toBe('Updated title')
  })

  it('uses the automatic position when layout is reset', () => {
    const current = createNode({ x: 420, y: 180 }, 'Old title')
    const next = createNode({ x: 20, y: 30 }, 'Updated title')

    expect(mergeJourneyNodes([current], [next], false)[0]?.position).toEqual({
      x: 20,
      y: 30,
    })
  })
})

function createNode(
  position: { x: number; y: number },
  name: string,
): Node<JourneyNodeData> {
  return {
    id: 'scenario-1',
    type: 'journey',
    position,
    data: {
      id: 'scenario-1',
      kind: 'scenario',
      name,
      path: '/demo/profile',
      stepCount: 1,
      liveState: 'idle',
      dimmed: false,
    },
  }
}
