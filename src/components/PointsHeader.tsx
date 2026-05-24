'use client'

import { getLevel } from '@/data/missions'

interface Props {
  points: number
  completedCount: number
  totalCount: number
  onExchange: () => void
}

export default function PointsHeader({ points, completedCount, totalCount, onExchange }: Props) {
  const { num, label } = getLevel(points)

  return (
    <div style={{ backgroundColor: '#1B3A8C' }} className="px-5 pb-4 text-white">
      {/* 포인트 / 레벨 / 완료수 */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-xs text-white/60 mb-0.5">내 포인트</div>
          <div className="text-3xl font-black tracking-tight">
            💰 {points.toLocaleString()}P
          </div>
        </div>
        <div className="text-center pb-0.5">
          <div className="text-xs text-white/60 mb-0.5">레벨</div>
          <div className="text-lg font-black">Lv.{num}</div>
          <div className="text-xs text-white/70">{label}</div>
        </div>
        <div className="text-right pb-0.5">
          <div className="text-xs text-white/60 mb-0.5">완료</div>
          <div className="text-2xl font-black">{completedCount}</div>
          <div className="text-xs text-white/60">/ {totalCount}</div>
        </div>
      </div>

      {/* 상품권 교환 버튼 */}
      <button
        onClick={onExchange}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/30 bg-white/15 hover:bg-white/25 active:scale-[0.98] transition-all"
      >
        🏪 상품권 교환하기 →
      </button>
    </div>
  )
}
