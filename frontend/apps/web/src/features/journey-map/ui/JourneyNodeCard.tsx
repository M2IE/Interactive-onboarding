import { Handle, Position, type NodeProps } from '@xyflow/react'
import { AlertTriangle, CheckCircle2, ExternalLink, LoaderCircle } from 'lucide-react'
import type { JourneyMetrics, JourneyNode } from '../model/types'
import type { AsyncState } from '@/shared/lib/asyncState'

export type JourneyNodeData = JourneyNode & {
  metrics?: AsyncState<JourneyMetrics>
  liveState: 'idle' | 'active' | 'visited'
  dimmed: boolean
}

export function JourneyNodeCard({ data, selected }: NodeProps) {
  const node = data as JourneyNodeData
  return (
    <article
      aria-label={`${node.name}, ${node.path}`}
      className={[
        'journey-node',
        `journey-node--${node.kind}`,
        node.liveState !== 'idle' && `is-${node.liveState}`,
        selected && 'is-selected',
        node.dimmed && 'is-dimmed',
      ].filter(Boolean).join(' ')}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <div className="journey-node__eyebrow">
        <span>{node.kind === 'scenario' ? 'Опубликован' : 'Требует внимания'}</span>
        {node.liveState === 'active' ? (
          <span className="journey-node__live"><i /> Live</span>
        ) : node.liveState === 'visited' ? (
          <CheckCircle2 aria-label="Шаг пройден" size={15} />
        ) : node.kind !== 'scenario' ? (
          <AlertTriangle aria-hidden="true" size={15} />
        ) : null}
      </div>
      <strong>{node.name}</strong>
      <code>{node.path}</code>
      {node.kind === 'scenario' && (
        <div className="journey-node__metrics">
          <span><b>{node.stepCount}</b> шагов</span>
          {node.metrics?.status === 'success' ? (
            <>
              <span><b>{node.metrics.data.views}</b> просмотров</span>
              <span><b>{node.metrics.data.conversion}%</b> конверсия</span>
            </>
          ) : node.metrics?.status === 'error' ? (
            <span className="is-error">Метрики недоступны</span>
          ) : (
            <span className="is-loading"><LoaderCircle aria-hidden="true" size={12} /> Метрики</span>
          )}
        </div>
      )}
      {node.kind === 'external' && <ExternalLink aria-hidden="true" size={18} />}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </article>
  )
}
