import { useState } from 'react'
import { Button, Dialog, IconButton } from '@interactive-onboarding/ui'
import { Check, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import {
  guideAnalyticsIcon,
  scenarioGuideSteps,
  scenarioGuideTerms,
} from '../model/guideContent'

export function ScenarioGuideDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const step = scenarioGuideSteps[activeStep]
  const StepIcon = step.icon
  const AnalyticsIcon = guideAnalyticsIcon
  const isLastStep = activeStep === scenarioGuideSteps.length - 1

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
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setActiveStep(0)
          }
        }}
      >
        <div className="scenario-guide">
          <nav aria-label="Шаги создания сценария" className="scenario-guide__progress">
            {scenarioGuideSteps.map((item, index) => (
              <button
                aria-current={index === activeStep ? 'step' : undefined}
                aria-label={`Шаг ${index + 1}: ${item.title}`}
                className={index === activeStep ? 'is-active' : undefined}
                key={item.title}
                onClick={() => setActiveStep(index)}
                type="button"
              >
                {index < activeStep ? <Check size={14} /> : index + 1}
              </button>
            ))}
          </nav>

          <section className="scenario-guide__step">
            <div className="scenario-guide__visual" aria-hidden="true">
              <span><StepIcon size={28} /></span>
              <i />
              <span><AnalyticsIcon size={22} /></span>
            </div>
            <small>Шаг {activeStep + 1} из {scenarioGuideSteps.length}</small>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <aside>{step.note}</aside>
          </section>

          <details className="scenario-guide__terms">
            <summary>Термины платформы</summary>
            <dl>
              {scenarioGuideTerms.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.definition}</dd>
                </div>
              ))}
            </dl>
          </details>

          <footer className="scenario-guide__actions">
            <Button
              disabled={activeStep === 0}
              icon={<ChevronLeft aria-hidden="true" size={16} />}
              onClick={() => setActiveStep((index) => index - 1)}
            >
              Назад
            </Button>
            <Button
              icon={
                isLastStep ? (
                  <Check aria-hidden="true" size={16} />
                ) : (
                  <ChevronRight aria-hidden="true" size={16} />
                )
              }
              onClick={() => {
                if (isLastStep) {
                  setIsOpen(false)
                  return
                }
                setActiveStep((index) => index + 1)
              }}
              variant="primary"
            >
              {isLastStep ? 'Готово' : 'Далее'}
            </Button>
          </footer>
        </div>
      </Dialog>
    </>
  )
}
