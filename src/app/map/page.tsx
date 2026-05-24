'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PERSONA_MAP } from '@/lib/personas'
import type { TravelStyle } from '@/types'
import type { MapPlace } from '@/components/MapView'

import 'leaflet/dist/leaflet.css'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

// ── 카테고리 탭 ────────────────────────────────────────────────
const STYLES: { label: string; value: TravelStyle | 'all'; emoji: string; color: string }[] = [
  { label: '전체',  value: 'all',        emoji: '✦',  color: '#00D4FF' },
  { label: '감성',  value: '감성·힐링',  emoji: '🌿', color: '#A78BFA' },
  { label: '맛집',  value: '맛집탐방',   emoji: '🐟', color: '#FF6B35' },
  { label: '자연',  value: '자연·액티비티', emoji: '🏄', color: '#34D399' },
  { label: '역사',  value: '역사·문화',  emoji: '🏯', color: '#FBBF24' },
  { label: '포토',  value: '포토스팟',   emoji: '📸', color: '#F472B6' },
  { label: '숨은',  value: '로컬 숨은 명소', emoji: '🗺️', color: '#00D4FF' },
]

// ── 컨텐츠 ────────────────────────────────────────────────────
function MapContent() {
  const params    = useSearchParams()
  const router    = useRouter()
  const personaId = params.get('persona') ?? 'yeonoh'
  const persona   = PERSONA_MAP[personaId]

  const [places,      setPlaces]      = useState<MapPlace[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeStyle, setActiveStyle] = useState<TravelStyle | 'all'>('all')
  const [selected,    setSelected]    = useState<MapPlace | null>(null)
  const [flyTo,       setFlyTo]       = useState<[number, number] | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/map?persona=${personaId}`)
      const data = await res.json()
      setPlaces(data.places ?? [])
    } catch { setPlaces([]) }
    finally  { setLoading(false) }
  }, [personaId])

  useEffect(() => { load() }, [load])

  function onSelect(place: MapPlace) {
    setSelected(place)
    if (place.lat && place.lng) setFlyTo([place.lat, place.lng])
  }

  function onStyleChange(style: TravelStyle | 'all') {
    setActiveStyle(style)
    setSelected(null)
  }

  const activeColor  = STYLES.find(s => s.value === activeStyle)?.color ?? '#00D4FF'
  const visibleCount = activeStyle === 'all'
    ? places.length
    : places.filter(p => p.travelStyle === activeStyle).length

  return (
    // 풀스크린 앱 레이아웃
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── 지도 (최하단 레이어) ─────────────────────────────── */}
      <div className="absolute inset-0">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center animate-pulse-cyan">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--steel)' }}>포항 지도 불러오는 중…</p>
          </div>
        ) : (
          <MapView
            places={places}
            activeStyle={activeStyle}
            selectedId={selected?.contentId ?? null}
            onSelect={onSelect}
            flyTo={flyTo}
          />
        )}
      </div>

      {/* ── 상단 플로팅 헤더 ──────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 max-w-2xl mx-auto">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white transition-colors text-lg leading-none"
          >
            ←
          </button>

          {/* 페르소나 아이콘 */}
          {persona && (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm bg-gradient-to-br ${persona.gradient} flex-shrink-0`}>
              {persona.symbol}
            </div>
          )}

          {/* 타이틀 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">포항 지도</span>
              {!loading && (
                <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', border: '1px solid var(--border-cyan)' }}>
                  {visibleCount}곳
                </span>
              )}
            </div>
          </div>

          {/* 채팅 버튼 */}
          <button
            onClick={() => router.push(`/chat?persona=${personaId}`)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white flex-shrink-0 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--cyan), #0099CC)', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}
          >
            💬 채팅
          </button>
        </div>
      </div>

      {/* ── 카테고리 필터 (하단 플로팅) ──────────────────────── */}
      <div
        className="absolute left-0 right-0 z-20 px-4 max-w-2xl mx-auto"
        style={{ bottom: selected ? '280px' : '80px', transition: 'bottom 0.3s cubic-bezier(0.32,0.72,0,1)' }}
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
          {STYLES.map(s => {
            const active = activeStyle === s.value
            return (
              <button
                key={s.value}
                onClick={() => onStyleChange(s.value)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95"
                style={active
                  ? { background: s.color, color: '#000', boxShadow: `0 0 14px ${s.color}55` }
                  : { background: 'var(--glass-2)', backdropFilter: 'blur(16px)', color: 'rgba(255,255,255,0.6)', border: '1px solid var(--border)' }
                }
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 선택된 장소 디테일 시트 ───────────────────────────── */}
      {selected && (
        <div
          className="absolute bottom-16 left-0 right-0 z-30 px-4 max-w-2xl mx-auto animate-slide-up-fast"
        >
          <div className="glass-strong rounded-3xl overflow-hidden" style={{ border: `1px solid ${activeColor}30` }}>
            {/* 닫기 핸들 */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-4 text-white/40 hover:text-white text-xl z-10"
            >
              ×
            </button>

            <div className="flex gap-3 p-4">
              {/* 이미지 */}
              {selected.imageUrl ? (
                <img
                  src={selected.imageUrl}
                  alt={selected.name}
                  className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  style={{ boxShadow: `0 0 16px ${activeColor}40` }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl"
                  style={{ background: `${activeColor}15`, border: `1px solid ${activeColor}30` }}
                >
                  {STYLES.find(s => s.value === selected.travelStyle)?.emoji ?? '📍'}
                </div>
              )}

              {/* 텍스트 */}
              <div className="flex-1 min-w-0 pr-6">
                {/* 카테고리 뱃지 */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${activeColor}20`, color: activeColor }}
                >
                  {STYLES.find(s => s.value === selected.travelStyle)?.emoji} {selected.travelStyle}
                </span>
                <h3 className="font-black text-white text-base mt-1 leading-tight">{selected.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--steel)' }}>{selected.address}</p>
                {selected.personaLine && (
                  <p className="text-xs mt-2 italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    &ldquo;{selected.personaLine}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* 채팅 CTA */}
            <div className="px-4 pb-4">
              <button
                onClick={() => router.push(`/chat?persona=${personaId}`)}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${activeColor}CC, ${activeColor}88)`,
                  boxShadow: `0 4px 20px ${activeColor}40`,
                }}
              >
                {persona?.name ?? '가이드'}한테 더 물어보기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse-cyan">🗺️</div>
          <p className="text-sm" style={{ color: 'var(--steel)' }}>불러오는 중…</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  )
}
