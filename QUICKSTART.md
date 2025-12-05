# 🚀 AI Tutor - Quick Start Guide

Полное руководство по запуску проекта AI Tutor (Backend + Frontend).

## 📋 Требования

- **Java 17+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Maven 3.8+**
- **OpenAI API Key**

## ⚡ Быстрый старт (5 минут)

### 1. Клонируйте репозиторий (если еще не сделано)

```bash
cd /Users/igorlapin/IdeaProjects/AI_tutor
```

### 2. Настройка PostgreSQL

```bash
# MacOS
brew install postgresql@14
brew services start postgresql@14

# Создать БД
psql postgres -c "CREATE DATABASE ai_tutor;"
```

### 3. Настройка Backend

```bash
# Скопировать пример env файла
cp env.example env.local

# Отредактировать env.local и добавить свои значения:
# - DATABASE_PASSWORD=your_password
# - OPENAI_API_KEY=sk-your-openai-key
# - JWT_SECRET=your-random-256-bit-secret
```

Экспортировать переменные окружения:

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/ai_tutor
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=postgres
export JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-256-bits
export OPENAI_API_KEY=sk-your-openai-api-key
export OPENAI_MODEL=gpt-4-turbo-preview
export CORS_ORIGINS=http://localhost:5173
```

**Или создайте файл** `src/main/resources/application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ai_tutor
    username: postgres
    password: your_password

jwt:
  secret: your-jwt-secret-here

openai:
  api-key: sk-your-openai-key
```

### 4. Запуск Backend

```bash
# Собрать проект
mvn clean install -DskipTests

# Запустить
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Или с local профилем
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend запустится на: **http://localhost:8080**

Проверьте: http://localhost:8080/api/auth/login (должен вернуть 401)

### 5. Настройка Frontend

```bash
cd "AI Tutor Dashboard"

# Установить зависимости
npm install

# Создать .env файл
echo "VITE_API_URL=http://localhost:8080/api" > .env
echo "VITE_WS_URL=http://localhost:8080/ws" >> .env
```

### 6. Запуск Frontend

```bash
npm run dev
```

Frontend запустится на: **http://localhost:5173**

## 🎯 Тестирование

### 1. Откройте браузер

```
http://localhost:5173
```

### 2. Регистрация

- Нажмите "Войти как организатор"
- Зарегистрируйтесь (email, пароль, имя)
- Выберите роль: **ORGANIZER**

### 3. Создание сессии

- В дашборде нажмите "Создать сессию"
- Заполните:
  - Тема: "Основы JavaScript"
  - Сложность: Средний
  - Длительность: 30 минут
  - Цели обучения: "Изучить переменные", "Понять функции"
- Нажмите "Создать сессию"

### 4. Начало диалога

- Перейдите во вкладку "Сессии с роботом"
- Нажмите "Начать разговор с роботом"
- Начните диалог с AI

### 5. Тестирование голоса (опционально)

- Нажмите кнопку микрофона
- Скажите что-то (например: "Расскажи про переменные")
- AI ответит голосом

### 6. Завершение сессии

- Нажмите "Завершить сессию"
- Получите feedback и оценку
- Посмотрите статистику во вкладке "Статистика"

## 📊 Структура проекта

```
AI_tutor/
├── src/main/kotlin/com/aitutor/     # Backend (Kotlin + Spring Boot)
│   ├── config/                       # Конфигурация
│   ├── controller/                   # REST Controllers
│   ├── model/                        # Entity и DTO
│   ├── repository/                   # JPA Repositories
│   ├── security/                     # JWT Security
│   └── service/                      # Business Logic
│
├── AI Tutor Dashboard/               # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/               # React компоненты
│   │   ├── lib/                      # API clients, utils
│   │   └── types/                    # TypeScript типы
│   └── public/
│
├── README_BACKEND.md                 # Backend документация
├── INTEGRATION.md                    # Гайд по интеграции
├── QUICKSTART.md                     # Этот файл
├── env.example                       # Пример env переменных
└── init-db.sql                       # SQL для инициализации БД
```

## 🔧 Основные API endpoints

### Authentication
- `POST /api/auth/signup` - Регистрация
- `POST /api/auth/login` - Вход

### Sessions
- `POST /api/sessions` - Создать сессию
- `GET /api/sessions/{id}` - Получить сессию
- `GET /api/sessions/organizer/{organizerId}` - Сессии организатора

### Session Results
- `POST /api/session-results/start/{sessionId}` - Начать сессию
- `GET /api/session-results/organizer/{organizerId}` - Результаты
- `GET /api/session-results/stats/{organizerId}` - Статистика

### Chat
- `POST /api/chat/message` - Отправить сообщение
- `POST /api/chat/complete/{resultId}` - Завершить сессию

### WebSocket
- `ws://localhost:8080/ws` - WebSocket endpoint

## 🐳 Docker (опционально)

### Docker Compose

Создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ai_tutor
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://postgres:5432/ai_tutor
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      JWT_SECRET: your-jwt-secret
      OPENAI_API_KEY: sk-your-openai-key
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Запуск:

```bash
docker-compose up -d
```

## 🔍 Troubleshooting

### Backend не запускается

**Проблема:** `Connection refused to PostgreSQL`

**Решение:**
```bash
# Проверить статус PostgreSQL
brew services list

# Перезапустить
brew services restart postgresql@14

# Проверить подключение
psql -h localhost -U postgres -d ai_tutor
```

### OpenAI API ошибки

**Проблема:** `401 Unauthorized` или `Rate limit exceeded`

**Решение:**
- Проверьте API key в env переменных
- Убедитесь, что у вас есть credits на аккаунте OpenAI
- Попробуйте модель `gpt-3.5-turbo` вместо `gpt-4`

### Frontend не подключается к Backend

**Проблема:** CORS errors

**Решение:**
```yaml
# В application.yml добавьте:
cors:
  allowed-origins: http://localhost:5173,http://localhost:3000
```

### Speech Recognition не работает

**Решение:**
- Используйте HTTPS или localhost
- Убедитесь, что браузер поддерживает Web Speech API (Chrome/Edge)
- Разрешите доступ к микрофону в браузере

## 📝 Полезные команды

### Backend

```bash
# Сборка
mvn clean install

# Запуск с профилем
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Тесты
mvn test

# Создать JAR
mvn clean package
```

### Frontend

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Preview production build
npm run preview
```

### PostgreSQL

```bash
# Подключиться к БД
psql -h localhost -U postgres -d ai_tutor

# Посмотреть таблицы
\dt

# Посмотреть пользователей
SELECT * FROM users;

# Посмотреть сессии
SELECT * FROM sessions;

# Выход
\q
```

## 🚀 Production Deploy

### Backend на Yandex Cloud

См. детальную инструкцию в `README_BACKEND.md`

### Frontend на Vercel

```bash
cd "AI Tutor Dashboard"

# Установить Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

В настройках Vercel добавьте environment variables:
- `VITE_API_URL` = your backend URL
- `VITE_WS_URL` = your WebSocket URL

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи backend: `tail -f logs/spring.log`
2. Проверьте консоль браузера (F12)
3. Убедитесь, что все сервисы запущены:
   - PostgreSQL: `brew services list`
   - Backend: `curl http://localhost:8080/actuator/health`
   - Frontend: http://localhost:5173

## ✅ Checklist перед production

- [ ] Изменить JWT_SECRET на случайную строку (256+ бит)
- [ ] Настроить правильные CORS origins
- [ ] Включить HTTPS
- [ ] Настроить backup базы данных
- [ ] Добавить rate limiting
- [ ] Настроить логирование
- [ ] Добавить мониторинг (Grafana, Prometheus)
- [ ] Настроить CDN для фронтенда
- [ ] Оптимизировать размер Docker образов
- [ ] Настроить CI/CD

---

🎉 **Готово! Теперь у вас полностью рабочий AI Tutor!**

Для более детальной информации см.:
- `README_BACKEND.md` - Backend документация
- `INTEGRATION.md` - Гайд по интеграции фронтенда
- `AI Tutor Dashboard/README.md` - Frontend документация

