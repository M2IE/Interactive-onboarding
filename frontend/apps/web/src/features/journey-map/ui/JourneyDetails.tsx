import { Button } from '@interactive-onboarding/ui'
import { Edit3, Play, TriangleAlert } from 'lucide-react'
import type { JourneyDiagnostic, JourneyNode } from '../model/types'

type JourneyDetailsProps = {
  selectedNode?: JourneyNode
  diagnostics: JourneyDiagnostic[]
  onEdit(): void
  onStart(path: string): void
}

export function JourneyDetails({ selectedNode, diagnostics, onEdit, onStart }: JourneyDetailsProps) {
  const related = selectedNode
    ? diagnostics.filter((item) => item.nodeIds.includes(selectedNode.id))
    : diagnostics

  return (
    <section className="journey-details" aria-label="Информация о пути">
      {selectedNode?.scenario ? (
        <>
          <div>
            <span className="journey-details__label">Выбранный сценарий</span>
            <h2>{selectedNode.name}</h2>
            <code>{selectedNode.path}</code>
          </div>
          <div className="journey-details__actions">
            <Button icon={<Play aria-hidden="true" size={16} />} onClick={() => onStart(selectedNode.path)} variant="primary">
              Начать отсюда
            </Button>
            <Button icon={<Edit3 aria-hidden="true" size={16} />} onClick={onEdit}>
              Открыть сценарий
            </Button>
          </div>
        </>
      ) : (
        <div>
          <span className="journey-details__label">Диагностика пути</span>
          <h2>{diagnostics.length === 0 ? 'Путь связан корректно' : `${diagnostics.length} рекомендаций`}</h2>
        </div>
      )}
      {related.length > 0 && (
        <ul className="journey-diagnostics">
          {related.map((item) => (
            <li key={item.id}>
              <TriangleAlert aria-hidden="true" size={16} />
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
