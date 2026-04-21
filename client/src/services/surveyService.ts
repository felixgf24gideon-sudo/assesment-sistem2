// client/src/services/surveyService.ts

import { supabase } from './supabase';
import { SurveyState } from '../types/survey';

export async function saveSurveyResults(state: SurveyState): Promise<void> {
  const profilingDuration = Math.round(
    ((state.completedAt?.getTime() || Date.now()) - state.startedAt.getTime()) / 1000
  );

  try {
    const { error } = await supabase
      .from('survey_responses')
      .insert({
        session_id: state.sessionId,
        profile_code: state.profileCode,
        profiling_answers: {
          ...state.assessmentAnswers,
          respondent_biodata: state.biodata ?? null,
        },
        profiling_duration_seconds: profilingDuration,
        quiz_responses: state.questionsAnswered,
        evaluation_responses: state.evaluationResponses,
        created_at: state.startedAt.toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving survey results:', error);
    throw error;
  }
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}