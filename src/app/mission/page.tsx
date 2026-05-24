'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MISSIONS } from '@/data/missions'
import type { Mission, Voucher, MissionCategory } from '@/data/missions'
import PointsHeader from '@/components/PointsHeader'
import MissionCard from '@/components/MissionCard'
import BarcodeCard from '@/components/BarcodeCard'
import VoucherModal from '@/components/VoucherModal'

// ── 토스트 ──────────────────────────────────────────────────────────────────
interface ToastItem { id: string; message: string }

function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-24 left-0 right-0 max-w-[430px] mx-auto px-4 z-[60] pointer-events-none flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-gray-900/95 text-white text-sm px-5 py-3 rounded-2xl shadow-xl animate-fade-in backdrop-blur"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ── 타입 ─────────────────────────────────────────────────────────────────────
type Tab = 'missions' | 'vouchers'
type CategoryFilter = 'all' | MissionCategory

const CATEGORIES: { label: string; value: CategoryFilter }[] = [
  { label: '전체', value: 'all' },
  { label: '📍 장소', value: 'place' },
  { label: '🍽️ 맛집', value: 'food' },
  { label: '💬 퀴즈', value: 'quiz' },
  { label: '🎭 챌린지', value: 'challenge' },
  { label: '🏆 컬렉션', value: 'collection' },
]

// ── 메인 컨텐츠 ───────────────────────────────────────────────────────────────
function MissionContent() {
  const router = useRouter()
  const params = useSearchParams()
  const personaId = params.get('persona') ?? 'yeonoh'

  const [points, setPoints] = useState(0)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [coupons, setCoupons] = useState<Voucher[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('missions')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [todayMissions, setTodayMissions] = useState<Mission[]>([])

  // localStorage 초기화
  useEffect(() => {
    setPoints(Number(localStorage.getItem('saturi_points') ?? '0'))
    setCompletedIds(JSON.parse(localStorage.getItem('completed_missions') ?? '[]'))
    setCoupons(JSON.parse(localStorage.getItem('my_coupons') ?? '[]'))

    // 오늘의 미션: 컬렉션 제외 랜덤 3개
    const eligible = MISSIONS.filter((m) => m.category !== 'collection')
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    setTodayMissions(shuffled.slice(0, 3))
  }, [])

  // localStorage 동기화
  useEffect(() => { localStorage.setItem('saturi_points', String(points)) }, [points])
  useEffect(() => { localStorage.setItem('completed_missions', JSON.stringify(completedIds)) }, [completedIds])
  useEffect(() => { localStorage.setItem('my_coupons', JSON.stringify(coupons)) }, [coupons])

  // 토스트 추가
  const addToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  // 미션 완료
  const handleComplete = useCallback(
    (mission: Mission) => {
      if (completedIds.includes(mission.id)) return

      const newCompleted = [...completedIds, mission.id]
      setCompletedIds(newCompleted)
      setPoints((prev) => prev + mission.reward)
      addToast(`🎉 +${mission.reward}P 획득했다카이!`)

      // 컬렉션 자동 해금 체크
      setTimeout(() => {
        MISSIONS.filter((m) => m.category === 'collection').forEach((cm) => {
          if (!newCompleted.includes(cm.id) && cm.requires) {
            if (cm.requires.every((id) => newCompleted.includes(id))) {
              setCompletedIds((prev) => {
                if (prev.includes(cm.id)) return prev
                return [...prev, cm.id]
              })
              setPoints((prev) => prev + cm.reward)
              addToast(`🏆 ${cm.title} 달성! +${cm.reward}P`)
            }
          }
        })
      }, 800)
    },
    [completedIds, addToast]
  )

  // 상품권 교환
  const handleExchange = useCallback(
    (voucher: Voucher) => {
      setPoints((prev) => prev - voucher.amount)
      setCoupons((prev) => [voucher, ...prev])
      setShowModal(false)
      setActiveTab('vouchers')
      addToast(`🎉 ${voucher.amount.toLocaleString()}원 상품권 발급됐다카이!`)
    },
    [addToast]
  )

  // 사용완료 처리
  const handleMarkUsed = useCallback((id: string) => {
    setCoupons((prev) =>
      prev.map((v) => (v.id === id ? { ...v, usedAt: new Date().toISOString() } : v))
    )
  }, [])

  // 필터된 미션 목록
  const filtered = useMemo(
    () => MISSIONS.filter((m) => category === 'all' || m.category === category),
    [category]
  )

  // 컬렉션 잠금 여부
  function isLocked(m: Mission) {
    if (!m.requires) return false
    return !m.requires.every((id) => completedIds.includes(id))
  }

  // 컬렉션 진행률
  function collProg(m: Mission): { done: number; total: number } | undefined {
    if (!m.requires) return undefined
    return {
      done: m.requires.filter((id) => completedIds.includes(id)).length,
      total: m.requires.length,
    }
  }

  const todayIds = new Set(todayMissions.map((m) => m.id))

  return (
    <main className="min-h-screen bg-gray-50 max-w-[430px] mx-auto flex flex-col">

      {/* ── 고정 헤더 ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30">
        {/* 내비게이션 바 */}
        <div style={{ backgroundColor: '#1B3A8C' }} className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={() => router.back()}
            className="text-white/60 hover:text-white text-xl transition-colors"
          >
            ←
          </button>
          <span className="font-bold text-white text-base flex-1">포항 미션</span>
          <button
            onClick={() => router.push(`/map?persona=${personaId}`)}
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            🗺️ 지도
          </button>
        </div>

        {/* 포인트 헤더 */}
        <PointsHeader
          points={points}
          completedCount={completedIds.length}
          totalCount={MISSIONS.length}
          onExchange={() => setShowModal(true)}
        />

        {/* 탭 */}
        <div style={{ backgroundColor: '#1B3A8C' }} className="flex px-4">
          {(['missions', 'vouchers'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              {tab === 'missions' ? '미션' : '내 상품권'}
              {tab === 'vouchers' && coupons.length > 0 && (
                <span className="ml-1 text-xs bg-white/30 px-1.5 py-0.5 rounded-full">
                  {coupons.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 미션 탭 ──────────────────────────────────────────── */}
      {activeTab === 'missions' && (
        <div className="flex-1 px-4 pt-4 pb-28 space-y-5">

          {/* 오늘의 미션 */}
          {todayMissions.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-700 mb-2">🔥 오늘의 미션</h2>
              <div className="space-y-2">
                {todayMissions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    isCompleted={completedIds.includes(m.id)}
                    isLocked={false}
                    isHighlighted
                    onComplete={() => handleComplete(m)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 카테고리 필터 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === c.value
                    ? 'text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                }`}
                style={category === c.value ? { backgroundColor: '#1B3A8C' } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* 전체 미션 목록 */}
          <section>
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              {CATEGORIES.find((c) => c.value === category)?.label ?? '전체'} 미션
              <span className="ml-1.5 text-gray-400 font-normal">
                {filtered.filter((m) => completedIds.includes(m.id)).length}/{filtered.length}
              </span>
            </h2>
            <div className="space-y-2">
              {filtered.map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  isCompleted={completedIds.includes(m.id)}
                  isLocked={isLocked(m)}
                  isHighlighted={todayIds.has(m.id)}
                  collectionProgress={collProg(m)}
                  onComplete={() => handleComplete(m)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── 내 상품권 탭 ─────────────────────────────────────── */}
      {activeTab === 'vouchers' && (
        <div className="flex-1 px-4 pt-4 pb-28">
          {coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">🎫</div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                아직 상품권이 없다카이!<br />
                미션 완료하고 포인트 모아봐라~
              </p>
              <button
                onClick={() => setActiveTab('missions')}
                className="px-8 py-3 rounded-2xl text-sm font-bold text-white shadow-md active:scale-[0.97] transition-transform"
                style={{ backgroundColor: '#1B3A8C' }}
              >
                미션 하러 가기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((v) => (
                <BarcodeCard
                  key={v.id}
                  voucher={v}
                  onMarkUsed={() => handleMarkUsed(v.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 하단 고정 버튼 ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 py-4 bg-white border-t border-gray-100 z-20">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-transform"
          style={{ backgroundColor: '#1B3A8C' }}
        >
          💰 포인트 사용하기
        </button>
      </div>

      {/* ── 상품권 교환 모달 ──────────────────────────────────── */}
      {showModal && (
        <VoucherModal
          points={points}
          onClose={() => setShowModal(false)}
          onExchange={handleExchange}
        />
      )}

      {/* ── 토스트 ─────────────────────────────────────────────── */}
      <ToastStack toasts={toasts} />
    </main>
  )
}

export default function MissionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🏆</div>
          <div className="text-gray-500 text-sm">불러오는 중…</div>
        </div>
      </div>
    }>
      <MissionContent />
    </Suspense>
  )
}
