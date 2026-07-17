// ───────────────────────── 퍼널 이벤트 트래킹 ─────────────────────────
// GA4(gtag) / PostHog 추상화. 키 없으면 dev 콘솔로만 출력(no-op 안전).
// 향후 Mixpanel 등으로 교체 시 track() 한 곳만 바꾸면 됨.

type Props = Record<string, unknown>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    posthog?: { capture: (event: string, props?: Props) => void }
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined
const DEV = import.meta.env.DEV

/** GA4 / PostHog 스크립트 로드 (환경변수 있을 때만). 앱 시작 시 1회 호출. */
export function initAnalytics() {
  if (GA_ID && typeof document !== 'undefined' && !window.gtag) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_ID)
  }
}

/** 단일 진입점 — 모든 이벤트는 여기를 통과 */
export function track(event: string, props: Props = {}) {
  try {
    window.gtag?.('event', event, props)
    window.posthog?.capture(event, props)
    if (DEV) console.debug('[analytics]', event, props)
  } catch {
    /* noop */
  }
}

// ── 퍼널별 이벤트 (함수로 분리) ──
export const analytics = {
  // page_view는 gtag('config') 자동 집계 — 수동 발사 금지(이중 집계)
  heroCtaClick: () => track('hero_cta_click'),
  leadSubmit: () => track('lead_submit'),
  leadPopupView: () => track('lead_popup_view'),
  shareCardClick: () => track('share_card_click'),
  scroll: (pct: 25 | 50 | 75) => track(`scroll_${pct}`),
  whyOndoView: () => track('why_ondo_view'),
  faqOpen: (question: string) => track('faq_open', { question }),
  modalOpen: () => track('application_modal_open'),
  applyStep: (step: number, stepName: string) =>
    track('apply_step_completed', { step, step_name: stepName }),
  applicationSubmit: () => track('application_submit'),
  applicationComplete: (props?: Props) => track('application_complete', props),
  depositStart: () => track('deposit_start'),
  depositCopyAccount: () => track('deposit_copy_account'),
  // source 구분: 'mouseout'=진짜 이탈 의도, 'hidden'=탭 전환·타 앱 이동(입금하러 은행 앱 등)
  exitIntent: (source: 'mouseout' | 'hidden') => track('exit_intent', { source }),
  experimentView: (name: string, variant: string) =>
    track('experiment_view', { experiment: name, variant }),
}
