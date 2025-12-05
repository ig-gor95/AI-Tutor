package com.aitutor.controller

import com.aitutor.model.dto.ChatMessageRequest
import com.aitutor.model.dto.ChatMessageResponse
import com.aitutor.model.dto.TranscriptMessageDTO
import com.aitutor.model.entity.MessageRole
import com.aitutor.service.OpenAIService
import com.aitutor.service.SessionResultService
import com.aitutor.service.SessionService
import com.theokanning.openai.completion.chat.ChatMessage
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/chat")
class ChatController(
    private val sessionService: SessionService,
    private val sessionResultService: SessionResultService,
    private val openAIService: OpenAIService
) {
    
    @PostMapping("/message")
    fun sendMessage(@RequestBody request: ChatMessageRequest): ResponseEntity<ChatMessageResponse> {
        try {
            if (request.message.isBlank()) {
                return ResponseEntity.badRequest().build()
            }
            
            if (request.sessionResultId.isBlank()) {
                return ResponseEntity.badRequest().build()
            }
            
            // Get session result
            val result = sessionResultService.getResultById(request.sessionResultId)
            
            // Get session
            val session = sessionService.getSessionById(result.sessionId)
            
            // Build conversation history
            val conversationHistory = result.transcript.map { msg ->
                ChatMessage(
                    if (msg.role == MessageRole.AI) "assistant" else "user",
                    msg.message
                )
            }
            
            // Generate system prompt
            val systemPrompt = openAIService.generateSystemPrompt(session)
            
            // Get AI response
            val aiResponse = openAIService.chat(systemPrompt, conversationHistory, request.message)
            
            // Save user message
            sessionResultService.addMessage(
                request.sessionResultId,
                TranscriptMessageDTO(
                    role = MessageRole.USER,
                    message = request.message,
                    timestamp = LocalDateTime.now()
                )
            )
            
            // Save AI response
            sessionResultService.addMessage(
                request.sessionResultId,
                TranscriptMessageDTO(
                    role = MessageRole.AI,
                    message = aiResponse,
                    timestamp = LocalDateTime.now()
                )
            )
            
            return ResponseEntity.ok(
                ChatMessageResponse(
                    message = aiResponse,
                    role = MessageRole.AI,
                    timestamp = LocalDateTime.now()
                )
            )
        } catch (e: IllegalArgumentException) {
            println("ChatController error: ${e.message}")
            e.printStackTrace()
            return ResponseEntity.badRequest().build()
        } catch (e: Exception) {
            println("ChatController unexpected error: ${e.message}")
            e.printStackTrace()
            return ResponseEntity.badRequest().build()
        }
    }
    
    @PostMapping("/greeting/{resultId}")
    fun generateGreeting(@PathVariable resultId: String): ResponseEntity<ChatMessageResponse> {
        try {
            // Get session result
            val result = sessionResultService.getResultById(resultId)
            
            // Get session
            val session = sessionService.getSessionById(result.sessionId)
            
            // Generate system prompt
            val systemPrompt = openAIService.generateSystemPrompt(session)
            
            // Generate greeting through AI (empty conversation history for first message)
            val greeting = openAIService.generateGreetingMessage(systemPrompt)
            
            // Save AI greeting to transcript
            sessionResultService.addMessage(
                resultId,
                TranscriptMessageDTO(
                    role = MessageRole.AI,
                    message = greeting,
                    timestamp = LocalDateTime.now()
                )
            )
            
            return ResponseEntity.ok(
                ChatMessageResponse(
                    message = greeting,
                    role = MessageRole.AI,
                    timestamp = LocalDateTime.now()
                )
            )
        } catch (e: Exception) {
            println("Generate greeting error: ${e.message}")
            e.printStackTrace()
            return ResponseEntity.badRequest().build()
        }
    }
    
    @PostMapping("/complete/{resultId}")
    fun completeSession(@PathVariable resultId: String): ResponseEntity<Map<String, Any>> {
        try {
            // Get session result
            val result = sessionResultService.getResultById(resultId)
            
            // Get session
            val session = sessionService.getSessionById(result.sessionId)
            
            // Build conversation history
            val conversationHistory = result.transcript.map { msg ->
                ChatMessage(
                    if (msg.role == MessageRole.AI) "assistant" else "user",
                    msg.message
                )
            }
            
            // Generate feedback and score
            val (feedback, score) = openAIService.generateFeedback(session, conversationHistory)
            
            // Save completion
            val completed = sessionResultService.completeSession(resultId, feedback, score)
            
            return ResponseEntity.ok(
                mapOf(
                    "summary" to feedback,
                    "score" to score,
                    "result" to completed
                )
            )
        } catch (e: Exception) {
            return ResponseEntity.badRequest().build()
        }
    }
}

