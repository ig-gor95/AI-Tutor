# AI Tutor Backend

Backend сервер для AI Tutor приложения на Kotlin + Spring Boot.

## 🚀 Технологии

- **Kotlin** 1.9.21
- **Spring Boot** 3.2.0
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **OpenAI API** - интеграция с GPT
- **WebSocket** - real-time streaming

## 📋 Требования

- Java 17+
- PostgreSQL 14+
- Maven 3.8+
- OpenAI API Key

## ⚙️ Установка и настройка

### 1. Установка PostgreSQL

**MacOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get install postgresql-14
sudo systemctl start postgresql
```

**Windows:**
Скачайте с https://www.postgresql.org/download/windows/

### 2. Создание базы данных

```bash
# Войти в PostgreSQL
psql postgres

# Создать базу данных
CREATE DATABASE ai_tutor;

# Создать пользователя (опционально)
CREATE USER ai_tutor_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_tutor TO ai_tutor_user;

# Выход
\q
```

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и добавьте свои значения:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/ai_tutor
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password

JWT_SECRET=your-256-bit-secret-key-here

OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

CORS_ORIGINS=http://localhost:5173
```

### 4. Сборка проекта

```bash
mvn clean install
```

### 5. Запуск приложения

**Development mode:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Production mode:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Сервер запустится на `http://localhost:8080`

## 📡 API Endpoints

### Authentication

#### Регистрация
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "ORGANIZER"
}
```

#### Вход
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ORGANIZER"
  }
}
```

### Sessions

#### Создать сессию
```http
POST /api/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "params": {
    "topic": "Основы React",
    "difficulty": "INTERMEDIATE",
    "duration": 30,
    "language": "RU",
    "goals": ["Изучить хуки", "Понять состояние"],
    "personality": "FRIENDLY",
    "interactionStyle": "MIXED"
  }
}
```

#### Получить сессию
```http
GET /api/sessions/{id}
Authorization: Bearer {token}
```

#### Получить сессии организатора
```http
GET /api/sessions/organizer/{organizerId}
Authorization: Bearer {token}
```

### Session Results

#### Начать сессию
```http
POST /api/session-results/start/{sessionId}
Content-Type: application/json

{
  "studentId": "uuid",
  "studentName": "Student Name"
}
```

#### Получить результаты
```http
GET /api/session-results/organizer/{organizerId}
Authorization: Bearer {token}
```

#### Статистика
```http
GET /api/session-results/stats/{organizerId}
Authorization: Bearer {token}
```

### Chat

#### Отправить сообщение
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Расскажи про useState",
  "sessionResultId": "uuid"
}
```

#### Завершить сессию
```http
POST /api/chat/complete/{resultId}
```

**Response:**
```json
{
  "summary": "Детальная обратная связь...",
  "score": 85,
  "result": { ... }
}
```

## 🔌 WebSocket

### Подключение

```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {
  stompClient.subscribe(`/topic/chat/${sessionResultId}`, (message) => {
    const response = JSON.parse(message.body);
    console.log(response.content);
  });
});
```

### Отправка сообщения

```javascript
stompClient.send(`/app/chat/${sessionResultId}`, {}, JSON.stringify({
  sessionResultId: "uuid",
  message: "Привет!"
}));
```

## 🗄️ Database Schema

### Users
- id (UUID, PK)
- email (String, unique)
- password (String, hashed)
- name (String)
- role (ENUM: ORGANIZER, STUDENT)
- created_at (Timestamp)

### Sessions
- id (UUID, PK)
- organizer_id (UUID, FK)
- organizer_name (String)
- params (Embedded SessionParams)
- created_at (Timestamp)
- share_url (String)

### Session Results
- id (UUID, PK)
- session_id (UUID, FK)
- student_id (UUID, nullable)
- student_name (String, nullable)
- started_at (Timestamp)
- completed_at (Timestamp, nullable)
- transcript (JSONB)
- summary (Text, nullable)
- score (Integer, nullable)

## 🐳 Docker (опционально)

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
docker build -t ai-tutor-backend .
docker run -p 8080:8080 --env-file .env ai-tutor-backend
```

## 📦 Deploy на Yandex Cloud

### 1. Создать виртуальную машину

```bash
yc compute instance create \
  --name ai-tutor-backend \
  --zone ru-central1-a \
  --network-interface subnet-name=default,nat-ip-version=ipv4 \
  --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-2004-lts \
  --ssh-key ~/.ssh/id_rsa.pub
```

### 2. Создать Managed PostgreSQL

```bash
yc managed-postgresql cluster create \
  --name ai-tutor-db \
  --environment production \
  --network-name default \
  --database name=ai_tutor \
  --user name=ai_tutor_user,password=your_password
```

### 3. Задеплоить приложение

```bash
# Скопировать JAR файл
scp target/ai-tutor-backend-1.0.0.jar ubuntu@{VM_IP}:/home/ubuntu/

# Подключиться к VM
ssh ubuntu@{VM_IP}

# Установить Java
sudo apt update
sudo apt install openjdk-17-jdk

# Создать systemd service
sudo nano /etc/systemd/system/ai-tutor.service
```

Содержимое service файла:

```ini
[Unit]
Description=AI Tutor Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/java -jar /home/ubuntu/ai-tutor-backend-1.0.0.jar
Restart=on-failure
Environment="DATABASE_URL=jdbc:postgresql://..."
Environment="OPENAI_API_KEY=sk-..."
Environment="JWT_SECRET=..."

[Install]
WantedBy=multi-user.target
```

```bash
# Запустить сервис
sudo systemctl daemon-reload
sudo systemctl start ai-tutor
sudo systemctl enable ai-tutor

# Проверить статус
sudo systemctl status ai-tutor
```

## 🧪 Тестирование

```bash
# Запустить все тесты
mvn test

# Запустить с покрытием
mvn test jacoco:report
```

## 📝 Логи

```bash
# Просмотр логов
tail -f logs/spring.log

# Логи в production
journalctl -u ai-tutor -f
```

## 🔧 Troubleshooting

### Проблема: Connection refused к PostgreSQL

**Решение:**
```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить подключение
psql -h localhost -U postgres -d ai_tutor
```

### Проблема: OpenAI API timeout

**Решение:** Увеличить timeout в `OpenAIService`:
```kotlin
private val openAiService = OpenAiService(apiKey, Duration.ofSeconds(120))
```

## 📞 Поддержка

Если возникли вопросы, создайте issue в репозитории.

## 📄 Лицензия

MIT

