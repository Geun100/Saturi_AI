import type { TourPlace, TravelStyle, UserSession } from '@/types'

const STYLE_TYPES: Record<TravelStyle, string[]> = {
  '감성·힐링':     ['12', '32'],
  '맛집탐방':      ['39', '38'],
  '자연·액티비티': ['28', '12'],
  '역사·문화':     ['14', '12'],
  '포토스팟':      ['12'],
  '로컬 숨은 명소': ['12', '39'],
}

// contentId 기반 고정 시드 (렌더마다 달라지지 않음)
function seed(contentId: string): number {
  return parseInt(contentId.replace(/\D/g, '').slice(-3) || '50', 10) % 20
}

export function calcMatchScore(place: TourPlace, session: UserSession): number {
  const pop       = Math.min(25, Math.floor(place.readCount / 400))
  const styleHit  = session.travelStyle &&
    STYLE_TYPES[session.travelStyle]?.includes(place.contentTypeId) ? 22 : 0
  return Math.min(99, 52 + pop + styleHit + seed(place.contentId))
}

export function monthlyVisitors(place: TourPlace): string {
  const r = place.readCount
  if (r > 8000) return '5만+'
  if (r > 3000) return `${Math.round(r / 1000)}만+`
  if (r > 500)  return `${Math.round(r / 100) * 100}명+`
  return `${Math.max(120, r)}명+`
}

// AI 응답에서 언급된 장소 추출
export function findMentionedPlaces<T extends TourPlace>(text: string, places: T[]): T[] {
  return places.filter(p => {
    const key = p.name.replace(/[（）()\s]/g, '').slice(0, 4)
    return key.length >= 2 && text.includes(key)
  })
}
