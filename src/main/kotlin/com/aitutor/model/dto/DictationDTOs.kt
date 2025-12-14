package com.aitutor.model.dto

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Запрос на анализ дикции
 */
data class DictationAnalysisRequest(
    @JsonProperty("audioData")
    val audioData: String, // Base64 encoded audio (WAV/MP3)
    
    @JsonProperty("audioFormat")
    val audioFormat: String, // "wav" or "mp3"
    
    @JsonProperty("expectedText")
    val expectedText: String, // Ожидаемый текст для сравнения
    
    @JsonProperty("language")
    val language: String = "ru" // Язык анализа
)

/**
 * Анализ отдельного звука/фонемы
 */
data class PhonemeAnalysis(
    @JsonProperty("phoneme")
    val phoneme: String, // Фонема (например, "т", "а", "н")
    
    @JsonProperty("position")
    val position: Int, // Позиция в тексте
    
    @JsonProperty("accuracy")
    val accuracy: Double, // Точность произношения (0.0 - 1.0)
    
    @JsonProperty("deviation")
    val deviation: Double, // Отклонение от эталона
    
    @JsonProperty("issues")
    val issues: List<String>, // Список проблем
    
    @JsonProperty("formantF1")
    val formantF1: Double? = null, // Первая форманта
    
    @JsonProperty("formantF2")
    val formantF2: Double? = null, // Вторая форманта
    
    @JsonProperty("duration")
    val duration: Double? = null // Длительность звука в мс
)

/**
 * Анализ слова
 */
data class WordAnalysis(
    @JsonProperty("word")
    val word: String,
    
    @JsonProperty("position")
    val position: Int,
    
    @JsonProperty("overallAccuracy")
    val overallAccuracy: Double, // Общая точность слова (0.0 - 1.0)
    
    @JsonProperty("phonemes")
    val phonemes: List<PhonemeAnalysis>,
    
    @JsonProperty("stressAccuracy")
    val stressAccuracy: Double? = null, // Точность ударения
    
    @JsonProperty("issues")
    val issues: List<String>
)

/**
 * Анализ интонации
 */
data class IntonationAnalysis(
    @JsonProperty("pitchContour")
    val pitchContour: List<Double>, // Контур высоты тона (Hz)
    
    @JsonProperty("pitchVariation")
    val pitchVariation: Double, // Вариация высоты тона
    
    @JsonProperty("averagePitch")
    val averagePitch: Double, // Средняя высота тона
    
    @JsonProperty("pitchRange")
    val pitchRange: Double, // Диапазон высоты тона
    
    @JsonProperty("monotonyScore")
    val monotonyScore: Double, // Оценка монотонности (0.0 - 1.0, выше = более монотонно)
    
    @JsonProperty("intonationPattern")
    val intonationPattern: String? = null // Паттерн интонации
)

/**
 * Анализ тембра
 */
data class TimbreAnalysis(
    @JsonProperty("spectralCentroid")
    val spectralCentroid: Double, // Спектральный центроид (яркость звука)
    
    @JsonProperty("spectralRolloff")
    val spectralRolloff: Double, // Спектральный роллофф
    
    @JsonProperty("zeroCrossingRate")
    val zeroCrossingRate: Double, // Частота пересечения нуля
    
    @JsonProperty("mfcc")
    val mfcc: List<Double>, // Mel-frequency cepstral coefficients (первые 13)
    
    @JsonProperty("harmonicity")
    val harmonicity: Double? = null // Гармоничность
)

/**
 * Анализ артикуляции
 */
data class ArticulationAnalysis(
    @JsonProperty("clarity")
    val clarity: Double, // Ясность произношения (0.0 - 1.0)
    
    @JsonProperty("consonantAccuracy")
    val consonantAccuracy: Double, // Точность согласных
    
    @JsonProperty("vowelAccuracy")
    val vowelAccuracy: Double, // Точность гласных
    
    @JsonProperty("transitionSmoothness")
    val transitionSmoothness: Double, // Плавность переходов между звуками
    
    @JsonProperty("issues")
    val issues: List<String>
)

/**
 * Полный ответ анализа дикции
 */
data class DictationAnalysisResponse(
    @JsonProperty("success")
    val success: Boolean,
    
    @JsonProperty("overallAccuracy")
    val overallAccuracy: Double, // Общая точность (0.0 - 1.0)
    
    @JsonProperty("words")
    val words: List<WordAnalysis>, // Анализ по словам
    
    @JsonProperty("phonemes")
    val phonemes: List<PhonemeAnalysis>, // Анализ по фонемам
    
    @JsonProperty("intonation")
    val intonation: IntonationAnalysis, // Анализ интонации
    
    @JsonProperty("timbre")
    val timbre: TimbreAnalysis, // Анализ тембра
    
    @JsonProperty("articulation")
    val articulation: ArticulationAnalysis, // Анализ артикуляции
    
    @JsonProperty("audioDuration")
    val audioDuration: Double, // Длительность аудио в секундах
    
    @JsonProperty("sampleRate")
    val sampleRate: Int, // Частота дискретизации
    
    @JsonProperty("issues")
    val issues: List<String>, // Общие проблемы
    
    @JsonProperty("recommendations")
    val recommendations: List<String> // Рекомендации для улучшения
)

