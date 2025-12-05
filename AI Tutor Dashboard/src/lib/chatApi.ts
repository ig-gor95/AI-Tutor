import api from './api';
import { SessionResult } from '@/types';

export interface StartSessionRequest {
  studentId?: string;
  studentName?: string;
}

export interface ChatMessageRequest {
  message: string;
  sessionResultId: string;
}

export interface ChatMessageResponse {
  message: string;
  role: 'AI' | 'USER';
  timestamp: string;
}

export async function startSessionResult(
  sessionId: string,
  data: StartSessionRequest
): Promise<SessionResult> {
  try {
    const response = await api.post<any>(`/session-results/start/${sessionId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Start session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка начала сессии');
  }
}

export async function generateGreeting(resultId: string): Promise<ChatMessageResponse> {
  try {
    const response = await api.post<ChatMessageResponse>(`/chat/greeting/${resultId}`);
    return response.data;
  } catch (error: any) {
    console.error('Generate greeting error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка генерации приветствия');
  }
}

export async function sendChatMessage(data: ChatMessageRequest): Promise<ChatMessageResponse> {
  try {
    const response = await api.post<ChatMessageResponse>('/chat/message', data);
    return response.data;
  } catch (error: any) {
    console.error('Send message error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка отправки сообщения');
  }
}

export async function completeSession(resultId: string): Promise<{
  summary: string;
  score: number;
  result: SessionResult;
}> {
  try {
    const response = await api.post(`/chat/complete/${resultId}`);
    return response.data;
  } catch (error: any) {
    console.error('Complete session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка завершения сессии');
  }
}

