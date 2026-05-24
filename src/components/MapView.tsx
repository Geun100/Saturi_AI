'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TourPlace, TravelStyle } from '@/types'

// 카테고리별 색상 & 이모지
const STYLE_COLORS: Record<TravelStyle, string> = {
  '감성·힐링':     '#A78BFA',
  '맛집탐방':      '#FF6B35',
  '자연·액티비티': '#34D399',
  '역사·문화':     '#FBBF24',
  '포토스팟':      '#F472B6',
  '로컬 숨은 명소': '#00D4FF',
}

const STYLE_EMOJI: Record<TravelStyle, string> = {
  '감성·힐링':     '🌿',
  '맛집탐방':      '🐟',
  '자연·액티비티': '🏄',
  '역사·문화':     '🏯',
  '포토스팟':      '📸',
  '로컬 숨은 명소': '🗺️',
}

// unique gradient id per pin to avoid SVG namespace collisions
function gid(contentId: string): string {
  return `g${contentId.replace(/\D/g, '').slice(-6) || '000'}`
}

function makePin(
  style: TravelStyle,
  contentId: string,
  opts: { selected?: boolean; highlighted?: boolean; score?: number } = {}
) {
  const { selected = false, highlighted = false, score } = opts
  const color = STYLE_COLORS[style] ?? '#00D4FF'
  const emoji = STYLE_EMOJI[style] ?? '📍'
  const id    = gid(contentId)

  if (highlighted && score !== undefined) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="66" viewBox="0 0 52 66">
      <defs>
        <radialGradient id="${id}" cx="40%" cy="30%">
          <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="26" cy="18" r="18" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6">
        <animate attributeName="r" values="18;27;18" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite"/>
      </circle>
      <ellipse cx="26" cy="64" rx="8" ry="2.5" fill="rgba(0,0,0,0.4)"/>
      <path d="M26 4C18 4 12 10.3 12 18c0 12 14 30 14 30S40 30 40 18C40 10.3 34 4 26 4z" fill="${color}"/>
      <path d="M26 4C18 4 12 10.3 12 18c0 12 14 30 14 30S40 30 40 18C40 10.3 34 4 26 4z" fill="url(#${id})"/>
      <circle cx="26" cy="18" r="11" fill="rgba(0,0,0,0.25)"/>
      <text x="26" y="22" text-anchor="middle" font-size="13" style="user-select:none">${emoji}</text>
      <rect x="11" y="38" width="30" height="13" rx="6.5" fill="rgba(0,0,0,0.88)"/>
      <text x="26" y="48" text-anchor="middle" font-size="9" fill="${color}" font-weight="bold">${score}% 매칭</text>
    </svg>`
    return L.divIcon({ html: svg, className: '', iconSize: [52, 66], iconAnchor: [26, 66], popupAnchor: [0, -66] })
  }

  const size = selected ? 48 : 40
  const h    = size + 8
  const glow = selected ? `filter: drop-shadow(0 0 8px ${color});` : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 40 48" style="${glow}">
    <defs>
      <radialGradient id="${id}" cx="40%" cy="30%">
        <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="20" cy="46" rx="7" ry="2" fill="rgba(0,0,0,0.35)"/>
    <path d="M20 2C12.3 2 6 8.3 6 16c0 11 14 28 14 28S34 27 34 16C34 8.3 27.7 2 20 2z" fill="${color}"/>
    <path d="M20 2C12.3 2 6 8.3 6 16c0 11 14 28 14 28S34 27 34 16C34 8.3 27.7 2 20 2z" fill="url(#${id})"/>
    <circle cx="20" cy="16" r="11" fill="rgba(0,0,0,0.25)"/>
    <text x="20" y="20" text-anchor="middle" font-size="12" style="user-select:none">${emoji}</text>
  </svg>`

  return L.divIcon({ html: svg, className: '', iconSize: [size, h], iconAnchor: [size / 2, h], popupAnchor: [0, -h] })
}

// FlyTo helper — must be inside MapContainer
function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (!center) return
    try {
      map.stop()  // 진행 중인 애니메이션 중단 후 이동 (마커 DOM 경합 방지)
      map.flyTo(center, 15, { duration: 0.8, easeLinearity: 0.35 })
    } catch { /* map not ready */ }
  }, [center, map])
  return null
}

export type MapPlace = TourPlace & { travelStyle: TravelStyle }

const POHANG: [number, number] = [36.019, 129.343]

interface Props {
  places:          MapPlace[]
  activeStyle:     TravelStyle | 'all'
  selectedId:      string | null
  onSelect:        (place: MapPlace) => void
  flyTo:           [number, number] | null
  highlightedIds?: string[]
  matchScores?:    Record<string, number>
}

export default function MapView({
  places, activeStyle, selectedId, onSelect, flyTo,
  highlightedIds = [], matchScores = {},
}: Props) {
  // 아이콘 캐시 — 파라미터가 같으면 동일 L.DivIcon 객체 재사용하여 마커 DOM 교체 최소화
  const iconCache = useRef(new Map<string, L.DivIcon>())

  function getIcon(place: MapPlace): L.DivIcon {
    const isSelected    = place.contentId === selectedId
    const isHighlighted = highlightedIds.includes(place.contentId)
    const score         = matchScores[place.contentId]
    const cacheKey      = `${place.contentId}|${isSelected}|${isHighlighted}|${score ?? ''}`

    if (!iconCache.current.has(cacheKey)) {
      iconCache.current.set(
        cacheKey,
        makePin(place.travelStyle, place.contentId, { selected: isSelected, highlighted: isHighlighted, score })
      )
    }
    return iconCache.current.get(cacheKey)!
  }

  const visible = activeStyle === 'all'
    ? places
    : places.filter(p => p.travelStyle === activeStyle)

  return (
    <MapContainer
      center={POHANG}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OSM &copy; CARTO'
        subdomains="abcd"
        maxZoom={19}
      />
      <FlyTo center={flyTo} />
      {visible.map(place => (
        <Marker
          key={place.contentId}
          position={[place.lat!, place.lng!]}
          icon={getIcon(place)}
          eventHandlers={{ click: () => onSelect(place) }}
          zIndexOffset={
            highlightedIds.includes(place.contentId) ? 2000
            : place.contentId === selectedId ? 1000
            : 0
          }
        />
      ))}
    </MapContainer>
  )
}
