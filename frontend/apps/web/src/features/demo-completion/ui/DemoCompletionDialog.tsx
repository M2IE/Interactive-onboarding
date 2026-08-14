import { Button, Dialog } from '@interactive-onboarding/ui'
import { Home, RotateCcw } from 'lucide-react'
import type { DemoOutcome } from '../hooks/useDemoCompletion'

type DemoCompletionDialogProps = {
  outcome: DemoOutcome | null
  onRepeat: () => void
  onReturnHome: () => void
}

export function DemoCompletionDialog({
  outcome,
  onRepeat,
  onReturnHome,
}: DemoCompletionDialogProps) {
  const dismissed = outcome === 'dismissed'

  return (
    <Dialog
      className="demo-completion-dialog"
      description={
        dismissed
          ? 'Вы остановили пользовательский путь до завершения.'
          : 'Вы прошли все подсказки пользовательского пути.'
      }
      onOpenChange={() => undefined}
      open={outcome !== null}
      showCloseButton={false}
      title={dismissed ? 'Онбординг остановлен' : 'Демо завершено'}
    >
      <div className="demo-completion">
        <p>
          {dismissed
            ? 'Хотите начать путь заново или вернуться на главную?'
            : 'Хотите пройти онбординг ещё раз или вернуться на главную?'}
        </p>
        <div className="demo-completion__actions">
          <Button
            icon={<RotateCcw aria-hidden="true" size={17} />}
            onClick={onRepeat}
            variant="primary"
          >
            Повторить демо
          </Button>
          <Button
            icon={<Home aria-hidden="true" size={17} />}
            onClick={onReturnHome}
            variant="secondary"
          >
            Вернуться на главную
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
