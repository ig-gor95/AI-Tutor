package com.aitutor.controller

import com.aitutor.model.dto.TranscriptMessageDTO
import com.aitutor.model.entity.MessageRole
import com.aitutor.service.OpenAIService
import com.aitutor.service.SessionResultService
import com.aitutor.service.SessionService
import com.theokanning.openai.completion.chat.ChatMessage
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller
import java.time.LocalDateTime

data class ChatWebSocketMessage(
    val sessionResultId: String,
    val message: String
)

data class StreamingResponse(
    val content: String,
    val isComplete: Boolean,
    val timestamp: LocalDateTime = LocalDateTime.now()
)

@Controller
class ChatWebSocketController(
    private val sessionService: SessionService,
    private val sessionResultService: SessionResultService,
    private val openAIService: OpenAIService,
    private val messagingTemplate: SimpMessagingTemplate
) {
    
    @MessageMapping("/chat/{sessionResultId}")
    fun handleChatMessage(
        @DestinationVariable sessionResultId: String,
        message: ChatWebSocketMessage
    ) {
        try {
            // Get session result
            val result = sessionResultService.getResultById(sessionResultId)
            
            // Get session
            val session = sessionService.getSessionById(result.sessionId)
            
            // Save user message first
            sessionResultService.addMessage(
                sessionResultId,
                TranscriptMessageDTO(
                    role = MessageRole.USER,
                    message = message.message,
                    timestamp = LocalDateTime.now()
                )
            )
            
            // Build conversation history
            val conversationHistory = result.transcript.map { msg ->
                ChatMessage(
                    if (msg.role == MessageRole.AI) "assistant" else "user",
                    msg.message
                )
            }
            
            // Generate system prompt
            val systemPrompt = openAIService.generateSystemPrompt(session)
            
            // Get AI response (for now, non-streaming)
            // In a real implementation, you'd use OpenAI streaming API
            val aiResponse = openAIService.chat(systemPrompt, conversationHistory, message.message)
            
            // Simulate streaming by sending the response
            messagingTemplate.convertAndSend(
                "/topic/chat/$sessionResultId",
                StreamingResponse(
                    content = aiResponse,
                    isComplete = true
                )
            )
            
            // Save AI response
            sessionResultService.addMessage(
                sessionResultId,
                TranscriptMessageDTO(
                    role = MessageRole.AI,
                    message = aiResponse,
                    timestamp = LocalDateTime.now()
                )
            )
            
        } catch (e: Exception) {
            messagingTemplate.convertAndSend(
                "/topic/chat/$sessionResultId",
                StreamingResponse(
                    content = "Error: ${e.message}",
                    isComplete = true
                )
            )
        }
    }
}

