'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PERSONAS } from '@/lib/personas'
import type { PersonaId } from '@/types'

const STRENGTH_COLOR: Record<string, string> = {
  '자연·액티비티': '#34D399',
  '로컬 숨은 명소': '#00D4FF',
  '감성·힐링':     '#A78BFA',
  '포토스팟':      '#F472B6',
  '역사·문화':     '#FBBF24',
  '맛집탐방':      '#FF6B35',
}

export default function HomePage() {
  const router   = useRouter()
  const [selected,  setSelected]  = useState<PersonaId | null>(null)
  const [starting, setStarting]  = useState(false)

  async function handleStart() {
    if (!selected) return
    setStarting(true)
    localStorage.setItem('saturi_session', JSON.stringify({
      persona: selected, travelStyle: null, companion: null,
      duration: null, budget: null, visitedPlaces: [],
      affinityScore: 0, satoriLevel: 'beginner', likedCategories: [],
    }))
    router.push(`/chat?persona=${selected}`)
  }

  const p = PERSONAS.find(x => x.id === selected)

  return (
    <main className="min-h-screen bg-grid flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── 히어로 ──────────────────────────────────────────── */}
      <div className="relative pt-14 pb-8 px-5 text-center overflow-hidden">
        {/* 배경 글로우 오브 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.12), transparent 70%)' }} />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-bold tracking-wider"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid var(--border-cyan)', color: 'var(--cyan)' }}>
          🏆 2026 관광데이터 활용 공모전
        </div>

        <h1 className="text-5xl font-black tracking-tight mb-2">
          <span className="text-white">사투리</span>
          <span className="ml-2 glow-text-cyan" style={{ color: 'var(--cyan)' }}>패스</span>
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--steel)' }}>
          포항에 사는 AI 친구를 골라봐라<br />
          <span className="text-white/60">그 친구가 아는 포항을 전부 알려줄기라</span>
        </p>
      </div>

      {/* ── 페르소나 카드 ────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-48">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--steel)' }}>
            AI 친구 선택
          </span>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
          {PERSONAS.map((persona, i) => {
            const isSelected = selected === persona.id
            return (
              <button
                key={persona.id}
                onClick={() => setSelected(persona.id as PersonaId)}
                className="text-left rounded-3xl p-4 transition-all duration-300 active:scale-[0.97] animate-slide-up"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: 'both',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,212,255,0.02))'
                    : 'var(--glass)',
                  border: isSelected
                    ? '1px solid rgba(0,212,255,0.4)'
                    : '1px solid var(--border)',
                  boxShadow: isSelected
                    ? '0 0 24px rgba(0,212,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : 'none',
                }}
              >
                {/* 상단: 아이콘 + 이름 */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br ${persona.gradient}`}
                    style={{ boxShadow: isSelected ? `0 0 16px rgba(0,212,255,0.3)` : 'none' }}
                  >
                    {persona.symbol}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-base">{persona.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--cyan)', border: '1px solid var(--border-cyan)' }}>
                          선택됨
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--steel)' }}>
                      {persona.age}세 · {persona.job}
                    </span>
                  </div>
                </div>

                {/* 사투리 샘플 */}
                <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  &ldquo;{persona.dialectSample}&rdquo;
                </p>

                {/* 강점 태그 */}
                <div className="flex flex-wrap gap-1.5">
                  {persona.strength.map(s => (
                    <span
                      key={s}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{
                        background: `${STRENGTH_COLOR[s] ?? '#00D4FF'}15`,
                        color: STRENGTH_COLOR[s] ?? '#00D4FF',
                        border: `1px solid ${STRENGTH_COLOR[s] ?? '#00D4FF'}30`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 하단 CTA ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-6 max-w-2xl mx-auto z-10"
        style={{ background: 'linear-gradient(to top, var(--bg) 60%, transparent)' }}>

        {/* 시작 버튼 */}
        <button
          onClick={handleStart}
          disabled={!selected || starting}
          className="w-full py-4 rounded-2xl font-black text-base transition-all duration-300 active:scale-[0.97]"
          style={selected ? {
            background: 'linear-gradient(135deg, var(--cyan), #0099CC)',
            boxShadow: '0 4px 32px rgba(0,212,255,0.4)',
            color: '#000',
          } : {
            background: 'var(--glass-2)',
            border: '1px solid var(--border)',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {starting
            ? '연결 중…'
            : selected
              ? `${p?.name}랑 포항 탐험 시작하기 →`
              : '친구를 먼저 골라봐라'
          }
        </button>

        {/* 보조 버튼 */}
        {selected && (
          <div className="grid grid-cols-2 gap-2 mt-2 animate-fade-in">
            <button
              onClick={() => router.push(`/map?persona=${selected}`)}
              className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'var(--glass)', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.5)' }}
            >
              🗺️ 지도 먼저 보기
            </button>
            <button
              onClick={() => router.push(`/mission?persona=${selected}`)}
              className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'var(--glass)', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.5)' }}
            >
              🏆 미션 보기
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
