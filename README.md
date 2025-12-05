# 🤖 AI Tutor

> Интеллектуальная платформа для обучения и тестирования знаний с использованием AI

![AI Tutor](https://img.shields.io/badge/AI-Tutor-blue)
![Kotlin](https://img.shields.io/badge/Kotlin-1.9.21-purple)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 📖 Описание

AI Tutor - это полнофункциональная платформа для проведения интерактивных учебных сессий с AI-тьютором. Преподаватели могут создавать персонализированные сессии, а студенты - проходить обучение или тестирование в режиме реального времени с голосовым взаимодействием.

### ✨ Основные возможности

- 🎓 **Создание учебных сессий** с детальными параметрами
- 🤖 **AI-тьютор на базе GPT-4** для интерактивного обучения
- 🎤 **Голосовое взаимодействие** (Speech-to-Text и Text-to-Speech)
- 💬 **Real-time чат** через WebSocket
- 📊 **Автоматическая оценка** и feedback
- 📈 **Детальная статистика** для организаторов
- 🔐 **Безопасная аутентификация** с JWT

## 🏗️ Архитектура

```
Frontend (React + TypeScript)
    ↓ HTTP/REST + WebSocket
Backend (Kotlin + Spring Boot)
    ↓ JDBC
PostgreSQL Database
    ↓ API
OpenAI GPT-4
```

## 🚀 Быстрый старт

### Требования

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+
- OpenAI API Key

### Установка

```bash
# 1. Клонируйте репозиторий
cd /Users/igorlapin/IdeaProjects/AI_tutor

# 2. Настройте PostgreSQL
createdb ai_tutor

# 3. Настройте переменные окружения
cp env.example .env
# Отредактируйте .env и добавьте свой OPENAI_API_KEY

# 4. Запустите Backend
mvn spring-boot:run

# 5. В новом терминале запустите Frontend
cd "AI Tutor Dashboard"
npm install
npm run dev

# 6. Откройте браузер
# http://localhost:5173
```

## 📚 Документация

Полная документация доступна в следующих файлах:

- **[QUICKSTART.md](QUICKSTART.md)** - Быстрый старт за 5 минут
- **[README_BACKEND.md](README_BACKEND.md)** - Подробная документация backend
- **[INTEGRATION.md](AI%20Tutor%20Dashboard/INTEGRATION.md)** - Гайд по интеграции фронтенда
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Архитектура системы
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Что было реализовано

## 🎯 Основные компоненты

### Backend (Kotlin + Spring Boot)

- ✅ JWT Authentication
- ✅ REST API (15+ endpoints)
- ✅ WebSocket для real-time чата
- ✅ OpenAI GPT-4 интеграция
- ✅ PostgreSQL database
- ✅ Безопасность и CORS

**Технологии:** Kotlin, Spring Boot, PostgreSQL, JWT, WebSocket, OpenAI API

### Frontend (React + TypeScript)

- ✅ Современный UI с Radix UI
- ✅ Управление сессиями
- ✅ Real-time чат
- ✅ Голосовое взаимодействие
- ✅ Статистика и аналитика

**Технологии:** React, TypeScript, Vite, TailwindCSS, Radix UI

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Регистрация
- `POST /api/auth/login` - Вход

### Sessions
- `POST /api/sessions` - Создать сессию
- `GET /api/sessions/{id}` - Получить сессию
- `GET /api/sessions/organizer/{organizerId}` - Сессии организатора

### Chat
- `POST /api/chat/message` - Отправить сообщение
- `POST /api/chat/complete/{resultId}` - Завершить сессию

### WebSocket
- `ws://localhost:8080/ws` - WebSocket endpoint

[Полный список API endpoints →](README_BACKEND.md#-api-endpoints)

## 🗄️ Database Schema

```sql
Users (id, email, password, name, role, created_at)
    ↓ 1:N
Sessions (id, organizer_id, params, created_at, share_url)
    ↓ 1:N
SessionResults (id, session_id, student_id, transcript, summary, score)
```

## 🎤 Голосовое взаимодействие

### Speech-to-Text (STT)
- **Web Speech API** (бесплатно, встроено в браузер)
- **OpenAI Whisper** (точнее, но платно)

### Text-to-Speech (TTS)
- **Web Speech Synthesis API** (бесплатно, встроено в браузер)
- **OpenAI TTS** (более естественный голос)
- **ElevenLabs** (лучшее качество, но дорого)

## 📊 Пример использования

### 1. Создание сессии (Организатор)

```typescript
const session = await createSession({
  params: {
    topic: "Основы React",
    difficulty: "INTERMEDIATE",
    duration: 30,
    language: "RU",
    goals: ["Изучить хуки", "Понять состояние"],
    personality: "FRIENDLY",
    interactionStyle: "MIXED"
  }
});
```

### 2. Начало диалога (Студент)

```typescript
const result = await startSession(sessionId, {
  studentId: userId,
  studentName: userName
});

// WebSocket подключение
const ws = new ChatWebSocket(result.id);
await ws.connect((message) => {
  console.log("AI:", message);
  speak(message); // TTS
});

// Голосовой ввод
const stt = new SpeechToText();
stt.start((text) => {
  ws.sendMessage(text);
});
```

### 3. Получение результатов

```typescript
const results = await completeSession(resultId);
console.log("Score:", results.score); // 0-100
console.log("Feedback:", results.summary);
```

## 🚀 Deployment

### Backend (Yandex Cloud)

```bash
# Создать VM
yc compute instance create --name ai-tutor-backend

# Создать Managed PostgreSQL
yc managed-postgresql cluster create --name ai-tutor-db

# Deploy
scp target/ai-tutor-backend.jar ubuntu@{VM_IP}:
ssh ubuntu@{VM_IP}
sudo systemctl start ai-tutor
```

[Подробная инструкция →](README_BACKEND.md#-deploy-на-yandex-cloud)

### Frontend (Vercel)

```bash
cd "AI Tutor Dashboard"
vercel --prod
```

## 🧪 Тестирование

```bash
# Backend tests
mvn test

# Frontend tests
cd "AI Tutor Dashboard"
npm test

# E2E tests
npm run test:e2e
```

## 📈 Производительность

- **Response time:** ~500ms (без OpenAI)
- **OpenAI latency:** ~2-5s (зависит от модели)
- **WebSocket:** Real-time (<100ms)
- **Concurrent users:** 1000+ (с horizontal scaling)

## 🔐 Безопасность

- ✅ JWT токены с истечением срока
- ✅ Password hashing (BCrypt)
- ✅ CORS configuration
- ✅ Role-based access control
- ✅ SQL injection protection (JPA)
- ✅ XSS protection

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста:

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 TODO

- [ ] Redis caching для OpenAI responses
- [ ] Rate limiting
- [ ] Admin панель
- [ ] Мобильное приложение
- [ ] Поддержка видео
- [ ] Group sessions
- [ ] AI voice cloning

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

## 👥 Команда

- **Backend:** Kotlin + Spring Boot
- **Frontend:** React + TypeScript
- **AI:** OpenAI GPT-4
- **Database:** PostgreSQL

## 📞 Контакты

- **Email:** support@aitutor.example.com
- **Telegram:** @aitutor
- **GitHub Issues:** [Create Issue](https://github.com/yourusername/ai-tutor/issues)

## 🙏 Благодарности

- OpenAI за GPT-4 API
- Spring Boot team
- React community
- Yandex Cloud

---

**Сделано с ❤️ для лучшего образования**

[![Made with Kotlin](https://img.shields.io/badge/Made%20with-Kotlin-purple.svg)](https://kotlinlang.org/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-blue.svg)](https://reactjs.org/)
[![Powered by OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI-green.svg)](https://openai.com/)

