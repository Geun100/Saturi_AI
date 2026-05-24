'use client'

import dynamic from 'next/dynamic'
import type { Voucher } from '@/data/missions'

// SSR 비활성화 (react-barcode는 window 필요)
const Barcode = dynamic(() => import('react-barcode'), { ssr: false })

interface Props {
  voucher: Voucher
  onMarkUsed: () => void
}

export default function BarcodeCard({ voucher, onMarkUsed }: Props) {
  const isUsed = !!voucher.usedAt
  const expires = new Date(voucher.expiresAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-opacity ${isUsed ? 'opacity-50' : ''}`}>
      {/* 상단: 상품권 정보 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500 font-medium">🏪 죽도시장 상품권</div>
          <div className="text-2xl font-black mt-0.5" style={{ color: '#1B3A8C' }}>
            {voucher.amount.toLocaleString()}원
          </div>
        </div>
        {isUsed && (
          <span className="bg-gray-200 text-gray-600 text-xs px-2.5 py-1 rounded-full font-semibold">
            사용완료
          </span>
        )}
      </div>

      {/* 바코드 */}
      <div className="flex justify-center bg-gray-50 rounded-xl py-4 mb-3">
        <Barcode
          value={voucher.barcode}
          width={1.5}
          height={60}
          fontSize={12}
          margin={0}
        />
      </div>

      {/* 바코드 번호 + 유효기간 */}
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span className="font-mono">{voucher.barcode}</span>
        <span>유효기간 {expires}</span>
      </div>

      {/* 사용완료 처리 버튼 */}
      {!isUsed && (
        <button
          onClick={onMarkUsed}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          사용완료 처리
        </button>
      )}
    </div>
  )
}
