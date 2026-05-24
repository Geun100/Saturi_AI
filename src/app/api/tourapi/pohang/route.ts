import { NextRequest, NextResponse } from 'next/server'
import {
  fetchPohangPlaces,
  fetchTodayFestivals,
  enrichWithPersonaMemory,
} from '@/lib/tourapi'
import type { TravelStyle } from '@/types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const travelStyle = (searchParams.get('travelStyle') ?? '감성·힐링') as TravelStyle
  const personaId = searchParams.get('persona') ?? ''
  const numOfRows = Number(searchParams.get('numOfRows') ?? '20')

  // 지원 스타일 검증
  const VALID_STYLES: TravelStyle[] = [
    '감성·힐링', '맛집탐방', '자연·액티비티',
    '역사·문화', '포토스팟', '로컬 숨은 명소',
  ]
  if (!VALID_STYLES.includes(travelStyle)) {
    return NextResponse.json(
      { error: `유효하지 않은 travelStyle: ${travelStyle}` },
      { status: 400 }
    )
  }

  try {
    const [{ items, cached }, festivals] = await Promise.all([
      fetchPohangPlaces(travelStyle, numOfRows),
      fetchTodayFestivals(),
    ])

    const enriched = personaId
      ? enrichWithPersonaMemory(items, personaId)
      : items

    return NextResponse.json(
      {
        places: enriched,
        festivals,
        cached,
        meta: {
          travelStyle,
          persona: personaId || null,
          count: enriched.length,
          fetchedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    console.error('[TourAPI] fetch error:', err)
    return NextResponse.json(
      { error: 'TourAPI 호출 실패', detail: String(err) },
      { status: 502 }
    )
  }
}
