# 🔊 Варианты озвучки (Text-to-Speech)

## 📊 Сравнение вариантов

| Провайдер | Качество | Скорость | Стоимость | Русский язык |
|-----------|----------|----------|-----------|--------------|
| **Browser TTS** | ⭐⭐ Робот | ⚡⚡⚡ Мгновенно | 💰 Бесплатно | ✅ Да (робот) |
| **OpenAI TTS** | ⭐⭐⭐⭐ Естественно | ⚡⚡ Быстро | 💰 $15/1M символов | ✅ Отлично |
| **Yandex SpeechKit** | ⭐⭐⭐⭐⭐ Очень естественно | ⚡⚡ Быстро | 💰 Бесплатный tier | ✅✅ Лучшее |
| **ElevenLabs** | ⭐⭐⭐⭐⭐ Идеально | ⚡⚡ Быстро | 💰💰 Дорого | ✅ Отлично |

---

## 1. 🎤 OpenAI TTS (Рекомендуется)

### ✅ Преимущества:
- **Естественный голос** - звучит как живой человек
- **Уже есть API ключ** - не нужно регистрироваться
- **Быстро работает** - ~1-2 секунды
- **6 разных голосов** на выбор

### 🎭 Доступные голоса:

**Для русского языка:**
- **`nova`** ⭐ - Женский, теплый, выразительный (РЕКОМЕНДУЕТСЯ)
- **`onyx`** - Мужской, глубокий, уверенный
- **`alloy`** - Нейтральный, универсальный

**Для английского:**
- `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

### 💰 Стоимость:
- **tts-1**: $15 за 1 миллион символов (~$0.015 за 1000 символов)
- **tts-1-hd**: $30 за 1 миллион символов (лучшее качество)

**Пример:**
- 1 сессия = ~500 символов ответа
- Стоимость: ~$0.0075 за сессию

### ⚙️ Настройка:

Уже настроено! Просто перезапустите backend.

**Изменить голос:**
```typescript
// В SessionView.tsx
ttsRef.current = new TextToSpeechAdvanced({
  provider: 'openai',
  voice: 'nova', // или 'onyx' для мужского
  language: 'ru'
});
```

---

## 2. 🇷🇺 Yandex SpeechKit (Лучшее для русского)

### ✅ Преимущества:
- **Самое лучшее качество** для русского языка
- **Бесплатный tier**: 1 миллион символов/месяц
- **Много голосов**: jane, oksana, omazh, zahar, ermil
- **Очень естественно** - почти как живой человек

### 🎭 Доступные голоса:

- **`jane`** ⭐ - Женский, дружелюбный (РЕКОМЕНДУЕТСЯ)
- **`oksana`** - Женский, профессиональный
- **`omazh`** - Женский, спокойный
- **`zahar`** - Мужской, уверенный
- **`ermil`** - Мужской, нейтральный

### 📝 Настройка Yandex SpeechKit:

#### Шаг 1: Получить API ключ

1. Зайдите на https://cloud.yandex.ru/
2. Создайте аккаунт (если нет)
3. Создайте сервисный аккаунт
4. Получите API ключ для SpeechKit

#### Шаг 2: Добавить в application.yml

```yaml
yandex:
  speechkit:
    api-key: ${YANDEX_SPEECHKIT_API_KEY:your-yandex-api-key}
```

#### Шаг 3: Реализовать в TTSService

См. пример кода ниже.

---

## 3. 🎨 ElevenLabs (Премиум качество)

### ✅ Преимущества:
- **Идеальное качество** - неотличимо от человека
- **Клонирование голоса** - можно использовать свой голос
- **Эмоции** - можно настроить эмоциональность

### 💰 Стоимость:
- От $5/месяц за 30,000 символов
- Дорого, но лучшее качество

### ⚙️ Настройка:

Требует отдельной интеграции через их API.

---

## 🚀 Текущая реализация

### ✅ Реализовано:

1. **OpenAI TTS** - полностью работает
2. **Browser TTS** - fallback если OpenAI недоступен
3. **Автоматический выбор** - OpenAI по умолчанию

### 🔧 Как использовать:

**В SessionView уже настроено:**
```typescript
// Использует OpenAI TTS с голосом 'nova' (женский)
ttsRef.current = new TextToSpeechAdvanced({
  provider: 'openai',
  voice: 'nova',
  language: 'ru'
});
```

**Изменить голос:**
```typescript
// Мужской голос
ttsRef.current = new TextToSpeechAdvanced({
  provider: 'openai',
  voice: 'onyx', // мужской
  language: 'ru'
});
```

**Использовать Browser TTS (бесплатно, но робот):**
```typescript
ttsRef.current = new TextToSpeechAdvanced({
  provider: 'browser',
  language: 'ru'
});
```

---

## 📝 Реализация Yandex SpeechKit (опционально)

Если хотите добавить Yandex TTS, вот код:

### Backend (TTSService.kt):

```kotlin
fun generateYandexTTS(
    text: String, 
    voice: String = "jane", 
    speed: Double = 1.0,
    apiKey: String
): ByteArray {
    val url = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"
    
    val requestBody = mapOf(
        "text" to text,
        "lang" to "ru-RU",
        "voice" to voice,
        "speed" to speed.toString(),
        "format" to "mp3",
        "folderId" to "your-folder-id" // или используйте apiKey
    )
    
    // HTTP запрос к Yandex API
    // Вернуть ByteArray с аудио
}
```

---

## 🎯 Рекомендации

### Для быстрого старта:
✅ **Используйте OpenAI TTS** - уже настроено, работает отлично

### Для лучшего качества русского:
✅ **Yandex SpeechKit** - самое естественное звучание

### Для экономии:
✅ **Browser TTS** - бесплатно, но роботизированно

---

## 🔄 Переключение провайдеров

Можно добавить переключатель в UI:

```typescript
// В SessionView добавить кнопку выбора
const [ttsProvider, setTTSProvider] = useState<TTSProvider>('openai');

// В UI
<select onChange={(e) => setTTSProvider(e.target.value as TTSProvider)}>
  <option value="openai">OpenAI TTS (естественно)</option>
  <option value="yandex">Yandex (лучше для русского)</option>
  <option value="browser">Browser (бесплатно)</option>
</select>
```

---

## ✅ Текущий статус

- ✅ OpenAI TTS - **РАБОТАЕТ**
- ⏳ Yandex SpeechKit - требует API ключ
- ⏳ ElevenLabs - требует интеграцию

**Рекомендация:** Используйте OpenAI TTS с голосом `nova` - это уже очень хорошее качество!

---

**Обновлено:** 2024-12-03

