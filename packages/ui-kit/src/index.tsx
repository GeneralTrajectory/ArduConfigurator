import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'

const palette = {
  surface: '#131a21',
  surfaceRaised: '#19222b',
  surfaceInset: '#0c1218',
  border: '#31404d',
  borderStrong: '#55697d',
  text: '#edf3f7',
  muted: '#b9c7d1',
  dim: '#7f8d9a',
  accent: '#8cb7d0',
  primary: '#d0aa68',
  success: '#86a996',
  warning: '#d0aa68',
  danger: '#c47b72'
}

export function Panel({
  title,
  subtitle,
  actions,
  children
}: PropsWithChildren<{ title: string; subtitle?: string; actions?: ReactNode }>) {
  return (
    <section
      style={{
        background:
          'radial-gradient(circle at top right, rgba(140, 183, 208, 0.08), transparent 42%), linear-gradient(180deg, rgba(20, 27, 34, 0.98), rgba(12, 17, 22, 1))',
        border: `1px solid ${palette.borderStrong}`,
        borderRadius: 10,
        padding: 16,
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 0 0 1px rgba(140, 183, 208, 0.04), 0 16px 34px rgba(0, 0, 0, 0.18)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: palette.text, fontSize: 16, letterSpacing: '-0.015em', fontWeight: 650 }}>{title}</h2>
          {subtitle ? <p style={{ margin: '5px 0 0', color: palette.muted, lineHeight: 1.5, fontSize: 13 }}>{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  )
}

export function StatusBadge({ tone, children }: PropsWithChildren<{ tone: 'neutral' | 'success' | 'warning' | 'danger' }>) {
  const color =
    tone === 'success' ? palette.success : tone === 'warning' ? palette.warning : tone === 'danger' ? palette.danger : palette.accent

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 6,
        border: `1px solid ${color}52`,
        color,
        background: `${color}10`,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        fontFamily: '"IBM Plex Mono", "SFMono-Regular", "SF Mono", Consolas, monospace'
      }}
    >
      {children}
    </span>
  )
}

export function KeyValueRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '11px 0',
        borderBottom: `1px solid ${palette.border}`
      }}
    >
      <span style={{ color: palette.muted }}>{label}</span>
      <strong style={{ color: palette.text }}>{value}</strong>
    </div>
  )
}

export function buttonStyle(kind: 'primary' | 'secondary' = 'secondary'): CSSProperties {
  return {
    border: `1px solid ${kind === 'primary' ? palette.primary : palette.borderStrong}`,
    background:
      kind === 'primary'
        ? 'linear-gradient(180deg, rgba(72, 57, 31, 0.98), rgba(40, 31, 20, 1))'
        : 'linear-gradient(180deg, rgba(27, 34, 42, 0.98), rgba(15, 20, 26, 1))',
    color: palette.text,
    padding: '9px 13px',
    borderRadius: 6,
    fontWeight: 700,
    letterSpacing: 0.01,
    boxShadow:
      kind === 'primary'
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 18px rgba(0, 0, 0, 0.18)'
        : 'inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 0 0 1px rgba(140, 183, 208, 0.04)',
    cursor: 'pointer'
  }
}
