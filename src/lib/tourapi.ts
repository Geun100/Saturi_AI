import type { TourPlace, TravelStyle } from '@/types'
import { PERSONA_MEMORY } from './personas'

const API_KEY = process.env.TOUR_API_KEY!
const BASE = 'https://apis.data.go.kr/B551011/KorService2'

const POHANG = {
  areaCode: '35',     // 경북
  sigunguCode: '23',  // 포항시
}

export type StyleConfig = {
  contentTypeIds: string[]
  maxPlaces: number
  requireImage?: boolean
  sortBy?: string
  keywords?: string[]
}

const STYLE_CONFIG: Record<TravelStyle, StyleConfig> = {
  '감성·힐링': {
    contentTypeIds: ['12', '32'],
    maxPlaces: 3,
  },
  '맛집탐방': {
    contentTypeIds: ['39', '38'],
    maxPlaces: 5,
    keywords: ['과메기', '물회', '구룡포', '죽도시장', '모리국수'],
  },
  '자연·액티비티': {
    contentTypeIds: ['28', '12'],
    maxPlaces: 4,
  },
  '역사·문화': {
    contentTypeIds: ['14', '12'],
    maxPlaces: 4,
    keywords: ['연오랑', '세오녀', '구룡포', '신라', '역사', '유적'],
  },
  '포토스팟': {
    contentTypeIds: ['12', '14'],
    maxPlaces: 4,
    requireImage: true,
  },
  '로컬 숨은 명소': {
    contentTypeIds: ['12', '39'],
    maxPlaces: 4,
    sortBy: 'readcount_asc',
  },
}

function buildUrl(endpoint: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'SaturiPass',
    _type: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  })
  return `${BASE}/${endpoint}?${qs}`
}

export async function fetchPohangPlaces(
  travelStyle: TravelStyle,
  numOfRows = 20
): Promise<{ items: TourPlace[]; cached: boolean }> {
  const config = STYLE_CONFIG[travelStyle] ?? STYLE_CONFIG['감성·힐링']

  const results = await Promise.all(
    config.contentTypeIds.map((typeId) =>
      fetch(
        buildUrl('areaBasedList2', {
          areaCode: POHANG.areaCode,
          sigunguCode: POHANG.sigunguCode,
          contentTypeId: typeId,
          numOfRows,
          pageNo: 1,
        }),
        { next: { revalidate: 300 } }  // 5분 캐시
      ).then((r) => r.json())
    )
  )

  const allItems: TourPlace[] = results.flatMap((res) => {
    const raw = res?.response?.body?.items?.item ?? []
    return (Array.isArray(raw) ? raw : [raw]).map((p: Record<string, string>) => ({
      contentId: p.contentid,
      name: p.title,
      address: (p.addr1 ?? '').split(' ').slice(0, 3).join(' '),
      summary: p.overview
        ? p.overview.replace(/<[^>]*>/g, '').slice(0, 80) + '…'
        : '포항 관광지',
      hasImage: !!p.firstimage,
      imageUrl: p.firstimage || undefined,
      readCount: Number(p.readcount ?? 0),
      contentTypeId: p.contenttypeid,
      personaLine: null,
      lat: p.mapy ? Number(p.mapy) : undefined,
      lng: p.mapx ? Number(p.mapx) : undefined,
    }))
  })

  // 필터: 이미지 필수 조건
  let filtered = config.requireImage
    ? allItems.filter((p) => p.hasImage)
    : allItems

  // 정렬: readcount 낮은 순 (숨은 명소)
  if (config.sortBy === 'readcount_asc') {
    filtered = filtered.sort((a, b) => a.readCount - b.readCount)
  }

  return {
    items: filtered.slice(0, config.maxPlaces),
    cached: false,
  }
}

export async function fetchTodayFestivals() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  try {
    const res = await fetch(
      buildUrl('searchFestival2', {
        areaCode: POHANG.areaCode,
        sigunguCode: POHANG.sigunguCode,
        eventStartDate: today,
        numOfRows: 5,
        pageNo: 1,
      }),
      { next: { revalidate: 3600 } }
    )
    const json = await res.json()
    const items = json?.response?.body?.items?.item ?? []
    return Array.isArray(items) ? items : [items]
  } catch {
    return []
  }
}

export function enrichWithPersonaMemory(
  places: TourPlace[],
  personaId: string
): TourPlace[] {
  const memory = PERSONA_MEMORY[personaId] ?? {}
  return places.map((p) => ({
    ...p,
    personaLine: memory[p.contentId] ?? null,
  }))
}

export function formatPlacesForPrompt(places: TourPlace[]): string {
  return places
    .map(
      (p, i) =>
        `${i + 1}. ${p.name}\n` +
        `   위치: ${p.address}\n` +
        `   특징: ${p.summary}\n` +
        (p.personaLine ? `   메모: "${p.personaLine}"\n` : '')
    )
    .join('\n')
}
