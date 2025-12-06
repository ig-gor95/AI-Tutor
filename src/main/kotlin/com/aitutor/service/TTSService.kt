package com.aitutor.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Service
class TTSService(
    @Value("\${openai.api-key:}") private val openaiApiKey: String,
    @Value("\${yandex.speechkit.api-key:}") private val yandexApiKey: String,
    @Value("\${yandex.speechkit.folder-id:}") private val yandexFolderId: String,
    @Value("\${yandex.speechkit.default-voice:jane}") private val defaultYandexVoice: String,
    @Value("\${yandex.speechkit.default-emotion:good}") private val defaultYandexEmotion: String,
    @Value("\${yandex.speechkit.default-speed:1.0}") private val defaultYandexSpeed: Double
) {
    private val objectMapper = ObjectMapper()
    
    /**
     * OpenAI TTS - естественный голос через прямой HTTP запрос
     */
    fun generateOpenAITTS(
        text: String, 
        voice: String = "nova", 
        speed: Double = 1.0,
        model: String = "tts-1"
    ): ByteArray {
        if (openaiApiKey.isBlank() || openaiApiKey == "your-openai-api-key") {
            throw IllegalStateException("OpenAI API key not configured")
        }
        
        try {
            val url = URL("https://api.openai.com/v1/audio/speech")
            val connection = url.openConnection() as HttpURLConnection
            
            connection.requestMethod = "POST"
            connection.setRequestProperty("Authorization", "Bearer $openaiApiKey")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.doOutput = true
            
            val requestBody = mapOf(
                "model" to model,
                "input" to text,
                "voice" to voice,
                "speed" to speed.coerceIn(0.25, 4.0)
            )
            
            objectMapper.writeValue(connection.outputStream, requestBody)
            
            val responseCode = connection.responseCode
            if (responseCode != HttpURLConnection.HTTP_OK) {
                val error = connection.errorStream?.bufferedReader()?.readText() ?: "Unknown error"
                throw RuntimeException("OpenAI TTS API error: $responseCode - $error")
            }
            
            return connection.inputStream.readAllBytes()
        } catch (e: Exception) {
            println("OpenAI TTS generation error: ${e.message}")
            e.printStackTrace()
            throw RuntimeException("Failed to generate TTS: ${e.message}", e)
        }
    }
    
    /**
     * Yandex SpeechKit TTS - ЛУЧШЕЕ качество для русского языка! 🎯
     * 
     * Голоса для русского:
     * - jane ⭐ - Женский, дружелюбный, выразительный (РЕКОМЕНДУЕТСЯ)
     * - oksana - Женский, профессиональный
     * - omazh - Женский, спокойный
     * - zahar - Мужской, уверенный
     * - ermil - Мужской, нейтральный
     * 
     * Бесплатно: 1 миллион символов в месяц!
     */
    fun generateYandexTTS(
        text: String,
        voice: String? = null,
        speed: Double? = null,
        emotion: String? = null // neutral, good, evil, mixed
    ): ByteArray {
        // Используем значения по умолчанию из конфига, если параметры не указаны
        val finalVoice = voice?.takeIf { it.isNotBlank() } ?: defaultYandexVoice
        val finalSpeed = speed?.takeIf { it > 0 } ?: defaultYandexSpeed
        val finalEmotion = emotion?.takeIf { it.isNotBlank() } ?: defaultYandexEmotion
        if (yandexApiKey.isBlank()) {
            throw IllegalStateException("Yandex SpeechKit API key not configured. Get it at https://cloud.yandex.ru/")
        }
        
        try {
            // Yandex SpeechKit API endpoint
            val url = URL("https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize")
            val connection = url.openConnection() as HttpURLConnection
            
            connection.requestMethod = "POST"
            connection.setRequestProperty("Authorization", "Api-Key $yandexApiKey")
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            connection.doOutput = true
            
            // Формируем POST данные
            val postData = buildString {
                append("text=${URLEncoder.encode(text, StandardCharsets.UTF_8)}")
                append("&lang=ru-RU")
                append("&voice=$finalVoice")
                append("&speed=${finalSpeed.coerceIn(0.1, 3.0)}")
                append("&emotion=$finalEmotion")
                append("&format=mp3")
                if (yandexFolderId.isNotBlank()) {
                    append("&folderId=$yandexFolderId")
                }
            }
            
            connection.outputStream.use { os ->
                os.write(postData.toByteArray(StandardCharsets.UTF_8))
            }
            
            val responseCode = connection.responseCode
            if (responseCode != HttpURLConnection.HTTP_OK) {
                val error = connection.errorStream?.bufferedReader()?.readText() ?: "Unknown error"
                println("Yandex TTS API error: $responseCode - $error")
                throw RuntimeException("Yandex TTS API error: $responseCode - $error")
            }
            
            return connection.inputStream.readAllBytes()
        } catch (e: Exception) {
            println("Yandex TTS generation error: ${e.message}")
            e.printStackTrace()
            throw RuntimeException("Failed to generate Yandex TTS: ${e.message}", e)
        }
    }
}

