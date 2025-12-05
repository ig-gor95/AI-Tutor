# 🏗️ AI Tutor - Архитектура системы

## 📐 Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                  React + TypeScript + Vite                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Landing  │  │  Login   │  │Dashboard │  │ Session  │  │
│  │   Page   │  │   Form   │  │Components│  │   View   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Speech Recognition                     │  │
│  │         (Web Speech API / OpenAI Whisper)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Text-to-Speech                          │  │
│  │         (Web Speech API / OpenAI TTS)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST + WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│              Kotlin + Spring Boot + PostgreSQL              │
│                                                             │
│  ┌────────────────── API Layer ────────────────────┐      │
│  │                                                   │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │      │
│  │  │   Auth   │  │ Session  │  │   Chat   │      │      │
│  │  │Controller│  │Controller│  │Controller│      │      │
│  │  └──────────┘  └──────────┘  └──────────┘      │      │
│  │                                                   │      │
│  │  ┌─────────────────────────────────────┐        │      │
│  │  │      WebSocket Controller           │        │      │
│  │  │      (Real-time Streaming)          │        │      │
│  │  └─────────────────────────────────────┘        │      │
│  └───────────────────────────────────────────────────      │
│                                                             │
│  ┌────────────────── Service Layer ──────────────────┐    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │   Auth   │  │ Session  │  │  OpenAI  │        │    │
│  │  │ Service  │  │ Service  │  │ Service  │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  │                                                     │    │
│  │  ┌────────────────────────────────────┐           │    │
│  │  │     Session Result Service         │           │    │
│  │  └────────────────────────────────────┘           │    │
│  └─────────────────────────────────────────────────────    │
│                                                             │
│  ┌────────────────── Security Layer ──────────────────┐   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │   JWT    │  │  Filter  │  │  Config  │         │   │
│  │  │   Util   │  │          │  │          │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └──────────────────────────────────────────────────────   │
│                                                             │
│  ┌────────────────── Repository Layer ────────────────┐   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │   User   │  │ Session  │  │  Result  │         │   │
│  │  │   Repo   │  │   Repo   │  │   Repo   │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └──────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ JDBC
                            │
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐            │
│  │  Users   │  │ Sessions │  │    Session    │            │
│  │          │  │          │  │    Results    │            │
│  └──────────┘  └──────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────┘

                            │
                            │ HTTPS API
                            │
┌─────────────────────────────────────────────────────────────┐
│                       OpenAI API                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  GPT-4   │  │ Whisper  │  │   TTS    │                │
│  │   Chat   │  │   STT    │  │  Voice   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Поток данных (Data Flow)

### 1. Регистрация и аутентификация

```
User → Frontend → POST /api/auth/signup → Backend
                                            ↓
                                      Hash password
                                            ↓
                                    Save to PostgreSQL
                                            ↓
                                    Generate JWT token
                                            ↓
Frontend ← JWT + User data ← Backend
```

### 2. Создание сессии

```
Organizer → Frontend → POST /api/sessions → Backend
                                               ↓
                                         Save session
                                               ↓
                                    Generate share URL
                                               ↓
Frontend ← Session data ← Backend
```

### 3. Начало диалога с AI

```
Student → SessionView → Start Session
                           ↓
                  POST /api/session-results/start
                           ↓
                    Backend creates result
                           ↓
                    WebSocket connection
                           ↓
                 User speaks → STT
                           ↓
                    Text message
                           ↓
         WebSocket → /app/chat/{resultId}
                           ↓
                    Backend receives
                           ↓
              Generate system prompt
                           ↓
          Add conversation history
                           ↓
              OpenAI API call
                           ↓
          Streaming response
                           ↓
    WebSocket → /topic/chat/{resultId}
                           ↓
              Frontend receives
                           ↓
                    TTS speaks
                           ↓
              User hears AI
```

### 4. Завершение сессии

```
User → End Session → POST /api/chat/complete/{resultId}
                                    ↓
                        Get conversation history
                                    ↓
                        OpenAI generates feedback
                                    ↓
                        Calculate score
                                    ↓
                        Save to database
                                    ↓
Frontend ← Summary + Score ← Backend
```

## 🗄️ База данных (ERD)

```
┌─────────────────────────┐
│         Users           │
├─────────────────────────┤
│ id          UUID PK     │
│ email       String      │
│ password    String      │
│ name        String      │
│ role        Enum        │
│ created_at  Timestamp   │
└─────────────────────────┘
             │
             │ 1:N
             │
┌─────────────────────────┐
│       Sessions          │
├─────────────────────────┤
│ id          UUID PK     │
│ organizer_id UUID FK    │───┐
│ organizer_name String   │   │
│ params      Embedded    │   │
│ created_at  Timestamp   │   │
│ share_url   String      │   │
└─────────────────────────┘   │
             │                 │
             │ 1:N             │
             │                 │
┌─────────────────────────┐   │
│    Session Results      │   │
├─────────────────────────┤   │
│ id          UUID PK     │   │
│ session_id  UUID FK     │───┘
│ student_id  UUID FK     │───┐
│ student_name String     │   │
│ started_at  Timestamp   │   │
│ completed_at Timestamp  │   │
│ transcript  JSONB       │   │
│ summary     Text        │   │
│ score       Integer     │   │
└─────────────────────────┘   │
                               │
                               │
                        ┌──────┘
                        │
                 (Optional FK)
```

## 🔐 Безопасность

### JWT Authentication Flow

```
1. User login → Backend
2. Backend validates credentials
3. Backend generates JWT (contains: userId, email, role)
4. Frontend stores JWT in localStorage
5. Every request: Authorization: Bearer {JWT}
6. Backend validates JWT on each request
7. If valid → allow access
8. If invalid/expired → 401 Unauthorized
```

### JWT Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user@example.com",
  "userId": "uuid",
  "role": "ORGANIZER",
  "iat": 1234567890,
  "exp": 1234654290
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

## 🎤 Speech Processing

### Speech-to-Text Options

**Option 1: Web Speech API (Browser built-in)**
- ✅ Free
- ✅ No backend needed
- ❌ Less accurate
- ❌ Limited language support

**Option 2: OpenAI Whisper**
- ✅ Very accurate
- ✅ Multi-language
- ❌ Paid
- ❌ Backend processing needed

### Text-to-Speech Options

**Option 1: Web Speech Synthesis API**
- ✅ Free
- ✅ No backend needed
- ❌ Robotic voice
- ❌ Limited customization

**Option 2: OpenAI TTS**
- ✅ Natural voice
- ✅ Multiple voices
- ❌ Paid
- ❌ API calls needed

**Option 3: ElevenLabs**
- ✅ Best quality
- ✅ Voice cloning
- ❌ Most expensive
- ❌ Separate API integration

## 🔌 WebSocket Communication

### Connection Flow

```
Client → SockJS → STOMP Protocol → Spring WebSocket
                                          ↓
                                    Message Broker
                                          ↓
                                  /topic/chat/{id}
                                          ↓
                                  Subscribed clients
```

### Message Format

**Client → Server:**
```json
{
  "sessionResultId": "uuid",
  "message": "User message text"
}
```

**Server → Client:**
```json
{
  "content": "AI response text",
  "isComplete": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

## 📦 Deployment Architecture

### Development

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  localhost   │     │  localhost   │     │  localhost   │
│    :5173     │     │    :8080     │     │    :5432     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            │
                     ┌──────▼──────┐
                     │  OpenAI API │
                     │   (Cloud)   │
                     └─────────────┘
```

### Production (Yandex Cloud)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│   (Vercel)   │     │ (Yandex VM)  │     │  (Managed)   │
│    HTTPS     │     │    HTTPS     │     │   Private    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │
       │                     │
       │              ┌──────▼──────┐
       │              │  OpenAI API │
       └──────────────│   (Cloud)   │
                      └─────────────┘

Load Balancer (optional)
        │
        ▼
┌──────────────┐
│   Nginx      │
│  Reverse     │
│   Proxy      │
└──────────────┘
```

## 🔄 CI/CD Pipeline (Будущее)

```
Developer → Git Push → GitHub
                          │
                          ▼
                    GitHub Actions
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
           Build Backend      Build Frontend
                │                   │
                ▼                   ▼
          Run Tests           Run Tests
                │                   │
                ▼                   ▼
          Create Docker       Build Static
               Image               Files
                │                   │
                ▼                   ▼
        Deploy to Yandex    Deploy to Vercel
          Container              CDN
                │                   │
                └───────┬───────────┘
                        │
                        ▼
                Health Check
                        │
                        ▼
                  Notify Team
```

## 📊 Масштабирование

### Horizontal Scaling

```
            Load Balancer
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    Backend   Backend   Backend
    Instance  Instance  Instance
        │         │         │
        └─────────┼─────────┘
                  │
           ┌──────┴──────┐
           │             │
           ▼             ▼
      PostgreSQL     Redis Cache
      (Primary)      (Session Store)
           │
           ▼
      PostgreSQL
      (Replica)
```

### Optimization Points

1. **Database:**
   - Read replicas
   - Connection pooling
   - Query optimization
   - Indexing

2. **Backend:**
   - Caching (Redis)
   - Horizontal scaling
   - Load balancing
   - Rate limiting

3. **Frontend:**
   - CDN for static assets
   - Code splitting
   - Lazy loading
   - Image optimization

4. **OpenAI:**
   - Response caching
   - Request batching
   - Fallback to cheaper models
   - Rate limit management

## 🔍 Мониторинг

### Metrics to Track

```
Backend:
  - Request rate (req/sec)
  - Response time (ms)
  - Error rate (%)
  - Active WebSocket connections
  - Database connection pool size
  - OpenAI API latency

Database:
  - Query performance
  - Connection count
  - Lock contention
  - Storage usage

Frontend:
  - Page load time
  - API call latency
  - Error rate
  - Active users
```

### Logging Stack (Future)

```
Application Logs → Filebeat → Logstash → Elasticsearch
                                              │
                                              ▼
                                          Kibana
                                        (Visualization)
```

---

## 📝 Summary

Это полная архитектура AI Tutor системы, готовая для production deployment с возможностью масштабирования и мониторинга.

**Основные компоненты:**
- ✅ React Frontend с голосовым вводом/выводом
- ✅ Kotlin Spring Boot Backend
- ✅ PostgreSQL Database
- ✅ JWT Authentication
- ✅ WebSocket для real-time
- ✅ OpenAI Integration
- ✅ Ready for Yandex Cloud

**Дальнейшие улучшения:**
- [ ] Добавить Redis для кеширования
- [ ] Настроить CI/CD
- [ ] Добавить мониторинг (Prometheus/Grafana)
- [ ] Реализовать rate limiting
- [ ] Добавить E2E тесты
- [ ] Оптимизировать OpenAI costs
- [ ] Добавить admin панель

