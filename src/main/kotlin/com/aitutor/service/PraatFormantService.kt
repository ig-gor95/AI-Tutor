package com.aitutor.service

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

private val logger = KotlinLogging.logger {}

/**
 * Сервис для интеграции с Python-сервисом анализа формант (Praat)
 */
@Service
class PraatFormantService(
    @Value("\${phonetics.service.url:http://localhost:8041}") val serviceUrl: String,
    private val objectMapper: ObjectMapper
) {
    private val client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build()

    /**
     * Запрос на анализ фонемы
     */
    data class PhonemeAnalysisRequest(
        @JsonProperty("audio_data") val audioData: String,
        @JsonProperty("audio_format") val audioFormat: String = "wav",
        @JsonProperty("phoneme") val phoneme: String? = null,
        @JsonProperty("start_time") val startTime: Double? = null,
        @JsonProperty("end_time") val endTime: Double? = null
    )

    /**
     * Результат анализа формант от Praat
     */
    data class FormantAnalysis(
        @JsonProperty("f1") val f1: Double? = null,
        @JsonProperty("f2") val f2: Double? = null,
        @JsonProperty("f3") val f3: Double? = null,
        @JsonProperty("f4") val f4: Double? = null,
        @JsonProperty("f0") val f0: Double? = null,
        @JsonProperty("bandwidth_f1") val bandwidthF1: Double? = null,
        @JsonProperty("bandwidth_f2") val bandwidthF2: Double? = null
    )

    /**
     * Ответ от Python-сервиса
     */
    data class PhonemeAnalysisResponse(
        @JsonProperty("success") val success: Boolean,
        @JsonProperty("formants") val formants: FormantAnalysis,
        @JsonProperty("sample_rate") val sampleRate: Int,
        @JsonProperty("duration") val duration: Double,
        @JsonProperty("message") val message: String? = null
    )

    /**
     * Анализирует фонему используя Praat через Python-сервис
     *
     * @param audioBytes Аудио данные
     * @param phoneme Название фонемы
     * @param startTime Начало сегмента (опционально)
     * @param endTime Конец сегмента (опционально)
     * @return Результат анализа формант или null в случае ошибки
     */
    suspend fun analyzePhonemeWithPraat(
        audioBytes: ByteArray,
        phoneme: String,
        startTime: Double? = null,
        endTime: Double? = null
    ): FormantAnalysis? = withContext(Dispatchers.IO) {
        try {
            val base64Audio = java.util.Base64.getEncoder().encodeToString(audioBytes)
            
            val request = PhonemeAnalysisRequest(
                audioData = base64Audio,
                audioFormat = "wav",
                phoneme = phoneme,
                startTime = startTime,
                endTime = endTime
            )

            val jsonRequest = objectMapper.writeValueAsString(request)
            
            logger.debug { 
                "Sending request to Praat service for phoneme '$phoneme': " +
                "audioData length=${request.audioData.length}, " +
                "audioFormat=${request.audioFormat}, " +
                "startTime=${request.startTime}, endTime=${request.endTime}, " +
                "JSON length=${jsonRequest.length}, " +
                "JSON preview=${jsonRequest.take(200)}"
            }

            // Создаем тело запроса как ByteArray для надежности
            val requestBody = jsonRequest.toByteArray(Charsets.UTF_8)
            
            val httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("$serviceUrl/analyze-phoneme"))
                .header("Content-Type", "application/json; charset=utf-8")
                .header("Content-Length", requestBody.size.toString())
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody))
                .build()

            val response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString())
            
            if (response.statusCode() != 200) {
                val errorBody = response.body()
                logger.error { 
                    "Praat service returned status ${response.statusCode()}: $errorBody\n" +
                    "Request JSON: $jsonRequest"
                }
                return@withContext null
            }

            // Парсим JSON ответ используя Jackson
            val responseBody = response.body()
            logger.debug { "Received response from Praat service: $responseBody" }

            val analysisResponse = objectMapper.readValue(responseBody, PhonemeAnalysisResponse::class.java)
            
            if (!analysisResponse.success) {
                logger.warn { "Praat service returned unsuccessful response: ${analysisResponse.message}" }
                return@withContext null
            }
            
            val formants = analysisResponse.formants
            
            logger.info { 
                "Praat analysis for '$phoneme': F1=${formants.f1}, F2=${formants.f2}, " +
                "F0=${formants.f0}, bandwidthF1=${formants.bandwidthF1}, bandwidthF2=${formants.bandwidthF2}"
            }

            formants

        } catch (e: Exception) {
            logger.error(e) { "Error calling Praat service: ${e.message}" }
            null
        }
    }


    /**
     * Проверяет доступность Python-сервиса
     */
    suspend fun isServiceAvailable(): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = HttpRequest.newBuilder()
                .uri(URI.create("$serviceUrl/health"))
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build()

            val response = client.send(request, HttpResponse.BodyHandlers.ofString())
            response.statusCode() == 200
        } catch (e: Exception) {
            logger.debug { "Praat service is not available: ${e.message}" }
            false
        }
    }
}

