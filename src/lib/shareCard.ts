// 인스타 스토리용 공유 카드 (1080x1920) — 캔버스로 생성해 Web Share / 다운로드
import { formatDateLabel, getUpcomingSessionDate } from './dates'

function drawCard(name: string): HTMLCanvasElement {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 배경 — 딥 그라데이션
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0a0a0a')
  bg.addColorStop(1, '#1c2333')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 은은한 오렌지 글로우
  const glow = ctx.createRadialGradient(W / 2, H * 0.72, 60, W / 2, H * 0.72, 620)
  glow.addColorStop(0, 'rgba(255,90,31,0.28)')
  glow.addColorStop(1, 'rgba(255,90,31,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'

  // 브랜드
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '300 54px sans-serif'
  ctx.fillText('O  N  D  O', W / 2, 340)

  // 메인 카피
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 96px sans-serif'
  ctx.fillText('이번 주 목요일,', W / 2, 780)
  ctx.fillText('여의도에서 뛴다', W / 2, 910)

  // 러너 이모지
  ctx.font = '160px serif'
  ctx.fillText('🏃', W / 2, 1180)

  // 세션 정보
  const dateLabel = formatDateLabel(getUpcomingSessionDate())
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 58px sans-serif'
  ctx.fillText(`${dateLabel} 저녁 8시 · 여의나루`, W / 2, 1370)

  // 참가자 이름
  ctx.fillStyle = '#FF5A1F'
  ctx.font = 'bold 62px sans-serif'
  ctx.fillText(`${name} 매칭 확정`, W / 2, 1480)

  // 하단 URL
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '400 44px sans-serif'
  ctx.fillText('ondo-match.vercel.app', W / 2, 1730)

  return canvas
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

/** 공유 카드 생성 후 Web Share(모바일) 또는 다운로드(데스크탑) */
export async function shareMatchCard(name: string): Promise<void> {
  const blob = await toBlob(drawCard(name))
  const file = new File([blob], 'ondo-thursday.png', { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      /* 사용자가 공유 시트를 닫음 — 무시 */
      return
    }
  }

  // 폴백: 다운로드
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ondo-thursday.png'
  a.click()
  URL.revokeObjectURL(url)
}
