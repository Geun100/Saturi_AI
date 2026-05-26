'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const FONT = "'Noto Sans KR', sans-serif"

type Card = {
  id: string
  nickname: string
  title: string
  desc: string
  likes: number
  image: string
  fallbackBg: string
  fallbackEmoji: string
  objectPosition: string
}

const CARDS: Card[] = [
  {
    id: 'mansik',
    nickname: '@죽도시장_만식이',
    title: '과메기랑 포항 구석구석',
    desc: '32년 죽도시장 터줏대감',
    likes: 531,
    image: '/images/mansik.jpg',
    fallbackBg: 'linear-gradient(145deg, #1e40af, #1d4ed8)',
    fallbackEmoji: '🐟',
    objectPosition: 'top center',
  },
  {
    id: 'seoh',
    nickname: '@한동대_세오',
    title: '감성 야경 포항 여행',
    desc: '포항 숨은 카페 전문',
    likes: 115,
    image: '/images/seo.jpg',
    fallbackBg: 'linear-gradient(145deg, #312e81, #4338ca)',
    fallbackEmoji: '🌙',
    objectPosition: 'top center',
  },
  {
    id: 'yeonoh',
    nickname: '@포스코_연오',
    title: '포항 액티비티 뿌수기',
    desc: '에너지 넘치는 포항 청년',
    likes: 47,
    image: '/images/yuno.jpg',
    fallbackBg: 'linear-gradient(145deg, #0284c7, #38bdf8)',
    fallbackEmoji: '⚡',
    objectPosition: 'top center',
  },
  {
    id: 'jisu',
    nickname: '@로컬크리에이터_지수',
    title: '아무도 모르는 포항',
    desc: '서울 갔다온 포항 힙스터',
    likes: 89,
    image: '/images/jisu.jpg',
    fallbackBg: 'linear-gradient(145deg, #6d28d9, #a855f7)',
    fallbackEmoji: '📸',
    objectPosition: 'top center',
  },
  {
    id: 'homi',
    nickname: '@호미곶_할매',
    title: '연오랑 세오녀 이야기',
    desc: '포항 살아있는 역사책',
    likes: 39,
    image: '/images/halmae.jpg',
    fallbackBg: 'linear-gradient(145deg, #c2410c, #f97316)',
    fallbackEmoji: '🌅',
    objectPosition: 'top center',
  },
]

function CardItem({ card, onClick }: { card: Card; onClick: () => void }) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3/4',
        borderRadius: 20,
        overflow: 'hidden',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'block',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      }}
    >
      {/* 이미지 or 폴백 */}
      {!imgFailed ? (
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          style={{ objectFit: 'cover', objectPosition: card.objectPosition }}
          onError={() => setImgFailed(true)}
          priority={card.id === 'mansik' || card.id === 'seoh'}
        />
      ) : (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: card.fallbackBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 52 }}>{card.fallbackEmoji}</span>
        </div>
      )}

      {/* 좋아요 뱃지 */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '4px 10px',
        borderRadius: 20,
        background: 'rgba(0,0,0,0.48)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: FONT,
        backdropFilter: 'blur(4px)',
      }}>
        ♡ {card.likes}
      </div>

      {/* 하단 그라데이션 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '36px 12px 14px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, marginBottom: 3, fontFamily: FONT }}>
          {card.nickname}
        </p>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, lineHeight: 1.35, marginBottom: 3, fontFamily: FONT }}>
          {card.title}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 10.5, fontFamily: FONT }}>
          {card.desc}
        </p>
      </div>
    </button>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [tab, setTab] = useState<'recommend' | 'popular'>('recommend')

  const sorted = tab === 'popular'
    ? [...CARDS].sort((a, b) => b.likes - a.likes)
    : CARDS

  function handleSelect(id: string) {
    localStorage.setItem('saturi_session', JSON.stringify({
      persona: id, travelStyle: null, companion: null,
      duration: null, budget: null, visitedPlaces: [],
      affinityScore: 0, satoriLevel: 'beginner', likedCategories: [],
    }))
    router.push(`/chat?persona=${id}`)
  }

  return (
    <main style={{
      minHeight: '100svh',
      background: '#F0F4FF',
      fontFamily: FONT,
      paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
      WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
    }}>

      {/* ── 헤더 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        background: '#fff',
        borderBottom: '1px solid #E8EEF8',
      }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#1B3A8C', fontFamily: FONT }}>
          포항 친구 찾기
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 20 }}>
          <span style={{ cursor: 'pointer' }}>🕐</span>
          <span style={{ color: '#EF4444', cursor: 'pointer' }}>♡</span>
        </div>
      </div>

      {/* ── 탭 */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderBottom: '1px solid #E8EEF8',
        padding: '0 8px',
      }}>
        {(['recommend', 'popular'] as const).map(t => {
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '13px 16px',
                fontFamily: FONT,
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                color: active ? '#1B3A8C' : '#9CA3AF',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                borderBottom: active ? '2px solid #1B3A8C' : '2px solid transparent',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'color 0.15s',
              }}
            >
              {t === 'recommend' ? '추천' : '인기순'}
            </button>
          )
        })}
      </div>

      {/* ── 카드 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        padding: '14px 14px 0',
      }}>
        {sorted.map(card => (
          <CardItem key={card.id} card={card} onClick={() => handleSelect(card.id)} />
        ))}
      </div>

      {/* ── 하단 CTA 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 768, margin: '0 auto',
        padding: '12px 18px',
        paddingBottom: 'calc(18px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top, #F0F4FF 60%, transparent)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => router.push('/chat')}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #1B3A8C 0%, #2563EB 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: FONT,
            border: 'none',
            borderRadius: 50,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(27,58,140,0.38)',
            WebkitTapHighlightColor: 'transparent',
            pointerEvents: 'auto',
            letterSpacing: '-0.2px',
          }}
        >
          + 나만의 여행 코스 만들기
        </button>
      </div>
    </main>
  )
}
