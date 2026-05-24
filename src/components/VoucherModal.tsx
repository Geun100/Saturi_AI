'use client'

import { useState } from 'react'
import type { Voucher } from '@/data/missions'

interface Props {
  points: number
  onClose: () => void
  onExchange: (voucher: Voucher) => void
}

const AMOUNTS = [
  { value: 1000, label: '1,000원권', sub: '1,000P 소요' },
  { value: 5000, label: '5,000원권', sub: '5,000P 소요' },
]

function makeBarcode(amount: number): string {
  const suffix = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `POH-${amount}-${suffix}`
}

export default function VoucherModal({ points, onClose, onExchange }: Props) {
  const [selectedAmount, setSelectedAmount] = useState(1000)
  const [qty, setQty] = useState(1)

  const totalCost = selectedAmount * qty
  const remaining = points - totalCost
  const canExchange = remaining >= 0 && qty >= 1

  function handleExchange() {
    if (!canExchange) return

    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + 30)

    // qty개만큼 상품권 생성 (마지막 것만 반환해서 탭 이동용)
    // 실제로는 qty번 onExchange 호출
    for (let i = 0; i < qty; i++) {
      const voucher: Voucher = {
        id: crypto.randomUUID(),
        type: 'voucher',
        amount: selectedAmount,
        barcode: makeBarcode(selectedAmount),
        issuedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        usedAt: null,
      }
      onExchange(voucher)
    }
  }

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-5 pb-8 max-w-[430px] mx-auto shadow-2xl">
        {/* 핸들 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <h2 className="text-lg font-black text-gray-900 mb-1">🏪 죽도시장 상품권 교환</h2>
        <p className="text-sm text-gray-500 mb-5">시장 입구 교환소에서 상품권을 받으세요</p>

        {/* 금액 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {AMOUNTS.map((a) => (
            <button
              key={a.value}
              onClick={() => setSelectedAmount(a.value)}
              className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                selectedAmount === a.value
                  ? 'border-blue-700 bg-blue-50'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className={`font-bold text-sm ${selectedAmount === a.value ? 'text-blue-800' : 'text-gray-700'}`}>
                {a.label}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{a.sub}</div>
            </button>
          ))}
        </div>

        {/* 수량 */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-gray-700">수량</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-gray-200 active:scale-90 transition-all"
            >
              −
            </button>
            <span className="text-lg font-bold w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-gray-200 active:scale-90 transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* 요약 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3.5 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">합계</span>
            <span className="font-bold text-gray-800">
              {totalCost.toLocaleString()}P → {totalCost.toLocaleString()}원 상품권
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">내 포인트</span>
            <span className="font-bold text-gray-800">{points.toLocaleString()}P</span>
          </div>
          <div className={`flex justify-between text-sm font-bold ${remaining < 0 ? 'text-red-500' : 'text-gray-800'}`}>
            <span className="text-gray-500 font-normal">차감 후</span>
            <span>{remaining.toLocaleString()}P</span>
          </div>
        </div>

        {!canExchange && (
          <p className="text-center text-red-500 text-sm mb-3 font-semibold">
            포인트가 부족하다카이!
          </p>
        )}

        <button
          onClick={handleExchange}
          disabled={!canExchange}
          className={`w-full py-4 rounded-2xl font-bold text-white text-sm transition-all ${
            canExchange ? 'active:scale-[0.98]' : 'opacity-40 cursor-not-allowed'
          }`}
          style={{ backgroundColor: '#1B3A8C' }}
        >
          교환하기
        </button>
      </div>
    </>
  )
}
