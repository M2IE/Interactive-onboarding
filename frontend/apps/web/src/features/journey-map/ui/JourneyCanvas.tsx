import { useEffect, useMemo, useRef } from 'react'
import dagre from '@dagrejs/dagre'
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import type { OnboardingEventPayload } from '@m2ie/onboarding-sdk'
import type { AsyncState } from '@/shared/lib/asyncState'
import { mergeJourneyNodes } from '../model/mergeJourneyNodes'
import type { JourneyGraph, JourneyMetrics } from '../model/types'
import { JourneyNodeCard, type JourneyNodeData } from './JourneyNodeCard'

type JourneyCanvasProps = {
  graph: JourneyGraph
  compact?: boolean
  layoutResetKey?: number
  metrics: Record<string, AsyncState<JourneyMetrics>>
  selectedNodeId?: string
  visibleNodeIds?: Set<string>
  liveEvents: OnboardingEventPayload[]
  currentScenarioId?: string
  onSelectNode(nodeId?: string): void
}

const nodeTypes = { journey: JourneyNodeCard }
const nodeWidth = 250
const nodeHeight = 150

export function JourneyCanvas({
  graph,
  compact = false,
  layoutResetKey = 0,
  metrics,
  selectedNodeId,
  visibleNodeIds,
  liveEvents,
  currentScenarioId,
  onSelectNode,
}: JourneyCanvasProps) {
  const visitedIds = useMemo(
    () => new Set(liveEvents.map((event) => event.scenarioId)),
    [liveEvents],
  )
  const elements = useMemo(
    () => layoutGraph(
      graph,
      metrics,
      visibleNodeIds,
      visitedIds,
      currentScenarioId,
      compact,
    ),
    [compact, currentScenarioId, graph, metrics, visibleNodeIds, visitedIds],
  )
  const layoutVersion = useMemo(
    () => [
      compact ? 'compact' : 'wide',
      layoutResetKey,
      graph.nodes.map((node) => node.id).join(','),
      graph.edges.map((edge) => `${edge.source}:${edge.target}`).join(','),
    ].join('|'),
    [compact, graph.edges, graph.nodes, layoutResetKey],
  )
  const layoutVersionRef = useRef(layoutVersion)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<JourneyNodeData>>(
    elements.nodes,
  )

  useEffect(() => {
    const shouldResetPositions = layoutVersionRef.current !== layoutVersion
    layoutVersionRef.current = layoutVersion
    setNodes((currentNodes) => mergeJourneyNodes(
      currentNodes,
      elements.nodes,
      !shouldResetPositions,
    ))
  }, [elements.nodes, layoutVersion, setNodes])

  return (
    <div className="journey-canvas" data-testid="journey-canvas">
      <ReactFlow
        ariaLabelConfig={{
          'controls.ariaLabel': 'Управление картой',
          'controls.fitView.ariaLabel': 'Показать весь путь',
          'controls.zoomIn.ariaLabel': 'Приблизить',
          'controls.zoomOut.ariaLabel': 'Отдалить',
          'minimap.ariaLabel': 'Мини-карта пути',
        }}
        colorMode="light"
        edges={elements.edges}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
        minZoom={0.3}
        nodeTypes={nodeTypes}
        nodes={nodes.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))}
        nodesConnectable={false}
        nodesDraggable
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(undefined)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#dfe3e8" gap={24} size={1} />
        <Controls showInteractive={false} />
        {!compact && (
          <MiniMap
            maskColor="rgba(247, 248, 250, 0.72)"
            nodeColor={(node) =>
              node.data.kind === 'scenario' ? '#0af' : '#ffb020'
            }
            pannable
            zoomable
          />
        )}
      </ReactFlow>
    </div>
  )
}

function layoutGraph(
  graph: JourneyGraph,
  metrics: Record<string, AsyncState<JourneyMetrics>>,
  visibleNodeIds: Set<string> | undefined,
  visitedIds: Set<string>,
  currentScenarioId?: string,
  compact = false,
) {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: compact ? 'TB' : 'LR',
    ranksep: compact ? 66 : 190,
    nodesep: 36,
    marginx: 30,
    marginy: 30,
  })
  graph.nodes.forEach((node) => dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight }))
  graph.edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target))
  dagre.layout(dagreGraph)

  const nodes: Node<JourneyNodeData>[] = graph.nodes.map((node) => {
    const position = dagreGraph.node(node.id) as { x: number; y: number }
    return {
      id: node.id,
      type: 'journey',
      position: { x: position.x - nodeWidth / 2, y: position.y - nodeHeight / 2 },
      data: {
        ...node,
        metrics: metrics[node.id],
        liveState: node.id === currentScenarioId
          ? 'active'
          : visitedIds.has(node.id) ? 'visited' : 'idle',
        dimmed: Boolean(visibleNodeIds && !visibleNodeIds.has(node.id)),
      },
    }
  })
  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    label: edge.count > 1 ? `${edge.count} перехода` : edge.stepTitles[0],
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9aa0a6' },
    animated: edge.source === currentScenarioId,
    style: { stroke: edge.source === currentScenarioId ? '#00aaff' : '#aeb4bb', strokeWidth: 2 },
    labelStyle: { fill: '#626971', fontSize: 11, fontWeight: 650 },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.94 },
    labelBgPadding: [5, 7] as [number, number],
    labelBgBorderRadius: 4,
  }))
  return { nodes, edges }
}
