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
        .version(HttpClient.Version.HTTP_1_1) // Явно указываем HTTP/1.1 вместо HTTP/2
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
     * Сегмент фонемы для пакетного анализа
     */
    data class PhonemeSegment(
        @JsonProperty("phoneme") val phoneme: String,
        @JsonProperty("start_time") val startTime: Double,
        @JsonProperty("end_time") val endTime: Double,
        @JsonProperty("position") val position: Int
    )

    /**
     * Результат анализа сегмента
     */
    data class PhonemeSegmentResult(
        @JsonProperty("phoneme") val phoneme: String,
        @JsonProperty("position") val position: Int,
        @JsonProperty("formants") val formants: FormantAnalysis
    )

    /**
     * Запрос на пакетный анализ
     */
    data class BatchPhonemeAnalysisRequest(
        @JsonProperty("audio_data") val audioData: String,
        @JsonProperty("audio_format") val audioFormat: String = "wav",
        @JsonProperty("segments") val segments: List<PhonemeSegment>
    )

    /**
     * Ответ на пакетный анализ
     */
    data class BatchPhonemeAnalysisResponse(
        @JsonProperty("success") val success: Boolean,
        @JsonProperty("results") val results: List<PhonemeSegmentResult>,
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
            logger.debug { "Encoded audio to base64: ${audioBytes.size} bytes -> ${base64Audio.length} chars" }
            
            // Проверяем размер данных
            if (base64Audio.length > 10_000_000) { // ~10MB
                logger.warn { "Base64 audio data is very large: ${base64Audio.length} chars, may cause issues" }
            }
            
            val request = PhonemeAnalysisRequest(
                audioData = base64Audio,
                audioFormat = "wav",
                phoneme = phoneme,
                startTime = startTime,
                endTime = endTime
            )

            val jsonRequest = try {
                objectMapper.writeValueAsString(request)
            } catch (e: Exception) {
                logger.error(e) { "Failed to serialize request to JSON" }
                return@withContext null
            }
            
            logger.debug { "Serialized JSON: ${jsonRequest.length} chars" }
            
            logger.info { 
                "Sending request to Praat service for phoneme '$phoneme': " +
                "audioData length=${request.audioData.length}, " +
                "audioFormat=${request.audioFormat}, " +
                "startTime=${request.startTime}, endTime=${request.endTime}, " +
                "JSON length=${jsonRequest.length}"
            }

            val requestBytes = jsonRequest.toByteArray(Charsets.UTF_8)
            logger.info { "Request bytes: ${requestBytes.size} bytes, first 100 bytes: ${requestBytes.take(100).joinToString(" ") { "%02X".format(it) }}" }
            
            // Проверяем, что данные не пустые
            if (requestBytes.isEmpty()) {
                logger.error { "Request bytes are empty! JSON length was ${jsonRequest.length}" }
                return@withContext null
            }
            
            val httpRequest = try {
                HttpRequest.newBuilder()
                    .uri(URI.create("$serviceUrl/analyze-phoneme"))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(requestBytes))
                    .build()
            } catch (e: Exception) {
                logger.error(e) { "Failed to create HTTP request: ${e.message}" }
                return@withContext null
            }
            
            logger.info { "HTTP request created successfully, sending ${requestBytes.size} bytes to $serviceUrl/analyze-phoneme" }

            val response = try {
                val resp = client.send(httpRequest, HttpResponse.BodyHandlers.ofString())
                logger.debug { "Response received: status=${resp.statusCode()}, body length=${resp.body().length}" }
                resp
            } catch (e: Exception) {
                logger.error(e) { "Failed to send HTTP request: ${e.message}, cause: ${e.cause?.message}" }
                e.printStackTrace()
                return@withContext null
            }
            
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
     * Анализирует несколько фонем за один запрос (эффективнее чем отдельные запросы)
     *
     * @param audioBytes Аудио данные (весь файл)
     * @param segments Список сегментов для анализа
     * @return Результаты анализа для каждого сегмента или null в случае ошибки
     */
    suspend fun analyzePhonemesBatch(
        audioBytes: ByteArray,
        segments: List<PhonemeSegment>
    ): List<PhonemeSegmentResult>? = withContext(Dispatchers.IO) {
        try {
            val base64Audio = java.util.Base64.getEncoder().encodeToString(audioBytes)
            logger.debug { "Batch analysis: ${segments.size} segments, audio size=${audioBytes.size} bytes" }
            
            val request = BatchPhonemeAnalysisRequest(
                audioData = base64Audio,
                audioFormat = "wav",
                segments = segments
            )

            val jsonRequest = try {
                objectMapper.writeValueAsString(request)
            } catch (e: Exception) {
                logger.error(e) { "Failed to serialize batch request to JSON" }
                return@withContext null
            }
            
            val requestBytes = jsonRequest.toByteArray(Charsets.UTF_8)
            logger.info { "Sending batch request: ${segments.size} segments, ${requestBytes.size} bytes" }
            
            val httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("$serviceUrl/analyze-phonemes-batch"))
                .header("Content-Type", "application/json; charset=utf-8")
                .timeout(Duration.ofSeconds(60))
                .POST(HttpRequest.BodyPublishers.ofByteArray(requestBytes))
                .build()

            val response = try {
                client.send(httpRequest, HttpResponse.BodyHandlers.ofString())
            } catch (e: Exception) {
                logger.error(e) { "Failed to send batch HTTP request: ${e.message}" }
                return@withContext null
            }
            
            if (response.statusCode() != 200) {
                logger.warn { "Batch request returned status ${response.statusCode()}: ${response.body()}" }
                return@withContext null
            }

            val batchResponse = try {
                objectMapper.readValue(response.body(), BatchPhonemeAnalysisResponse::class.java)
            } catch (e: Exception) {
                logger.error(e) { "Failed to parse batch response: ${e.message}" }
                return@withContext null
            }
            
            if (!batchResponse.success) {
                logger.warn { "Batch analysis failed: ${batchResponse.message}" }
                return@withContext null
            }

            logger.info { "Batch analysis completed: ${batchResponse.results.size} results" }
            batchResponse.results

        } catch (e: Exception) {
            logger.error(e) { "Error calling batch Praat service: ${e.message}" }
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

