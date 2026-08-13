import type { Node } from '@xyflow/react'

export function mergeJourneyNodes<TNode extends Node>(
  currentNodes: TNode[],
  nextNodes: TNode[],
  preservePositions: boolean,
) {
  if (!preservePositions) return nextNodes

  const currentPositions = new Map(
    currentNodes.map((node) => [node.id, node.position]),
  )
  return nextNodes.map((node) => ({
    ...node,
    position: currentPositions.get(node.id) ?? node.position,
  }))
}
