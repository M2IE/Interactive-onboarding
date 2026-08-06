import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = ['ui-button', `ui-button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type="button" {...props}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

type BadgeProps = {
  tone?: 'blue' | 'green' | 'gray' | 'red'
  children: ReactNode
}

export function Badge({ tone = 'gray', children }: BadgeProps) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
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
}

export function Metric({ label, value, caption }: MetricProps) {
  return (
    <div className="ui-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </div>
  )
}
