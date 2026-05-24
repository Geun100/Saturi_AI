'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PERSONA_MAP } from '@/lib/personas'
import { getNextOnboardingStep, getOnboardingQuestion } from '@/lib/onboarding'
import OnboardingOptions from '@/components/OnboardingOptions'
import { calcMatchScore, findMentionedPlaces } from '@/lib/analytics'
import { MISSIONS, getLevel } from '@/data/missions'
import type { Mission, Voucher, MissionCategory } from '@/data/missions'
import MissionCard from '@/components/MissionCard'
import BarcodeCard from '@/components/BarcodeCard'
import VoucherModal from '@/components/VoucherModal'
import type { UserSession, ChatMessage } from '@/types'
import type { OnboardingStep } from '@/lib/onboarding'
import type { MapPlace } from '@/components/MapView'
import 'leaflet/dist/leaflet.css'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

// ── 상수 ─────────────────────────────────────────────────────────────────────
const COMPACT_H    = 128   // 핸들 + 페르소나 헤더 + 탭바 (px)
const OPEN_H       = 496   // 확장 시트 높이 (px)
const CHAT_INPUT_H = 76    // 입력창 고정 높이 (px)

const DEFAULT_SESSION: UserSession = {
  persona: null, travelStyle: null, companion: null, duration: null, budget: null,
  visitedPlaces: [], affinityScore: 0, satoriLevel: 'beginner', likedCategories: [],
}

type SheetTab     = 'chat' | 'mission' | 'voucher'
type CategoryFilt = 'all' | MissionCategory

const MISSION_CATS: { label: string; value: CategoryFilt }[] = [
  { label: '전체',       value: 'all' },
  { label: '📍 장소',   value: 'place' },
  { label: '🍽️ 맛집',  value: 'food' },
  { label: '💬 퀴즈',   value: 'quiz' },
  { label: '🎭 챌린지', value: 'challenge' },
  { label: '🏆 컬렉션', value: 'collection' },
]

// ── 토스트 ────────────────────────────────────────────────────────────────────
interface Toast { id: string; msg: string }

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null
  return (
    <div className="fixed left-0 right-0 max-w-[430px] mx-auto px-4 z-50 pointer-events-none flex flex-col items-center gap-2"
      style={{ bottom: `${OPEN_H + 12}px` }}>
      {toasts.map(t => (
        <div key={t.id}
          className="bg-gray-900/95 text-white text-sm px-5 py-3 rounded-2xl shadow-xl animate-fade-in backdrop-blur-sm">
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── 메인 컨텐츠 ───────────────────────────────────────────────────────────────
function ChatContent() {
  const router = useRouter()

  // personaId는 useEffect 안에서만 결정 (SSR에서 window 없음 → lazy init 못 씀)
  const [personaId, setPersonaId] = useState('')
  const [session,   setSession]   = useState<UserSession>({ ...DEFAULT_SESSION })

  const persona = PERSONA_MAP[personaId]

  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('travelStyle')

  // ── 지도 ───────────────────────────────────────────────────────
  const [mapPlaces,      setMapPlaces]      = useState<MapPlace[]>([])
  const [flyTo,          setFlyTo]          = useState<[number, number] | null>(null)
  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [selectedPlace,  setSelectedPlace]  = useState<MapPlace | null>(null)
  const [matchScores,    setMatchScores]    = useState<Record<string, number>>({})

  // ── 미션 / 상품권 ──────────────────────────────────────────────
  const [points,          setPoints]          = useState(0)
  const [completedIds,    setCompletedIds]    = useState<string[]>([])
  const [coupons,         setCoupons]         = useState<Voucher[]>([])
  const [todayMissions,   setTodayMissions]   = useState<Mission[]>([])
  const [missionCat,      setMissionCat]      = useState<CategoryFilt>('all')
  const [showVoucherModal,setShowVoucherModal]= useState(false)

  // ── UI 상태 ─────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(true)
  const [sheetTab,  setSheetTab]  = useState<SheetTab>('chat')
  const [toasts,    setToasts]    = useState<Toast[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerH, setHeaderH] = useState(140)

  // ── Effects ─────────────────────────────────────────────────────

  // 마운트 시 단 한 번: personaId 결정 → 세션 로드 → 첫 메시지까지 원자적으로 설정
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('persona') ?? ''
    let id = ''
    if (fromUrl && PERSONA_MAP[fromUrl]) {
      id = fromUrl
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('saturi_session') ?? '{}')
        if (saved.persona && PERSONA_MAP[saved.persona]) id = saved.persona as string
      } catch {}
    }

    if (!id) { router.replace('/'); return }

    // URL에 persona 파라미터가 있으면 홈에서 넘어온 것 → 온보딩 처음부터
    // localStorage에서만 찾은 경우 → 저장된 세션 복원
    let loadedSession: UserSession = { ...DEFAULT_SESSION, persona: id as UserSession['persona'] }
    if (!fromUrl) {
      try {
        const raw = localStorage.getItem('saturi_session')
        if (raw) {
          const parsed = JSON.parse(raw) as UserSession
          if (parsed.persona === id) loadedSession = parsed
        }
      } catch {}
    }

    // 포인트 / 미션 로드
    try { setPoints(Number(localStorage.getItem('saturi_points') ?? '0')) } catch {}
    try { setCompletedIds(JSON.parse(localStorage.getItem('completed_missions') ?? '[]')) } catch {}
    try { setCoupons(JSON.parse(localStorage.getItem('my_coupons') ?? '[]')) } catch {}
    const eligible = MISSIONS.filter(m => m.category !== 'collection')
    setTodayMissions([...eligible].sort(() => Math.random() - 0.5).slice(0, 3))

    // 첫 메시지를 loadedSession 기준으로 바로 생성 → race condition 없음
    const step = getNextOnboardingStep(loadedSession)

    setPersonaId(id)
    setSession(loadedSession)
    setCurrentStep(step)
    setMessages([{ role: 'assistant', content: getOnboardingQuestion(id, step), timestamp: Date.now() }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 지도 데이터 fetch
  useEffect(() => {
    if (!personaId) return
    fetch(`/api/map?persona=${personaId}`)
      .then(r => r.json())
      .then(d => setMapPlaces(d.places ?? []))
      .catch(() => {})
  }, [personaId])

  useEffect(() => {
    if (!mapPlaces.length) return
    const s: Record<string, number> = {}
    mapPlaces.forEach(p => { s[p.contentId] = calcMatchScore(p, session) })
    setMatchScores(s)
  }, [mapPlaces, session])

  useEffect(() => {
    if (sheetOpen && sheetTab === 'chat') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, loading, sheetOpen, sheetTab])

  useEffect(() => {
    if (!personaId) return  // 초기화 전엔 저장 안 함 (홈에서 저장한 세션 덮어쓰기 방지)
    localStorage.setItem('saturi_session', JSON.stringify(session))
  }, [session, personaId])
  useEffect(() => { localStorage.setItem('saturi_points', String(points)) }, [points])
  useEffect(() => { localStorage.setItem('completed_missions', JSON.stringify(completedIds)) }, [completedIds])
  useEffect(() => { localStorage.setItem('my_coupons', JSON.stringify(coupons)) }, [coupons])

  // 헤더 높이 측정
  useEffect(() => {
    if (!headerRef.current) return
    const obs = new ResizeObserver(() => {
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight)
    })
    obs.observe(headerRef.current)
    setHeaderH(headerRef.current.offsetHeight)
    return () => obs.disconnect()
  }, [])

  // ── 훅 기반 핸들러 (Rules of Hooks: early return 전에 모두 선언) ───────────

  const addToast = useCallback((msg: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const handleMissionComplete = useCallback((mission: Mission) => {
    if (completedIds.includes(mission.id)) return
    const next = [...completedIds, mission.id]
    setCompletedIds(next)
    setPoints(prev => prev + mission.reward)
    addToast(`🎉 +${mission.reward}P 획득했다카이!`)
    setTimeout(() => {
      MISSIONS.filter(m => m.category === 'collection').forEach(cm => {
        if (!next.includes(cm.id) && cm.requires?.every(id => next.includes(id))) {
          setCompletedIds(prev => prev.includes(cm.id) ? prev : [...prev, cm.id])
          setPoints(prev => prev + cm.reward)
          addToast(`🏆 ${cm.title} 달성! +${cm.reward}P`)
        }
      })
    }, 800)
  }, [completedIds, addToast])

  const handleVoucherExchange = useCallback((voucher: Voucher) => {
    setPoints(prev => prev - voucher.amount)
    setCoupons(prev => [voucher, ...prev])
    setShowVoucherModal(false)
    setSheetTab('voucher')
    addToast(`🎉 ${voucher.amount.toLocaleString()}원 상품권 발급됐다카이!`)
  }, [addToast])

  // useMemo는 조건부 return 앞에 선언해야 Rules of Hooks 위반 없음
  const filteredMissions = useMemo(
    () => MISSIONS.filter(m => missionCat === 'all' || m.category === missionCat),
    [missionCat]
  )
  const todaySet = useMemo(() => new Set(todayMissions.map(m => m.id)), [todayMissions])

  // personaId 로딩 전 or 잘못된 경우 로딩 표시 (redirect는 useEffect가 처리)
  if (!persona) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0B1929' }}>
      <div className="text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm text-white/50">포항 불러오는 중…</p>
      </div>
    </div>
  )

  // ── 나머지 핸들러 ─────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    setSheetTab('chat')
    setSheetOpen(true)

    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, personaId, session }),
      })
      const data = await res.json()

      if (data.session) {
        setSession(data.session)
        setCurrentStep(getNextOnboardingStep(data.session))
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: data.message ?? '(응답 없음)',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, botMsg])

      // AI 언급 장소 → 지도 이동 + 핀 하이라이트
      if (mapPlaces.length > 0 && data.message) {
        const mentioned = findMentionedPlaces(data.message, mapPlaces)
        if (mentioned.length > 0) {
          setHighlightedIds(mentioned.map(p => p.contentId))
          const first = mentioned[0]
          if (first.lat && first.lng) setFlyTo([first.lat, first.lng])
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '잠깐, 연결이 끊겼다카이. 다시 해봐라.', timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }



  function askAboutPlace(place: MapPlace) {
    setSelectedPlace(null)
    setSheetTab('chat')
    setSheetOpen(true)
    setInput(`${place.name}에 대해 알려줘`)
    setTimeout(() => inputRef.current?.focus(), 150)
  }

  // ── 파생 상태 ────────────────────────────────────────────────────

  const isOnboarding = currentStep !== 'done'
  const affinityPct  = Math.min(session.affinityScore, 100)
  const sheetH       = sheetOpen ? OPEN_H : COMPACT_H
  const { num: lvNum, label: lvLabel } = getLevel(points)

  function isLocked(m: Mission) {
    return m.requires ? !m.requires.every(id => completedIds.includes(id)) : false
  }
  function collProg(m: Mission) {
    if (!m.requires) return undefined
    return { done: m.requires.filter(id => completedIds.includes(id)).length, total: m.requires.length }
  }

  // ── 렌더 ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0B1929' }}>

      {/* ── 지도 (전체 화면) — zIndex:0 으로 별도 stacking context 형성
           Leaflet 내부 레이어(z=200~700)가 대화창(z=40)을 덮지 않도록 차단 */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <MapView
          places={mapPlaces}
          activeStyle="all"
          selectedId={selectedPlace?.contentId ?? null}
          onSelect={p => { setSelectedPlace(p); if (p.lat && p.lng) setFlyTo([p.lat, p.lng]) }}
          flyTo={flyTo}
          highlightedIds={highlightedIds}
          matchScores={matchScores}
        />
      </div>

      {/* ── 뒤로가기 */}
      <div className="absolute top-4 left-4" style={{ zIndex: 41 }}>
        <button
          onClick={() => router.push('/')}
          className="glass rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
        >
          ← 홈
        </button>
      </div>

      {/* ── 선택된 핀 카드 (시트 위에 뜸) */}
      {selectedPlace && (
        <div
          className="absolute left-0 right-0 px-4 max-w-[430px] mx-auto animate-fade-in"
          style={{ bottom: `${sheetH + 10}px`, zIndex: 41, transition: 'bottom 0.35s cubic-bezier(0.32,0.72,0,1)' }}
        >
          <div className="bg-white rounded-2xl p-3 flex items-center gap-3"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.22)' }}>
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              {selectedPlace.imageUrl
                ? <img src={selectedPlace.imageUrl} alt={selectedPlace.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl">📍</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-tight truncate">{selectedPlace.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{selectedPlace.address}</p>
              {matchScores[selectedPlace.contentId] !== undefined && (
                <p className="text-xs font-bold mt-0.5" style={{ color: '#1B3A8C' }}>
                  {matchScores[selectedPlace.contentId]}% 매칭
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={() => askAboutPlace(selectedPlace)}
                className="text-xs px-3 py-1.5 rounded-xl font-bold text-white active:scale-95 transition-transform"
                style={{ background: '#1B3A8C' }}
              >
                💬 물어보기
              </button>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-xs px-3 py-1.5 rounded-xl text-gray-400 bg-gray-100 text-center"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 바텀 시트 */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto"
        style={{ height: `${sheetH}px`, transition: 'height 0.35s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {/* 절대 위치 기반 레이아웃 — flex 높이 계산 오류 방지 */}
        <div
          className="h-full bg-white rounded-t-3xl overflow-hidden relative"
          style={{ boxShadow: '0 -6px 32px rgba(0,0,0,0.22)' }}
        >
          {/* ── 고정 헤더 영역 (높이 측정용 ref) */}
          <div ref={headerRef} className="absolute top-0 left-0 right-0 z-10 bg-white rounded-t-3xl">
            {/* 핸들 */}
            <button
              onClick={() => setSheetOpen(v => !v)}
              className="w-full pt-3 pb-1 flex justify-center"
            >
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </button>

            {/* 페르소나 헤더 */}
            <div className="px-4 pb-2 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-br ${persona.gradient} flex-shrink-0`}>
                {persona.symbol}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900 text-sm">{persona.name}</span>
                  <span className="text-gray-400 text-xs">{persona.age}세 · {persona.job}</span>
                </div>
                <div className="h-1 mt-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className={`h-full bg-gradient-to-r ${persona.gradient} transition-all duration-700`}
                    style={{ width: `${affinityPct}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-gray-400">Lv.{lvNum} {lvLabel}</div>
                <div className="text-sm font-black" style={{ color: '#1B3A8C' }}>
                  {points.toLocaleString()}P
                </div>
              </div>
            </div>

            {/* 탭 바 */}
            <div className="px-4 pb-3">
              <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1">
                {(['chat', 'mission', 'voucher'] as SheetTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setSheetTab(tab); setSheetOpen(true) }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                      sheetTab === tab ? 'bg-white shadow-sm' : 'text-gray-400'
                    }`}
                    style={{ color: sheetTab === tab ? '#1B3A8C' : undefined }}
                  >
                    {tab === 'chat'      ? '💬 채팅'
                     : tab === 'mission' ? '🏆 미션'
                     : `🎫 상품권${coupons.length > 0 ? ` ${coupons.length}` : ''}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 탭 콘텐츠 (헤더 아래 절대 위치) */}
          {sheetOpen && (
            <div className="absolute left-0 right-0 bottom-0" style={{ top: headerH }}>

              {/* 채팅 탭 */}
              {sheetTab === 'chat' && (
                <>
                  {/* 메시지 영역 */}
                  <div
                    className="absolute inset-x-0 overflow-y-auto px-4 py-2 space-y-3 scrollbar-none"
                    style={{ top: 0, bottom: CHAT_INPUT_H, background: '#F8FAFD' }}
                  >
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        {msg.role === 'assistant' && (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm mr-2 mt-0.5 flex-shrink-0 bg-gradient-to-br ${persona.gradient}`}>
                            {persona.symbol}
                          </div>
                        )}
                        <div className={`max-w-[78%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className="rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                            style={msg.role === 'user'
                              ? { background: '#1B3A8C', color: '#fff', borderTopRightRadius: '6px' }
                              : { background: '#fff', border: '1px solid #E8EEFF', color: '#1a1a2e', borderTopLeftRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                            }
                          >
                            {msg.content}
                          </div>
                          {msg.role === 'assistant' && i === messages.length - 1 && isOnboarding && (
                            <OnboardingOptions step={currentStep} onSelect={val => sendMessage(val)} light />
                          )}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start animate-fade-in">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm mr-2 flex-shrink-0 bg-gradient-to-br ${persona.gradient}`}>
                          {persona.symbol}
                        </div>
                        <div className="rounded-2xl px-3 py-2.5"
                          style={{ background: '#fff', border: '1px solid #E8EEFF' }}>
                          <div className="flex gap-1.5 items-center h-5">
                            {[0, 150, 300].map(d => (
                              <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                                style={{ background: '#1B3A8C', opacity: 0.5, animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* 입력창 */}
                  <div
                    className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-2 pb-5"
                    style={{ height: CHAT_INPUT_H }}
                  >
                    <div className="flex gap-2 items-center bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                        placeholder={isOnboarding ? '또는 직접 입력해봐라…' : `${persona.name}한테 물어봐라…`}
                        disabled={loading}
                        className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
                      />
                      <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
                        style={input.trim() && !loading
                          ? { background: '#1B3A8C', color: '#fff' }
                          : { background: '#E5E7EB', color: '#9CA3AF' }
                        }
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m22 2-7 20-4-9-9-4 20-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* 미션 탭 */}
              {sheetTab === 'mission' && (
                <div className="absolute inset-0 overflow-y-auto scrollbar-none" style={{ background: '#F8FAFD' }}>
                  {/* 포인트 헤더 */}
                  <div className="px-4 pt-3 pb-3 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-2xl font-black" style={{ color: '#1B3A8C' }}>
                          {points.toLocaleString()}P
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          완료 {completedIds.length}/{MISSIONS.length} · Lv.{lvNum} {lvLabel}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowVoucherModal(true)}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                        style={{ background: '#1B3A8C' }}
                      >
                        💰 사용하기
                      </button>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((completedIds.length / MISSIONS.length) * 100)}%`, background: '#1B3A8C' }} />
                    </div>
                  </div>

                  <div className="px-4 pt-3 pb-6 space-y-4">
                    {/* 오늘의 미션 */}
                    {todayMissions.length > 0 && (
                      <section>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🔥 오늘의 미션</h2>
                        <div className="space-y-2">
                          {todayMissions.map(m => (
                            <MissionCard key={m.id} mission={m}
                              isCompleted={completedIds.includes(m.id)}
                              isLocked={false} isHighlighted
                              onComplete={() => handleMissionComplete(m)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* 카테고리 필터 */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                      {MISSION_CATS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setMissionCat(c.value)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            missionCat === c.value ? 'text-white' : 'bg-white text-gray-600 border border-gray-100'
                          }`}
                          style={missionCat === c.value ? { background: '#1B3A8C' } : {}}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* 미션 목록 */}
                    <section>
                      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        {MISSION_CATS.find(c => c.value === missionCat)?.label ?? '전체'} ·{' '}
                        {filteredMissions.filter(m => completedIds.includes(m.id)).length}/{filteredMissions.length}
                      </h2>
                      <div className="space-y-2">
                        {filteredMissions.map(m => (
                          <MissionCard key={m.id} mission={m}
                            isCompleted={completedIds.includes(m.id)}
                            isLocked={isLocked(m)}
                            isHighlighted={todaySet.has(m.id)}
                            collectionProgress={collProg(m)}
                            onComplete={() => handleMissionComplete(m)} />
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* 상품권 탭 */}
              {sheetTab === 'voucher' && (
                <div className="absolute inset-0 overflow-y-auto px-4 py-3 scrollbar-none" style={{ background: '#F8FAFD' }}>
                  {coupons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-5xl mb-3">🎫</div>
                      <p className="text-gray-500 text-sm leading-relaxed mb-5">
                        아직 상품권이 없다카이!<br />미션 완료하고 포인트 모아봐라~
                      </p>
                      <button
                        onClick={() => setSheetTab('mission')}
                        className="px-6 py-3 rounded-2xl text-sm font-bold text-white active:scale-95 transition-transform"
                        style={{ background: '#1B3A8C' }}
                      >
                        미션 하러 가기
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {coupons.map(v => (
                        <BarcodeCard key={v.id} voucher={v}
                          onMarkUsed={() => setCoupons(prev => prev.map(c => c.id === v.id ? { ...c, usedAt: new Date().toISOString() } : c))} />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 토스트 */}
      <ToastStack toasts={toasts} />

      {/* 상품권 교환 모달 */}
      {showVoucherModal && (
        <VoucherModal
          points={points}
          onClose={() => setShowVoucherModal(false)}
          onExchange={handleVoucherExchange}
        />
      )}
    </div>
  )
}

export default function ChatPage() {
  return <ChatContent />
}
