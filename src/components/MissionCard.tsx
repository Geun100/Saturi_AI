'use client'

import type { Mission } from '@/data/missions'

const DIFF_MAP = {
  easy:   { label: '쉬움',   cls: 'bg-emerald-100 text-emerald-700' },
  medium: { label: '보통',   cls: 'bg-amber-100 text-amber-700' },
  hard:   { label: '어려움', cls: 'bg-red-100 text-red-700' },
}

interface Props {
  mission: Mission
  isCompleted: boolean
  isLocked: boolean
  isHighlighted?: boolean
  collectionProgress?: { done: number; total: number }
  onComplete: () => void
}

export default function MissionCard({
  mission, isCompleted, isLocked, isHighlighted, collectionProgress, onComplete,
}: Props) {
  const pct = collectionProgress
    ? Math.round((collectionProgress.done / collectionProgress.total) * 100)
    : isCompleted ? 100 : 0

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        isCompleted ? 'opacity-50' : ''
      } ${
        isHighlighted
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white border-gray-100'
      }`}
    >
      {/* 제목 + 난이도 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">{mission.icon}</span>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm leading-tight">{mission.title}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{mission.desc}</div>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${DIFF_MAP[mission.difficulty].cls}`}>
          {DIFF_MAP[mission.difficulty].label}
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: '#1B3A8C' }}
        />
      </div>

      {/* 포인트 + 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: '#1B3A8C' }}>
          💰 {mission.reward}P
        </span>

        {isCompleted ? (
          <span className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 font-medium">
            ✅ 완료됨
          </span>
        ) : isLocked ? (
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-0.5">선행 미션 필요</div>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 text-gray-400 font-medium">
              🔒 잠김
            </span>
          </div>
        ) : (
          <button
            onClick={onComplete}
            className="text-xs px-4 py-1.5 rounded-xl font-semibold text-white active:scale-95 transition-transform shadow-sm"
            style={{ backgroundColor: '#1B3A8C' }}
          >
            완료하기
          </button>
        )}
      </div>
    </div>
  )
}
