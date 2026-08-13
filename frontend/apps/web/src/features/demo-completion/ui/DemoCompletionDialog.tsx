import { Button, Dialog } from '@interactive-onboarding/ui'
import { Home, RotateCcw } from 'lucide-react'

type DemoCompletionDialogProps = {
  open: boolean
  onRepeat: () => void
  onReturnHome: () => void
}

export function DemoCompletionDialog({
  open,
  onRepeat,
  onReturnHome,
}: DemoCompletionDialogProps) {
  return (
    <Dialog
      className="demo-completion-dialog"
      description="Вы прошли все подсказки пользовательского пути."
      onOpenChange={() => undefined}
      open={open}
      showCloseButton={false}
      title="Демо завершено"
    >
      <div className="demo-completion">
        <p>Хотите пройти онбординг ещё раз или вернуться на главную?</p>
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
