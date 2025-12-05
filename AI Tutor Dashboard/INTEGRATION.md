# Frontend Integration Guide

Руководство по интеграции фронтенда с backend API.

## 📦 Необходимые пакеты

Установите дополнительные зависимости для работы с API:

```bash
cd "AI Tutor Dashboard"
npm install axios @stomp/stompjs sockjs-client
```

## 🔧 Настройка API Client

Создайте файл `src/lib/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 🔐 Authentication API

Замените `src/lib/mockAuth.ts` на реальную аутентификацию:

```typescript
// src/lib/auth.ts
import api from './api';
import { User, UserRole } from '@/types';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/signup', data);
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('currentUser', JSON.stringify(response.data.user));
  return response.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('currentUser', JSON.stringify(response.data.user));
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('currentUser');
  return userJson ? JSON.parse(userJson) : null;
}
```

## 📝 Sessions API

Создайте `src/lib/sessionApi.ts`:

```typescript
import api from './api';
import { Session, SessionParams } from '@/types';

export async function createSession(params: SessionParams): Promise<Session> {
  const response = await api.post('/sessions', { params });
  return response.data;
}

export async function getSession(id: string): Promise<Session> {
  const response = await api.get(`/sessions/${id}`);
  return response.data;
}

export async function getPublicSession(id: string): Promise<Session> {
  const response = await api.get(`/sessions/public/${id}`);
  return response.data;
}

export async function getSessionsByOrganizer(organizerId: string): Promise<Session[]> {
  const response = await api.get(`/sessions/organizer/${organizerId}`);
  return response.data;
}

export async function getAllSessions(): Promise<Session[]> {
  const response = await api.get('/sessions');
  return response.data;
}
```

## 📊 Session Results API

Создайте `src/lib/sessionResultApi.ts`:

```typescript
import api from './api';
import { SessionResult } from '@/types';

export interface StartSessionRequest {
  studentId?: string;
  studentName?: string;
}

export async function startSession(
  sessionId: string,
  data: StartSessionRequest
): Promise<SessionResult> {
  const response = await api.post(`/session-results/start/${sessionId}`, data);
  return response.data;
}

export async function getSessionResult(id: string): Promise<SessionResult> {
  const response = await api.get(`/session-results/${id}`);
  return response.data;
}

export async function getResultsByOrganizer(organizerId: string): Promise<SessionResult[]> {
  const response = await api.get(`/session-results/organizer/${organizerId}`);
  return response.data;
}

export async function getStats(organizerId: string) {
  const response = await api.get(`/session-results/stats/${organizerId}`);
  return response.data;
}
```

## 💬 Chat API

Создайте `src/lib/chatApi.ts`:

```typescript
import api from './api';

export interface ChatMessageRequest {
  message: string;
  sessionResultId: string;
}

export interface ChatMessageResponse {
  message: string;
  role: 'AI' | 'USER';
  timestamp: string;
}

export async function sendMessage(data: ChatMessageRequest): Promise<ChatMessageResponse> {
  const response = await api.post('/chat/message', data);
  return response.data;
}

export async function completeSession(resultId: string) {
  const response = await api.post(`/chat/complete/${resultId}`);
  return response.data;
}
```

## 🔌 WebSocket Integration

Создайте `src/lib/websocket.ts`:

```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export class ChatWebSocket {
  private client: Client | null = null;
  private sessionResultId: string;
  
  constructor(sessionResultId: string) {
    this.sessionResultId = sessionResultId;
  }
  
  connect(onMessage: (message: string, isComplete: boolean) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        onConnect: () => {
          console.log('Connected to WebSocket');
          
          this.client?.subscribe(`/topic/chat/${this.sessionResultId}`, (message) => {
            const response = JSON.parse(message.body);
            onMessage(response.content, response.isComplete);
          });
          
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          reject(new Error('WebSocket connection failed'));
        },
      });
      
      this.client.activate();
    });
  }
  
  sendMessage(message: string) {
    if (this.client?.connected) {
      this.client.publish({
        destination: `/app/chat/${this.sessionResultId}`,
        body: JSON.stringify({
          sessionResultId: this.sessionResultId,
          message: message,
        }),
      });
    }
  }
  
  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
```

## 🎤 Speech-to-Text (Browser API)

Создайте `src/lib/speechToText.ts`:

```typescript
export class SpeechToText {
  private recognition: any;
  private isListening = false;
  
  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech Recognition not supported');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'ru-RU';
  }
  
  start(onResult: (text: string) => void, onError?: (error: any) => void) {
    if (this.isListening) return;
    
    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      this.isListening = false;
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      onError?.(event.error);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    this.recognition.start();
    this.isListening = true;
  }
  
  stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  isActive() {
    return this.isListening;
  }
}
```

## 🔊 Text-to-Speech (Browser API)

Создайте `src/lib/textToSpeech.ts`:

```typescript
export class TextToSpeech {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  
  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
  }
  
  private loadVoices() {
    const voices = this.synth.getVoices();
    // Prefer Russian voice
    this.voice = voices.find(v => v.lang.startsWith('ru')) || voices[0];
    
    // Chrome loads voices async
    if (voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        const newVoices = this.synth.getVoices();
        this.voice = newVoices.find(v => v.lang.startsWith('ru')) || newVoices[0];
      };
    }
  }
  
  speak(text: string, onEnd?: () => void) {
    // Cancel any ongoing speech
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      onEnd?.();
    };
    
    this.synth.speak(utterance);
  }
  
  stop() {
    this.synth.cancel();
  }
  
  isSpeaking() {
    return this.synth.speaking;
  }
}
```

## 🔄 Обновление SessionView

Пример интеграции в `SessionView.tsx`:

```typescript
import { useEffect, useState, useRef } from 'react';
import { startSession, completeSession } from '@/lib/sessionResultApi';
import { ChatWebSocket } from '@/lib/websocket';
import { SpeechToText } from '@/lib/speechToText';
import { TextToSpeech } from '@/lib/textToSpeech';

export function SessionView({ session, user, onComplete }: Props) {
  const [sessionResultId, setSessionResultId] = useState<string | null>(null);
  const wsRef = useRef<ChatWebSocket | null>(null);
  const sttRef = useRef<SpeechToText | null>(null);
  const ttsRef = useRef<TextToSpeech | null>(null);
  
  useEffect(() => {
    // Initialize services
    sttRef.current = new SpeechToText();
    ttsRef.current = new TextToSpeech();
    
    return () => {
      wsRef.current?.disconnect();
    };
  }, []);
  
  const handleStartSession = async () => {
    try {
      const result = await startSession(session.id!, {
        studentId: user?.id,
        studentName: user?.name,
      });
      
      setSessionResultId(result.id!);
      
      // Connect WebSocket
      const ws = new ChatWebSocket(result.id!);
      await ws.connect((message, isComplete) => {
        if (isComplete) {
          addMessage('ai', message);
          ttsRef.current?.speak(message);
        }
      });
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };
  
  const handleVoiceInput = () => {
    sttRef.current?.start(
      (text) => {
        // Send text to backend
        wsRef.current?.sendMessage(text);
        addMessage('user', text);
      },
      (error) => {
        console.error('Speech recognition error:', error);
      }
    );
  };
  
  const handleEndSession = async () => {
    if (!sessionResultId) return;
    
    try {
      const result = await completeSession(sessionResultId);
      // Show results
      console.log('Session completed:', result);
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };
  
  // Rest of the component...
}
```

## ⚙️ Environment Variables

Создайте `.env` в корне фронтенда:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

Для production:

```env
VITE_API_URL=https://your-backend-url.com/api
VITE_WS_URL=https://your-backend-url.com/ws
```

## 🚀 Запуск

1. **Backend:**
```bash
cd /path/to/backend
mvn spring-boot:run
```

2. **Frontend:**
```bash
cd "AI Tutor Dashboard"
npm run dev
```

3. Откройте http://localhost:5173

## 📝 Checklist интеграции

- [ ] Установлены axios, @stomp/stompjs, sockjs-client
- [ ] Создан api.ts с базовой конфигурацией
- [ ] Заменен mockAuth на реальную аутентификацию
- [ ] Заменен mockData на API calls
- [ ] Интегрирован WebSocket для real-time чата
- [ ] Добавлен Speech-to-Text для голосового ввода
- [ ] Добавлен Text-to-Speech для озвучки ответов
- [ ] Настроены environment variables
- [ ] Протестирован полный flow от регистрации до завершения сессии

## 🐛 Troubleshooting

### CORS ошибки

Убедитесь, что в backend `application.yml` указаны правильные origins:

```yaml
cors:
  allowed-origins: http://localhost:5173
```

### WebSocket не подключается

Проверьте URL и убедитесь, что backend запущен:

```javascript
console.log('WS URL:', WS_URL);
```

### Speech Recognition не работает

Используйте HTTPS или localhost. В production обязательно нужен HTTPS для Web Speech API.

---

Готово! Теперь у вас есть полная интеграция фронтенда с backend. 🎉

