'use client'

import type { Persona } from '@/types'

interface Props {
  persona: Persona
  selected: boolean
  onSelect: (id: string) => void
}

export default function PersonaCard({ persona, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(persona.id)}
      className={`
        relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-300
        bg-white/5 backdrop-blur-sm card-glow
        ${selected
          ? `${persona.borderColor} bg-white/10 scale-[1.02]`
          : 'border-white/10 hover:border-white/30'
        }
      `}
    >
      {/* 선택 배지 */}
      {selected && (
        <span className="absolute top-3 right-3 bg-white text-black text-xs font-bold px-2 py-0.5 rounded-full">
          선택됨
        </span>
      )}

      {/* 심볼 + 이름 */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          bg-gradient-to-br ${persona.gradient} opacity-90
        `}>
          {persona.symbol}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{persona.name}</span>
            <span className="text-sm text-white/50">{persona.age}세</span>
          </div>
          <p className="text-xs text-white/40">{persona.job}</p>
        </div>
      </div>

      {/* 특기 태그 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {persona.strength.map((s) => (
          <span
            key={s}
            className={`text-xs px-2 py-0.5 rounded-full border ${persona.borderColor} ${persona.textColor} bg-white/5`}
          >
            {s}
          </span>
        ))}
      </div>

      {/* 사투리 샘플 */}
      <div className="bg-black/30 rounded-xl p-3 border border-white/5">
        <p className="text-xs text-white/40 mb-1">사투리 한 마디</p>
        <p className="text-sm text-white/80 leading-relaxed">
          &ldquo;{persona.dialectSample}&rdquo;
        </p>
      </div>

      {/* 성격 */}
      <p className="mt-2.5 text-xs text-white/40 leading-relaxed line-clamp-2">
        {persona.personality}
      </p>
    </button>
  )
}
