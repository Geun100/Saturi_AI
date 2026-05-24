import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: '사투리 패스 — 포항 AI 여행 메이트',
  description: '포항 사투리로 말하는 AI 친구와 함께하는 맞춤 여행',
  keywords: ['포항', '여행', '사투리', 'AI', '관광'],
  openGraph: {
    title: '사투리 패스',
    description: '포항 친구가 생기는 AI 여행 메이트',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ background: 'var(--bg)' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
