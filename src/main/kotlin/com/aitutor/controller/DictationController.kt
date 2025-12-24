package com.aitutor.controller

import com.aitutor.model.dto.ArticulationAnalysis
import com.aitutor.model.dto.DictationAnalysisRequest
import com.aitutor.model.dto.DictationAnalysisResponse
import com.aitutor.model.dto.IntonationAnalysis
import com.aitutor.model.dto.TimbreAnalysis
import com.aitutor.service.DictationAnalysisService
import kotlinx.coroutines.runBlocking
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

@RestController
@RequestMapping("/api/dictation")
class DictationController(
    private val dictationAnalysisService: DictationAnalysisService
) {

    /**
     * Анализ дикции через multipart/form-data
     */
    @PostMapping(
        value = ["/analyze"],
        consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    fun analyzeDictationMultipart(
        @RequestParam("audio") audioFile: MultipartFile,
        @RequestParam("expectedText") expectedText: String,
        @RequestParam(value = "language", defaultValue = "ru") language: String
    ): ResponseEntity<DictationAnalysisResponse> {
        return try {
            // Определяем формат аудио
            val contentType = audioFile.contentType ?: ""
            val audioFormat = when {
                contentType.contains("wav") || audioFile.originalFilename?.endsWith(".wav", ignoreCase = true) == true -> "wav"
                contentType.contains("mp3") || audioFile.originalFilename?.endsWith(".mp3", ignoreCase = true) == true -> "mp3"
                contentType.contains("webm") || audioFile.originalFilename?.endsWith(".webm", ignoreCase = true) == true -> "webm"
                else -> "wav" // По умолчанию
            }
            
            // Конвертируем в base64
            val audioData = Base64.getEncoder().encodeToString(audioFile.bytes)
            
            val request = DictationAnalysisRequest(
                audioData = audioData,
                audioFormat = audioFormat,
                expectedText = expectedText,
                language = language
            )
            
            val response = runBlocking {
                dictationAnalysisService.analyzeDictation(request)
            }
            
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(DictationAnalysisResponse(
                    success = false,
                    overallAccuracy = 0.0,
                    words = emptyList(),
                    phonemes = emptyList(),
                    intonation = IntonationAnalysis(
                        pitchContour = emptyList(),
                        pitchVariation = 0.0,
                        averagePitch = 0.0,
                        pitchRange = 0.0,
                        monotonyScore = 0.0,
                        intonationPattern = null
                    ),
                    timbre = TimbreAnalysis(
                        spectralCentroid = 0.0,
                        spectralRolloff = 0.0,
                        zeroCrossingRate = 0.0,
                        mfcc = emptyList(),
                        harmonicity = null
                    ),
                    articulation = ArticulationAnalysis(
                        clarity = 0.0,
                        consonantAccuracy = 0.0,
                        vowelAccuracy = 0.0,
                        transitionSmoothness = 0.0,
                        issues = listOf("Error: ${e.message}")
                    ),
                    audioDuration = 0.0,
                    sampleRate = 0,
                    issues = listOf("Error: ${e.message}"),
                    recommendations = emptyList(),
                    transcribedText = ""
                ))
        }
    }

    /**
     * Анализ дикции через JSON (с base64 аудио)
     */
    @PostMapping(
        value = ["/analyze-json"],
        consumes = [MediaType.APPLICATION_JSON_VALUE],
        produces = [MediaType.APPLICATION_JSON_VALUE]
    )
    fun analyzeDictationJson(
        @RequestBody request: DictationAnalysisRequest
    ): ResponseEntity<DictationAnalysisResponse> {
        return try {
            val response = runBlocking {
                dictationAnalysisService.analyzeDictation(request)
            }
            ResponseEntity.ok(response)
        } catch (e: IllegalStateException) {
            // Ошибка недоступности Praat-сервиса
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(DictationAnalysisResponse(
                    success = false,
                    overallAccuracy = 0.0,
                    words = emptyList(),
                    phonemes = emptyList(),
                    intonation = IntonationAnalysis(
                        pitchContour = emptyList(),
                        pitchVariation = 0.0,
                        averagePitch = 0.0,
                        pitchRange = 0.0,
                        monotonyScore = 0.0,
                        intonationPattern = null
                    ),
                    timbre = TimbreAnalysis(
                        spectralCentroid = 0.0,
                        spectralRolloff = 0.0,
                        zeroCrossingRate = 0.0,
                        mfcc = emptyList(),
                        harmonicity = null
                    ),
                    articulation = ArticulationAnalysis(
                        clarity = 0.0,
                        consonantAccuracy = 0.0,
                        vowelAccuracy = 0.0,
                        transitionSmoothness = 0.0,
                        issues = listOf("Praat service error: ${e.message}")
                    ),
                    audioDuration = 0.0,
                    sampleRate = 0,
                    issues = listOf("Praat service error: ${e.message}"),
                    recommendations = listOf(
                        "Please ensure the Python phonetics service is running.",
                        "Start it with: cd phonetics-service && ./start.sh",
                        "Check service health at: http://localhost:8041/health"
                    ),
                    transcribedText = ""
                ))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(DictationAnalysisResponse(
                    success = false,
                    overallAccuracy = 0.0,
                    words = emptyList(),
                    phonemes = emptyList(),
                    intonation = IntonationAnalysis(
                        pitchContour = emptyList(),
                        pitchVariation = 0.0,
                        averagePitch = 0.0,
                        pitchRange = 0.0,
                        monotonyScore = 0.0,
                        intonationPattern = null
                    ),
                    timbre = TimbreAnalysis(
                        spectralCentroid = 0.0,
                        spectralRolloff = 0.0,
                        zeroCrossingRate = 0.0,
                        mfcc = emptyList(),
                        harmonicity = null
                    ),
                    articulation = ArticulationAnalysis(
                        clarity = 0.0,
                        consonantAccuracy = 0.0,
                        vowelAccuracy = 0.0,
                        transitionSmoothness = 0.0,
                        issues = listOf("Error: ${e.message}")
                    ),
                    audioDuration = 0.0,
                    sampleRate = 0,
                    issues = listOf("Error: ${e.message}"),
                    recommendations = emptyList(),
                    transcribedText = ""
                ))
        }
    }
}

