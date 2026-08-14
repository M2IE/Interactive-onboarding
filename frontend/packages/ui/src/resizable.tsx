import type { ComponentPropsWithoutRef } from 'react'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type LayoutStorage,
} from 'react-resizable-panels'

const layoutStorage: LayoutStorage = {
  getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      // Layout persistence must not prevent the workspace from rendering.
    }
  },
}

type ResizableWorkspaceProps = Omit<
  ComponentPropsWithoutRef<typeof Group>,
  'defaultLayout' | 'onLayoutChange' | 'onLayoutChanged' | 'orientation'
> & {
  panelIds: string[]
  storageKey: string
}

export function ResizableWorkspace({
  children,
  className,
  id,
  panelIds,
  storageKey,
  ...props
}: ResizableWorkspaceProps) {
  const persistence = useDefaultLayout({
    id: `interactive-onboarding:${storageKey}`,
    onlySaveAfterUserInteractions: true,
    panelIds,
    storage: layoutStorage,
  })

  return (
    <Group
      {...props}
      className={['ui-resizable-workspace', className]
        .filter(Boolean)
        .join(' ')}
      defaultLayout={persistence.defaultLayout}
      id={id ?? storageKey}
      onLayoutChanged={persistence.onLayoutChanged}
      orientation="horizontal"
      resizeTargetMinimumSize={{ coarse: 24, fine: 10 }}
    >
      {children}
    </Group>
  )
}

type ResizablePanelProps = ComponentPropsWithoutRef<typeof Panel>

export function ResizablePanel({
  className,
  ...props
}: ResizablePanelProps) {
  return (
    <Panel
      {...props}
      className={['ui-resizable-panel', className].filter(Boolean).join(' ')}
    />
  )
}

type ResizeHandleProps = Omit<
  ComponentPropsWithoutRef<typeof Separator>,
  'children'
> & {
  label: string
}

export function ResizeHandle({
  className,
  label,
  ...props
}: ResizeHandleProps) {
  return (
    <Separator
      {...props}
      aria-label={label}
      className={['ui-resize-handle', className].filter(Boolean).join(' ')}
    >
      <span aria-hidden="true" />
    </Separator>
  )
}
