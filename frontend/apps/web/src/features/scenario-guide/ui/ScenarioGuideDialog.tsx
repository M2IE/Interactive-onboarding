import { useState } from 'react'
import { Dialog, IconButton } from '@interactive-onboarding/ui'
import { Info } from 'lucide-react'
import { scenarioGuideSteps, scenarioGuideTerms } from '../model/guideContent'

export function ScenarioGuideDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <IconButton
        icon={<Info aria-hidden="true" size={18} />}
        label="Как создать сценарий"
        onClick={() => setIsOpen(true)}
        variant="secondary"
      />
      <Dialog
        description="Короткий путь от черновика до аналитики"
        open={isOpen}
        title="Как создать сценарий"
        onOpenChange={setIsOpen}
      >
        <div className="scenario-guide">
          <section className="scenario-guide__terms" aria-labelledby="guide-terms-title">
            <h3 id="guide-terms-title">Основные понятия</h3>
            <dl>
              {scenarioGuideTerms.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="scenario-guide__workflow" aria-labelledby="guide-workflow-title">
            <h3 id="guide-workflow-title">Порядок работы</h3>
            <ol>
              {scenarioGuideSteps.map((step) => (
                <li key={step.title}>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                    <small>{step.note}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </Dialog>
    </>
  )
}
