export type MissionCategory = 'place' | 'food' | 'quiz' | 'challenge' | 'collection'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Mission {
  id: string
  category: MissionCategory
  title: string
  desc: string
  reward: number
  icon: string
  difficulty: Difficulty
  progress: number
  total: number
  requires?: string[]
}

export interface Voucher {
  id: string
  type: 'voucher'
  amount: number
  barcode: string
  issuedAt: string
  expiresAt: string
  usedAt: string | null
}

export const MISSIONS: Mission[] = [
  {
    id: 'm1', category: 'place',
    title: '영일대 인증샷',
    desc: '영일대 해수욕장에서 인증사진 찍기',
    reward: 100, icon: '📍', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm2', category: 'place',
    title: '호미곶 손 조형물',
    desc: '상생의 손 앞에서 인증샷 찍기',
    reward: 120, icon: '📍', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm3', category: 'place',
    title: '스페이스워크 방문',
    desc: '스페이스워크를 배경으로 인증샷',
    reward: 100, icon: '📍', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm4', category: 'place',
    title: '포항운하 야경',
    desc: '포항운하 야경 인증샷',
    reward: 150, icon: '📍', difficulty: 'medium', progress: 0, total: 1,
  },
  {
    id: 'm5', category: 'place',
    title: '구룡포 일본인 가옥',
    desc: '구룡포 근대문화역사거리 방문',
    reward: 110, icon: '📍', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm6', category: 'food',
    title: '과메기 도전',
    desc: '죽도시장에서 과메기 먹어보기',
    reward: 150, icon: '🍽️', difficulty: 'medium', progress: 0, total: 1,
  },
  {
    id: 'm7', category: 'food',
    title: '물회 한 그릇',
    desc: '포항 물회 맛보기',
    reward: 120, icon: '🍽️', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm8', category: 'food',
    title: '모리국수 도전',
    desc: '포항 명물 모리국수 먹어보기',
    reward: 100, icon: '🍽️', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm9', category: 'quiz',
    title: '사투리 퀴즈',
    desc: '경상도 사투리 3개 맞추기',
    reward: 80, icon: '💬', difficulty: 'easy', progress: 0, total: 3,
  },
  {
    id: 'm10', category: 'quiz',
    title: '만식이 수수께끼',
    desc: '만식이가 내는 포항 퀴즈 풀기',
    reward: 90, icon: '💬', difficulty: 'medium', progress: 0, total: 1,
  },
  {
    id: 'm11', category: 'challenge',
    title: '사투리로 인사',
    desc: '"안녕하세요"를 경상도로 말해봐',
    reward: 100, icon: '🎭', difficulty: 'easy', progress: 0, total: 1,
  },
  {
    id: 'm12', category: 'challenge',
    title: '사투리로 주문',
    desc: '음식점에서 사투리로 주문 성공하기',
    reward: 150, icon: '🎭', difficulty: 'hard', progress: 0, total: 1,
  },
  {
    id: 'm13', category: 'challenge',
    title: '페르소나에게 말걸기',
    desc: 'AI 친구한테 사투리로 먼저 말걸기',
    reward: 120, icon: '🎭', difficulty: 'medium', progress: 0, total: 1,
  },
  {
    id: 'c1', category: 'collection',
    title: '포항 3대 명소',
    desc: '영일대+호미곶+스페이스워크 전부 완료',
    reward: 300, icon: '🏆', difficulty: 'hard', progress: 0, total: 3,
    requires: ['m1', 'm2', 'm3'],
  },
  {
    id: 'c2', category: 'collection',
    title: '죽도시장 완전정복',
    desc: '맛집 미션 3개 완료',
    reward: 250, icon: '🏆', difficulty: 'hard', progress: 0, total: 3,
    requires: ['m6', 'm7', 'm8'],
  },
  {
    id: 'c3', category: 'collection',
    title: '사투리 마스터',
    desc: '챌린지 미션 3개 완료',
    reward: 200, icon: '🏆', difficulty: 'hard', progress: 0, total: 3,
    requires: ['m11', 'm12', 'm13'],
  },
]

export function getLevel(points: number): { num: number; label: string } {
  if (points >= 1000) return { num: 4, label: '포항 토박이' }
  if (points >= 600) return { num: 3, label: '포항 마니아' }
  if (points >= 300) return { num: 2, label: '포항 탐험가' }
  return { num: 1, label: '포항 새내기' }
}
