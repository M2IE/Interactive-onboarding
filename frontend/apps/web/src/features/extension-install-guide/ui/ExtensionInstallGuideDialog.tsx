import { useState } from 'react'
import { Button, Dialog } from '@interactive-onboarding/ui'
import { Download, ExternalLink } from 'lucide-react'

const repositoryGuideUrl =
  'https://github.com/M2IE/Interactive-onboarding/blob/main/frontend/apps/extension/README.md'

export function ExtensionInstallGuideDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        icon={<Download aria-hidden="true" size={17} />}
        onClick={() => setIsOpen(true)}
        variant="primary"
      >
        Как установить
      </Button>
      <Dialog
        className="extension-install-dialog"
        description="Ручная установка тестовой версии без Chrome Web Store"
        onOpenChange={setIsOpen}
        open={isOpen}
        title="Установка Onboarding Studio"
      >
        <div className="extension-install-guide">
          <ol>
            <li>Скачайте и распакуйте архив расширения из релиза проекта.</li>
            <li>
              Откройте <code>chrome://extensions</code> и включите режим
              разработчика.
            </li>
            <li>
              Нажмите «Загрузить распакованное расширение» и выберите папку с
              файлом <code>manifest.json</code>.
            </li>
            <li>Закрепите Onboarding Studio в меню расширений Chrome.</li>
            <li>
              Откройте нужный сайт, запустите расширение и подключите его к
              вашей платформе Interactive Onboarding.
            </li>
          </ol>
          <p>
            Для надёжного выбора интерфейс сайта должен содержать уникальные
            атрибуты <code>data-onboarding-id</code>.
          </p>
          <a href={repositoryGuideUrl} rel="noreferrer" target="_blank">
            Полная инструкция в репозитории
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
      </Dialog>
    </>
  )
}
