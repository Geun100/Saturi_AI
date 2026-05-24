import { NextRequest, NextResponse } from 'next/server'
import { fetchPohangPlaces, enrichWithPersonaMemory } from '@/lib/tourapi'
import type { TravelStyle } from '@/types'

export const runtime = 'nodejs'

const ALL_STYLES: TravelStyle[] = [
  '감성·힐링',
  '맛집탐방',
  '자연·액티비티',
  '역사·문화',
  '포토스팟',
  '로컬 숨은 명소',
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const personaId = searchParams.get('persona') ?? 'yeonoh'
  const style = searchParams.get('style') as TravelStyle | null

  const styles = style && ALL_STYLES.includes(style as TravelStyle)
    ? [style as TravelStyle]
    : ALL_STYLES

  try {
    const results = await Promise.all(
      styles.map((s) => fetchPohangPlaces(s, 10).then(({ items }) => ({ style: s, items })))
    )

    const places = results.flatMap(({ style: s, items }) =>
      enrichWithPersonaMemory(items, personaId).map((p) => ({ ...p, travelStyle: s }))
    )

    // 좌표 없는 장소 제거 + contentId 중복 제거 (여러 스타일에 중복 등록된 장소)
    const seen = new Set<string>()
    const withCoords = places.filter((p) => {
      if (!p.lat || !p.lng) return false
      if (seen.has(p.contentId)) return false
      seen.add(p.contentId)
      return true
    })

    return NextResponse.json(
      { places: withCoords },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
