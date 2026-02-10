import axios from 'axios';
import { FeedbackResponse } from '../types';

const API_URL = '/api';

export async function submitAnswer(
  profileCode: string,
  questionId: string,
  selectedAnswer: number,
  attemptNumber: number
): Promise<FeedbackResponse> {
  try {
    const response = await axios.post(`${API_URL}/feedback`, {
      profileCode,
      questionId,
      selectedAnswer,
      attemptNumber
    });
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw new Error('Failed to get feedback. Please try again.');
  }
}
