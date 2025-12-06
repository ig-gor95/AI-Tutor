import api from './api';
import { Session, SessionParams, SessionResult } from '@/types';

export interface CreateSessionRequest {
  params: SessionParams;
}

// Helper function to convert backend session to frontend format
function convertSessionToFrontend(session: any): Session {
  return {
    ...session,
    params: {
      ...session.params,
      difficulty: session.params.difficulty?.toLowerCase(),
      language: session.params.language?.toLowerCase(),
      personality: session.params.personality?.toLowerCase(),
      interactionStyle: session.params.interactionStyle?.toLowerCase()
    }
  };
}

export async function createSession(params: SessionParams): Promise<Session> {
  try {
    // Convert enums to uppercase for backend
    const backendParams = {
      ...params,
      difficulty: params.difficulty.toUpperCase(),
      language: params.language.toUpperCase(),
      personality: params.personality.toUpperCase(),
      interactionStyle: params.interactionStyle?.toUpperCase() || 'MIXED'
    };
    
    const response = await api.post<any>('/sessions', { params: backendParams });
    return convertSessionToFrontend(response.data);
  } catch (error: any) {
    console.error('Create session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка создания сессии');
  }
}

export async function getSession(id: string): Promise<Session> {
  try {
    const response = await api.get<any>(`/sessions/${id}`);
    return convertSessionToFrontend(response.data);
  } catch (error: any) {
    console.error('Get session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка получения сессии');
  }
}

export async function getPublicSession(id: string): Promise<Session> {
  try {
    const response = await api.get<any>(`/sessions/public/${id}`);
    return convertSessionToFrontend(response.data);
  } catch (error: any) {
    console.error('Get public session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка получения сессии');
  }
}

export async function getSessionsByOrganizer(organizerId: string): Promise<Session[]> {
  try {
    const response = await api.get<any[]>(`/sessions/organizer/${organizerId}`);
    return response.data.map(convertSessionToFrontend);
  } catch (error: any) {
    console.error('Get sessions by organizer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка получения сессий');
  }
}

export async function getAllSessions(): Promise<Session[]> {
  try {
    const response = await api.get<any[]>('/sessions');
    return response.data.map(convertSessionToFrontend);
  } catch (error: any) {
    console.error('Get all sessions error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка получения сессий');
  }
}

// Helper function to convert backend session result to frontend format
function convertSessionResultToFrontend(result: any): SessionResult {
  return {
    id: result.id,
    sessionId: result.sessionId,
    studentId: result.studentId,
    studentName: result.studentName,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    transcript: result.transcript?.map((msg: any) => ({
      role: msg.role?.toLowerCase() === 'ai' ? 'ai' : 'user',
      message: msg.message,
      timestamp: msg.timestamp
    })) || [],
    summary: result.summary,
    score: result.score
  };
}

export async function getResultsByOrganizer(organizerId: string): Promise<SessionResult[]> {
  try {
    const response = await api.get<any[]>(`/session-results/organizer/${organizerId}`);
    return response.data.map(convertSessionResultToFrontend);
  } catch (error: any) {
    console.error('Get results by organizer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Ошибка получения результатов');
  }
}

