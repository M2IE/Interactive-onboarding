import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import {
  Dialog as RadixDialog,
  Select as RadixSelect,
  Tabs as RadixTabs,
  Tooltip,
} from 'radix-ui'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'medium',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type="button" {...props}>
      {icon && <span className="ui-button__icon">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
  variant?: ButtonVariant
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip.Provider delayDuration={350}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            aria-label={label}
            className={[
              'ui-icon-button',
              `ui-icon-button--${variant}`,
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            type="button"
            {...props}
          >
            {icon}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="ui-tooltip" sideOffset={7}>
            {label}
            <Tooltip.Arrow className="ui-tooltip__arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

type BadgeProps = {
  tone?: 'blue' | 'green' | 'gray' | 'red'
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({
  tone = 'gray',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={['ui-badge', `ui-badge--${tone}`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && <i aria-hidden="true" />}
      {children}
    </span>
  )
}

type PanelProps = {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Panel({ title, action, children, className }: PanelProps) {
  return (
    <section className={['ui-panel', className].filter(Boolean).join(' ')}>
      {(title || action) && (
        <div className="ui-panel__header">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

type MetricProps = {
  label: string
  value: string
  caption?: string
  icon?: ReactNode
}

export function Metric({ label, value, caption, icon }: MetricProps) {
  return (
    <div className="ui-metric">
      <div className="ui-metric__label">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </div>
  )
}

export function Tabs(props: ComponentPropsWithoutRef<typeof RadixTabs.Root>) {
  return <RadixTabs.Root {...props} />
}

export function TabsList(
  props: ComponentPropsWithoutRef<typeof RadixTabs.List>,
) {
  return <RadixTabs.List {...props} />
}

export function TabsTrigger(
  props: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>,
) {
  return <RadixTabs.Trigger {...props} />
}

export function TabsContent(
  props: ComponentPropsWithoutRef<typeof RadixTabs.Content>,
) {
  return <RadixTabs.Content {...props} />
}

type DialogProps = ComponentPropsWithoutRef<typeof RadixDialog.Root> & {
  title: string
  description?: string
  children: ReactNode
  closeLabel?: string
  className?: string
}

export function Dialog({
  title,
  description,
  children,
  closeLabel = 'Закрыть',
  className,
  ...props
}: DialogProps) {
  return (
    <RadixDialog.Root {...props}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ui-dialog-overlay" />
        <RadixDialog.Content
          className={['ui-dialog-content', className].filter(Boolean).join(' ')}
        >
          <header className="ui-dialog-header">
            <div>
              <RadixDialog.Title>{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description>
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button aria-label={closeLabel} className="ui-dialog-close">
                <X aria-hidden="true" size={19} />
              </button>
            </RadixDialog.Close>
          </header>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

export type SelectOption<TValue extends string = string> = {
  label: string
  value: TValue
}

type SelectFieldProps<TValue extends string = string> = {
  label: string
  value: TValue
  options: SelectOption<TValue>[]
  onValueChange: (value: TValue) => void
  className?: string
}

export function SelectField<TValue extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: SelectFieldProps<TValue>) {
  return (
    <label className={className}>
      <span>{label}</span>
      <RadixSelect.Root
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
      >
        <RadixSelect.Trigger className="ui-select" aria-label={label}>
          <RadixSelect.Value />
          <RadixSelect.Icon className="ui-select__icon">
            <ChevronDown aria-hidden="true" size={16} strokeWidth={2} />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            className="ui-select-content"
            position="popper"
            sideOffset={5}
          >
            <RadixSelect.Viewport>
              {options.map((option) => (
                <RadixSelect.Item
                  className="ui-select-item"
                  key={option.value}
                  value={option.value}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="ui-select-item__indicator">
                    <Check aria-hidden="true" size={15} strokeWidth={2.4} />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </label>
  )
}
