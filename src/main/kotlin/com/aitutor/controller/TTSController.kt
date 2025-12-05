package com.aitutor.controller

import com.aitutor.service.TTSService
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/tts")
class TTSController(
    private val ttsService: TTSService
) {
    
    @PostMapping("/openai")
    fun openaiTTS(
        @RequestBody request: Map<String, Any>
    ): ResponseEntity<ByteArray> {
        try {
            val text = request["text"] as? String ?: throw IllegalArgumentException("text is required")
            val voice = request["voice"] as? String ?: "nova"
            val speed = (request["speed"] as? Number)?.toDouble() ?: 1.0
            
            val audio = ttsService.generateOpenAITTS(text, voice, speed)
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=speech.mp3")
                .body(audio)
        } catch (e: Exception) {
            println("OpenAI TTS error: ${e.message}")
            e.printStackTrace()
            return ResponseEntity.badRequest().build()
        }
    }
    
    @PostMapping("/yandex")
    fun yandexTTS(
        @RequestBody request: Map<String, Any>
    ): ResponseEntity<ByteArray> {
        try {
            val text = request["text"] as? String ?: throw IllegalArgumentException("text is required")
            val voice = request["voice"] as? String ?: "jane"
            val speed = (request["speed"] as? Number)?.toDouble() ?: 1.0
            val emotion = request["emotion"] as? String ?: "good"
            
            val audio = ttsService.generateYandexTTS(text, voice, speed, emotion)
            
            return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, org.springframework.http.MediaType.APPLICATION_OCTET_STREAM_VALUE)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=speech.mp3")
                .body(audio)
        } catch (e: Exception) {
            println("Yandex TTS error: ${e.message}")
            e.printStackTrace()
            return ResponseEntity.badRequest().build()
        }
    }
}

