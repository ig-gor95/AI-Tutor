package com.aitutor.model.entity

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime

@Entity
@Table(name = "session_results")
data class SessionResult(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: String? = null,
    
    @Column(name = "session_id", nullable = false)
    val sessionId: String,
    
    @Column(name = "student_id")
    val studentId: String? = null,
    
    @Column(name = "student_name")
    val studentName: String? = null,
    
    @Column(name = "started_at", nullable = false)
    val startedAt: LocalDateTime,
    
    @Column(name = "completed_at")
    val completedAt: LocalDateTime? = null,
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "TEXT")
    val transcript: String, // JSON string of transcript messages
    
    @Column(columnDefinition = "TEXT")
    val summary: String? = null,
    
    @Column
    val score: Int? = null
)

data class TranscriptMessage(
    val role: MessageRole,
    val message: String,
    val timestamp: LocalDateTime
)

enum class MessageRole {
    AI,
    USER
}

