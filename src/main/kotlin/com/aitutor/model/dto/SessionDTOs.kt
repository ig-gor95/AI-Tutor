package com.aitutor.model.dto

import com.aitutor.model.entity.*
import java.time.LocalDateTime

data class CreateSessionRequest(
    val params: SessionParamsDTO
)

data class SessionParamsDTO(
    val topic: String,
    val difficulty: Difficulty,
    val duration: Int,
    val language: Language,
    val goals: List<String> = emptyList(),
    val personality: Personality,
    val roleContext: String? = null,
    val contextDescription: String? = null,
    val evaluationCriteria: List<String>? = null,
    val expectedKnowledge: String? = null,
    val interactionStyle: InteractionStyle? = InteractionStyle.MIXED,
    val focusAreas: List<String>? = null,
    val additionalInstructions: String? = null
)

data class SessionDTO(
    val id: String,
    val organizerId: String,
    val organizerName: String,
    val params: SessionParamsDTO,
    val createdAt: LocalDateTime,
    val shareUrl: String?
)

data class SessionResultDTO(
    val id: String,
    val sessionId: String,
    val studentId: String?,
    val studentName: String?,
    val startedAt: LocalDateTime,
    val completedAt: LocalDateTime?,
    val transcript: List<TranscriptMessageDTO>,
    val summary: String?,
    val score: Int?
)

data class TranscriptMessageDTO(
    val role: MessageRole,
    val message: String,
    val timestamp: LocalDateTime
)

data class StartSessionRequest(
    val studentId: String? = null,
    val studentName: String? = null
)

data class ChatMessageRequest(
    val message: String,
    val sessionResultId: String
)

data class ChatMessageResponse(
    val message: String,
    val role: MessageRole,
    val timestamp: LocalDateTime
)

data class CompleteSessionRequest(
    val sessionResultId: String
)

data class SessionStatsDTO(
    val totalSessions: Int,
    val totalStudents: Int,
    val averageScore: Double
)

