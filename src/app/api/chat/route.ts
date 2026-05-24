import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/claude'
import { getNextOnboardingStep, getOnboardingQuestion } from '@/lib/onboarding'
import { fetchPohangPlaces, fetchTodayFestivals, enrichWithPersonaMemory } from '@/lib/tourapi'
import type { UserSession, TravelStyle, Companion, Duration, Budget } from '@/types'

export const runtime = 'nodejs'

// 온보딩 답변에서 선택 값 파싱
function parseOnboardingAnswer(
  step: string,
  message: string
): string | null {
  const m = message.trim()

  if (step === 'travelStyle') {
    if (/감성|힐링|조용|쉬/.test(m)) return '감성·힐링'
    if (/맛집|먹|음식|시장/.test(m)) return '맛집탐방'
    if (/자연|액티비|등산|바다|서핑/.test(m)) return '자연·액티비티'
    if (/역사|문화|유적|박물/.test(m)) return '역사·문화'
    if (/사진|포토|인스타|찍/.test(m)) return '포토스팟'
    if (/숨은|로컬|현지|골목/.test(m)) return '로컬 숨은 명소'
    return null
  }

  if (step === 'companion') {
    if (/혼자|혼/.test(m)) return '혼자'
    if (/커플|애인|남자친구|여자친구|둘/.test(m)) return '커플'
    if (/친구|무리|팀|여럿/.test(m)) return '친구들'
    if (/가족|아이|아기|애|자녀/.test(m)) return '가족아이'
    return null
  }

  if (step === 'duration') {
    if (/당일|하루|오늘만/.test(m)) return '당일'
    if (/1박|1박2일|이틀/.test(m)) return '1박2일'
    if (/2박|2박3일|사흘/.test(m)) return '2박3일'
    if (/3박|3일 이상|그 이상|오래/.test(m)) return '그이상'
    return null
  }

  if (step === 'budget') {
    if (/알뜰|싸|저렴|무료|돈 없|없어/.test(m)) return '알뜰'
    if (/보통|적당|그냥|중간/.test(m)) return '보통'
    if (/여유|넉넉|많이|충분|제한 없/.test(m)) return '여유있게'
    return null
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      personaId,
      session,
    }: {
      message: string
      personaId: string
      session: UserSession
    } = body

    if (!message || !personaId) {
      return NextResponse.json({ error: 'message와 personaId 필수' }, { status: 400 })
    }

    // 온보딩 단계 확인
    const nextStep = getNextOnboardingStep(session)
    let updatedSession = { ...session }

    if (nextStep !== 'done') {
      // 온보딩 단계: 답변 파싱 → 다음 질문
      const parsed = parseOnboardingAnswer(nextStep, message)

      if (parsed) {
        // 파싱 성공 → 세션 업데이트
        if (nextStep === 'travelStyle') updatedSession.travelStyle = parsed as TravelStyle
        if (nextStep === 'companion') updatedSession.companion = parsed as Companion
        if (nextStep === 'duration') updatedSession.duration = parsed as Duration
        if (nextStep === 'budget') updatedSession.budget = parsed as Budget

        const afterStep = getNextOnboardingStep(updatedSession)

        if (afterStep === 'done') {
          // 온보딩 완료 → 첫 추천 생성
          const { items } = await fetchPohangPlaces(updatedSession.travelStyle!, 20)
          const enriched = enrichWithPersonaMemory(items, personaId)
          const festivals = await fetchTodayFestivals()

          const result = await chat({
            personaId,
            message: `온보딩 완료. 여행스타일: ${updatedSession.travelStyle}, 동행: ${updatedSession.companion}, 기간: ${updatedSession.duration}, 예산: ${updatedSession.budget}. 이제 맞춤 여행 코스를 추천해줘.`,
            session: updatedSession,
            places: enriched,
            festivals,
          })

          return NextResponse.json({
            message: result.message,
            session: updatedSession,
            affinityChange: result.affinityChange,
            onboardingDone: true,
          })
        }

        // 다음 온보딩 질문
        const nextQuestion = getOnboardingQuestion(personaId, afterStep)
        return NextResponse.json({
          message: nextQuestion,
          session: updatedSession,
          affinityChange: 2,
          onboardingStep: afterStep,
        })
      }

      // 파싱 실패 → 같은 질문 재질문 (페르소나 말투로)
      const retryQuestion = getOnboardingQuestion(personaId, nextStep)
      return NextResponse.json({
        message: retryQuestion,
        session: updatedSession,
        affinityChange: 0,
        onboardingStep: nextStep,
      })
    }

    // 일반 채팅 단계
    const travelStyle = session.travelStyle ?? '감성·힐링'
    const [{ items }, festivals] = await Promise.all([
      fetchPohangPlaces(travelStyle, 20),
      fetchTodayFestivals(),
    ])
    const enriched = enrichWithPersonaMemory(items, personaId)

    const result = await chat({
      personaId,
      message,
      session,
      places: enriched,
      festivals,
    })

    return NextResponse.json({
      message: result.message,
      session: updatedSession,
      affinityChange: result.affinityChange,
      onboardingDone: true,
    })
  } catch (err) {
    console.error('[/api/chat] error:', err)
    return NextResponse.json(
      { error: '서버 오류', detail: String(err) },
      { status: 500 }
    )
  }
}
