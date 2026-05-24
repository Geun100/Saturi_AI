import type { UserSession } from '@/types'

export type OnboardingStep =
  | 'travelStyle'
  | 'companion'
  | 'duration'
  | 'budget'
  | 'done'

export function getNextOnboardingStep(session: UserSession): OnboardingStep {
  if (!session.travelStyle) return 'travelStyle'
  if (!session.companion) return 'companion'
  if (!session.duration) return 'duration'
  if (!session.budget) return 'budget'
  return 'done'
}

export function getOnboardingQuestion(
  personaId: string,
  step: OnboardingStep
): string {
  const questions: Record<string, Record<OnboardingStep, string>> = {
    mansik: {
      travelStyle: '왔나, 포항에. 뭐 하러 왔노?',
      companion: '혼자가, 아니면 같이 왔나?',
      duration: '얼마나 있을 끼고?',
      budget: '돈은 좀 쓸 수 있나?',
      done: '알겠다. 내가 다 알아서 한다카이.',
    },
    yeonoh: {
      travelStyle: '포항 왔다카이! 뭐 하고 싶노?',
      companion: '혼자 왔나카이, 아니면 누구랑?',
      duration: '얼마나 있을 기라?',
      budget: '예산은 어떻게 돼?',
      done: '오케이! 내가 최고 코스 짜줄기라!',
    },
    seoh: {
      travelStyle: '포항 왔구나~ 어떤 거 좋아해?',
      companion: '혼자야, 아니면 누구랑 왔노~?',
      duration: '얼마나 있을 끼고~?',
      budget: '예산은 어느 정도야?',
      done: '오케이~ 내가 진짜 좋은 데 알려줄게데이',
    },
    jisu: {
      travelStyle: '포항 왔다카이~ 어떤 스타일이야?',
      companion: '혼자? 아니면 같이 온 사람 있나?',
      duration: '얼마나 있을 거야?',
      budget: '예산은 어때?',
      done: '완전 좋은 코스 짜줄게다카이!',
    },
    homi: {
      travelStyle: '포항에 왔는가. 뭘 보러 왔노?',
      companion: '혼자 왔는가, 아니면 같이 왔는가?',
      duration: '얼마나 머물 끼고?',
      budget: '돈은 어느 정도 쓸 생각인가?',
      done: '내가 아는 포항 다 알려주마.',
    },
  }
  return questions[personaId]?.[step] ?? '뭐 하러 왔노?'
}
