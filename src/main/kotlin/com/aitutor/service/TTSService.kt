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
    @Value("\${yandex.speechkit.folder-id:}") private val yandexFolderId: String
) {
    private val objectMapper = ObjectMapper()
    
    /**
     * Исправляет ударения в тексте для Yandex TTS
     * Использует знак + перед ударной гласной
     */
    private fun fixStressMarks(text: String): String {
        var result = text
        
        // Исправляем "котлин" -> "к+Отлин" (ударение на О)
        // Учитываем разные падежи и формы
        result = result.replace(Regex("([Кк])отлин", RegexOption.IGNORE_CASE)) { matchResult ->
            val firstLetter = matchResult.groupValues[1]
            "${firstLetter}+Отлин"
        }
        result = result.replace(Regex("([Кк])отлине", RegexOption.IGNORE_CASE)) { matchResult ->
            val firstLetter = matchResult.groupValues[1]
            "${firstLetter}+Отлине"
        }
        result = result.replace(Regex("([Кк])отлина", RegexOption.IGNORE_CASE)) { matchResult ->
            val firstLetter = matchResult.groupValues[1]
            "${firstLetter}+Отлина"
        }
        result = result.replace(Regex("([Кк])отлином", RegexOption.IGNORE_CASE)) { matchResult ->
            val firstLetter = matchResult.groupValues[1]
            "${firstLetter}+Отлином"
        }
        result = result.replace(Regex("([Кк])отлину", RegexOption.IGNORE_CASE)) { matchResult ->
            val firstLetter = matchResult.groupValues[1]
            "${firstLetter}+Отлину"
        }
        result = result.replace(Regex("([Кк])отлины", RegexOption.IGNORE_CASE)) { matchResult ->
            val firstLetter = matchResult.groupValues[1]
            "${firstLetter}+Отлины"
        }
        
        // Исправляем английское "Kotlin" -> "K+Отlin" (ударение на О)
        result = result.replace(Regex("Kotlin", RegexOption.IGNORE_CASE)) { "K+Отlin" }
        
        return result
    }
    
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
        voice: String = "jane",
        speed: Double = 1.0,
        emotion: String = "good" // neutral, good, evil, mixed
    ): ByteArray {
        if (yandexApiKey.isBlank()) {
            throw IllegalStateException("Yandex SpeechKit API key not configured. Get it at https://cloud.yandex.ru/")
        }
        
        try {
            // Исправляем ударения в тексте перед отправкой
            val textWithStress = fixStressMarks(text)
            
            // Yandex SpeechKit API endpoint
            val url = URL("https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize")
            val connection = url.openConnection() as HttpURLConnection
            
            connection.requestMethod = "POST"
            connection.setRequestProperty("Authorization", "Api-Key $yandexApiKey")
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            connection.doOutput = true
            
            // Формируем POST данные
            val postData = buildString {
                append("text=${URLEncoder.encode(textWithStress, StandardCharsets.UTF_8)}")
                append("&lang=ru-RU")
                append("&voice=$voice")
                append("&speed=${speed.coerceIn(0.1, 3.0)}")
                append("&emotion=$emotion")
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

