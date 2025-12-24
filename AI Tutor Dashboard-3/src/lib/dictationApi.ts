const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface DictationAnalysisRequest {
  audioData: string; // Base64 encoded
  audioFormat: 'wav' | 'mp3';
  expectedText: string;
  language?: string;
}

export interface PhonemeAnalysis {
  phoneme: string;
  position: number;
  accuracy: number;
  deviation: number;
  issues: string[];
  formantF1?: number;
  formantF2?: number;
  duration?: number;
}

export interface WordAnalysis {
  word: string;
  position: number;
  overallAccuracy: number;
  phonemes: PhonemeAnalysis[];
  stressAccuracy?: number;
  issues: string[];
}

export interface IntonationAnalysis {
  pitchContour: number[];
  pitchVariation: number;
  averagePitch: number;
  pitchRange: number;
  monotonyScore: number;
  intonationPattern?: string;
}

export interface TimbreAnalysis {
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[];
  harmonicity?: number;
}

export interface ArticulationAnalysis {
  clarity: number;
  consonantAccuracy: number;
  vowelAccuracy: number;
  transitionSmoothness: number;
  issues: string[];
}

export interface DictationAnalysisResponse {
  success: boolean;
  overallAccuracy: number;
  transcribedText: string; // Транскрибированный текст из аудио
  words: WordAnalysis[];
  phonemes: PhonemeAnalysis[];
  intonation: IntonationAnalysis;
  timbre: TimbreAnalysis;
  articulation: ArticulationAnalysis;
  audioDuration: number;
  sampleRate: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Анализ дикции через multipart/form-data
 */
export async function analyzeDictation(
  audioFile: File,
  expectedText: string,
  language: string = 'ru'
): Promise<DictationAnalysisResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('expectedText', expectedText);
  formData.append('language', language);

  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dictation/analyze`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to analyze dictation: ${error}`);
  }

  return response.json();
}

/**
 * Анализ дикции через JSON (с base64 аудио)
 */
export async function analyzeDictationJson(
  request: DictationAnalysisRequest
): Promise<DictationAnalysisResponse> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/dictation/analyze-json`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to analyze dictation: ${error}`);
  }

  return response.json();
}

/**
 * Конвертация аудио файла в base64
 */
export function audioFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Убираем data URL префикс (data:audio/wav;base64,)
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Конвертация Blob в base64
 */
export function audioBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

