export type PersonaId = 'yeonoh' | 'seoh' | 'mansik' | 'jisu' | 'homi'

export interface Persona {
  id: PersonaId
  name: string
  age: number
  job: string
  origin: string
  personality: string
  speechStyle: string
  dialectSample: string
  strength: string[]
  symbol: string
  gradient: string
  borderColor: string
  textColor: string
  emoji: string
}

export type TravelStyle =
  | '감성·힐링'
  | '맛집탐방'
  | '자연·액티비티'
  | '역사·문화'
  | '포토스팟'
  | '로컬 숨은 명소'

export type Companion = '혼자' | '커플' | '친구들' | '가족아이'
export type Duration = '당일' | '1박2일' | '2박3일' | '그이상'
export type Budget = '알뜰' | '보통' | '여유있게'

export interface UserSession {
  persona: PersonaId | null
  travelStyle: TravelStyle | null
  companion: Companion | null
  duration: Duration | null
  budget: Budget | null
  visitedPlaces: string[]
  affinityScore: number
  satoriLevel: 'beginner' | 'intermediate' | 'native'
  likedCategories: string[]
}

export interface TourPlace {
  contentId: string
  name: string
  address: string
  summary: string
  hasImage: boolean
  imageUrl?: string
  readCount: number
  contentTypeId: string
  personaLine?: string | null
  lat?: number
  lng?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  recommendations?: TourPlace[]
  timestamp: number
}
