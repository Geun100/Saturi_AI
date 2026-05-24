'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const TABS = [
  { path: '/',        icon: '🏠', label: '홈'   },
  { path: '/map',     icon: '🗺️', label: '지도'  },
  { path: '/chat',    icon: '💬', label: '채팅'  },
  { path: '/mission', icon: '🏆', label: '미션'  },
]

export default function BottomNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const [personaId, setPersonaId] = useState('')

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('saturi_session') ?? '{}')
      setPersonaId(s.persona ?? '')
    } catch { /* empty */ }
  }, [])

  // 홈 · 채팅(통합 앱) 화면에서는 숨김
  if (pathname === '/' || pathname === '/chat') return null

  function go(path: string) {
    if (path === '/') { router.push('/'); return }
    router.push(personaId ? `${path}?persona=${personaId}` : path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto">
      {/* 블러 바 */}
      <div
        className="flex items-center justify-around px-2 py-2 glass border-t"
        style={{ borderColor: 'var(--border)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.path) && (tab.path !== '/' || pathname === '/')
          return (
            <button
              key={tab.path}
              onClick={() => go(tab.path)}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-200 ${
                active ? 'opacity-100' : 'opacity-40 hover:opacity-70'
              }`}
            >
              <span
                className={`text-xl transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                style={active ? { filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.8))' } : {}}
              >
                {tab.icon}
              </span>
              <span
                className="text-[10px] font-bold tracking-wide"
                style={{ color: active ? 'var(--cyan)' : 'inherit' }}
              >
                {tab.label}
              </span>
              {active && (
                <span
                  className="absolute -bottom-0 w-1 h-1 rounded-full"
                  style={{ backgroundColor: 'var(--cyan)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
