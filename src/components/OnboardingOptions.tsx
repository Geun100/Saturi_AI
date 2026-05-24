'use client'

import type { OnboardingStep } from '@/lib/onboarding'

const OPTIONS: Record<OnboardingStep, { label: string; value: string; emoji: string }[]> = {
  travelStyle: [
    { label: '감성·힐링', value: '감성', emoji: '🌿' },
    { label: '맛집탐방', value: '맛집', emoji: '🐟' },
    { label: '자연·액티비티', value: '자연', emoji: '🏄' },
    { label: '역사·문화', value: '역사', emoji: '🏯' },
    { label: '포토스팟', value: '사진', emoji: '📸' },
    { label: '로컬 숨은 명소', value: '숨은', emoji: '🗺️' },
  ],
  companion: [
    { label: '혼자', value: '혼자', emoji: '🧍' },
    { label: '커플', value: '커플', emoji: '💑' },
    { label: '친구들', value: '친구', emoji: '👫' },
    { label: '가족·아이', value: '가족', emoji: '👨‍👩‍👧' },
  ],
  duration: [
    { label: '당일치기', value: '당일', emoji: '☀️' },
    { label: '1박2일', value: '1박2일', emoji: '🌙' },
    { label: '2박3일', value: '2박3일', emoji: '🌟' },
    { label: '3박 이상', value: '그 이상', emoji: '✨' },
  ],
  budget: [
    { label: '알뜰하게', value: '알뜰', emoji: '💰' },
    { label: '보통으로', value: '보통', emoji: '💳' },
    { label: '여유있게', value: '여유', emoji: '💎' },
  ],
  done: [],
}

interface Props {
  step: OnboardingStep
  onSelect: (value: string) => void
  light?: boolean
}

export default function OnboardingOptions({ step, onSelect, light }: Props) {
  const options = OPTIONS[step]
  if (!options || options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all duration-150"
          style={light
            ? { background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#1B3A8C' }
            : { background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(255,255,255,0.85)' }
          }
        >
          <span>{opt.emoji}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
