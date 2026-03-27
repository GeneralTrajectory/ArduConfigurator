import { pageview, track } from '@vercel/analytics'

type AnalyticsValue = string | number | boolean | null | undefined

export function trackViewPageview(viewId: string): void {
  try {
    pageview({
      route: viewId,
      path: `/${viewId}`
    })
  } catch {
    // Ignore analytics transport errors so product workflows stay unaffected.
  }
}

export function trackAppEvent(name: string, properties?: Record<string, AnalyticsValue>): void {
  try {
    track(name, properties)
  } catch {
    // Ignore analytics transport errors so product workflows stay unaffected.
  }
}
