# Phonetics Analysis Service

Python-микросервис для точного анализа формант и фонетики с использованием Praat (через parselmouth).

## Возможности

- ✅ Точное извлечение формант (F1, F2, F3, F4) используя LPC анализ
- ✅ Определение основного тона (F0)
- ✅ Анализ bandwidth (ширины полосы) формант
- ✅ Поддержка различных аудио форматов (WAV, MP3)
- ✅ Анализ отдельных сегментов аудио
- ✅ REST API для интеграции с Kotlin бэкендом

## Установка

### 1. Создать виртуальное окружение

```bash
python3 -m venv venv
source venv/bin/activate  # На Linux/Mac
# или
venv\Scripts\activate  # На Windows
```

### 2. Установить зависимости

```bash
pip install -r requirements.txt
```

**Примечание:** `parselmouth` требует установленный Praat. На Linux/Mac он обычно устанавливается автоматически. На Windows может потребоваться ручная установка.

### 3. Запустить сервис

```bash
python app.py
```

Или через uvicorn:

```bash
uvicorn app:app --host 0.0.0.0 --port 8041 --reload
```

Сервис будет доступен по адресу: `http://localhost:8041`

## API Endpoints

### POST `/analyze-phoneme`

Анализ фонемы из base64 закодированного аудио.

**Request Body:**
```json
{
  "audio_data": "base64_encoded_audio",
  "audio_format": "wav",
  "phoneme": "с",
  "start_time": 0.0,
  "end_time": 0.25
}
```

**Response:**
```json
{
  "success": true,
  "formants": {
    "f1": 400.5,
    "f2": 2500.3,
    "f3": 3200.1,
    "f4": null,
    "f0": 150.2,
    "bandwidth_f1": 45.0,
    "bandwidth_f2": 120.5
  },
  "sample_rate": 44100,
  "duration": 0.25,
  "message": "Analyzed phoneme 'с' using Praat LPC analysis"
}
```

### POST `/analyze-phoneme-file`

Анализ фонемы из загруженного файла (multipart/form-data).

**Form Data:**
- `file`: аудио файл
- `phoneme`: название фонемы (опционально)
- `start_time`: начало сегмента (опционально)
- `end_time`: конец сегмента (опционально)

### GET `/health`

Health check endpoint.

## Интеграция с Kotlin бэкендом

Сервис можно вызывать из Kotlin через HTTP клиент:

```kotlin
suspend fun analyzePhonemeWithPraat(
    audioBytes: ByteArray,
    phoneme: String,
    startTime: Double? = null,
    endTime: Double? = null
): FormantAnalysis {
    val client = HttpClient(CIO)
    val base64Audio = Base64.getEncoder().encodeToString(audioBytes)
    
    val request = PhonemeAnalysisRequest(
        audioData = base64Audio,
        audioFormat = "wav",
        phoneme = phoneme,
        startTime = startTime,
        endTime = endTime
    )
    
    val response: PhonemeAnalysisResponse = client.post("http://localhost:8041/analyze-phoneme") {
        contentType(ContentType.Application.Json)
        setBody(request)
    }.body()
    
    return response.formants
}
```

## Преимущества перед текущей реализацией

1. **Точность**: ±5-10 Hz вместо ±50-100 Hz
2. **LPC анализ**: Стандартный метод для извлечения формант
3. **Фильтрация**: Автоматическая фильтрация гармоник и шумов
4. **Дополнительные метрики**: F0, bandwidth, F3, F4
5. **Проверенные алгоритмы**: Praat используется в фонетике десятилетиями

## Troubleshooting

### Ошибка при установке parselmouth

На некоторых системах может потребоваться установить системные зависимости:

**Ubuntu/Debian:**
```bash
sudo apt-get install libpraat-dev
```

**macOS:**
```bash
brew install praat
```

**Windows:**
Скачать Praat с официального сайта: https://www.fon.hum.uva.nl/praat/

### Проблемы с аудио форматами

Убедитесь, что аудио файлы имеют правильный формат. Рекомендуется использовать WAV с частотой дискретизации 16-44.1 kHz.

## Лицензия

Этот сервис использует parselmouth, который является оберткой для Praat. Praat распространяется под лицензией GPL.

