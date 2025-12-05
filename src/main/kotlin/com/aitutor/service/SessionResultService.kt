package com.aitutor.service

import com.aitutor.model.dto.*
import com.aitutor.model.entity.SessionResult
import com.aitutor.model.entity.TranscriptMessage
import com.aitutor.repository.SessionResultRepository
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SessionResultService(
    private val sessionResultRepository: SessionResultRepository
) {
    private val objectMapper: ObjectMapper = jacksonObjectMapper().apply {
        registerModule(JavaTimeModule())
        disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    }
    
    fun startSession(sessionId: String, request: StartSessionRequest): SessionResultDTO {
        val result = SessionResult(
            sessionId = sessionId,
            studentId = request.studentId,
            studentName = request.studentName ?: "Гость",
            startedAt = LocalDateTime.now(),
            transcript = objectMapper.writeValueAsString(emptyList<TranscriptMessage>())
        )
        
        val saved = sessionResultRepository.save(result)
        return saved.toDTO()
    }
    
    fun getResultById(resultId: String): SessionResultDTO {
        val result = sessionResultRepository.findById(resultId)
            .orElseThrow { IllegalArgumentException("Session result not found") }
        return result.toDTO()
    }
    
    fun getResultsBySession(sessionId: String): List<SessionResultDTO> {
        return sessionResultRepository.findBySessionId(sessionId)
            .map { it.toDTO() }
    }
    
    fun getResultsByStudent(studentId: String): List<SessionResultDTO> {
        return sessionResultRepository.findByStudentId(studentId)
            .map { it.toDTO() }
    }
    
    fun getResultsByOrganizer(organizerId: String): List<SessionResultDTO> {
        return sessionResultRepository.findByOrganizerId(organizerId)
            .map { it.toDTO() }
    }
    
    fun addMessage(resultId: String, message: TranscriptMessageDTO): SessionResultDTO {
        val result = sessionResultRepository.findById(resultId)
            .orElseThrow { IllegalArgumentException("Session result not found") }
        
        val transcript: MutableList<TranscriptMessage> = try {
            if (result.transcript.isBlank() || result.transcript == "[]") {
                mutableListOf()
            } else {
                objectMapper.readValue<MutableList<TranscriptMessage>>(result.transcript)
            }
        } catch (e: Exception) {
            println("Error parsing transcript in addMessage: ${e.message}")
            println("Transcript content: ${result.transcript}")
            mutableListOf()
        }
        
        transcript.add(TranscriptMessage(
            role = message.role,
            message = message.message,
            timestamp = message.timestamp
        ))
        
        val updated = result.copy(
            transcript = objectMapper.writeValueAsString(transcript)
        )
        
        val saved = sessionResultRepository.save(updated)
        return saved.toDTO()
    }
    
    fun completeSession(resultId: String, summary: String, score: Int): SessionResultDTO {
        val result = sessionResultRepository.findById(resultId)
            .orElseThrow { IllegalArgumentException("Session result not found") }
        
        val updated = result.copy(
            completedAt = LocalDateTime.now(),
            summary = summary,
            score = score
        )
        
        val saved = sessionResultRepository.save(updated)
        return saved.toDTO()
    }
    
    fun getStats(organizerId: String): SessionStatsDTO {
        val results = sessionResultRepository.findByOrganizerId(organizerId)
        
        return SessionStatsDTO(
            totalSessions = results.distinctBy { it.sessionId }.size,
            totalStudents = results.size,
            averageScore = results.mapNotNull { it.score }.average().takeIf { !it.isNaN() } ?: 0.0
        )
    }
    
    private fun SessionResult.toDTO(): SessionResultDTO {
        val transcript: List<TranscriptMessage> = try {
            if (this.transcript.isBlank() || this.transcript == "[]") {
                emptyList()
            } else {
                objectMapper.readValue(this.transcript)
            }
        } catch (e: Exception) {
            println("Error parsing transcript JSON: ${e.message}")
            println("Transcript content: ${this.transcript}")
            emptyList()
        }
        
        return SessionResultDTO(
            id = this.id!!,
            sessionId = this.sessionId,
            studentId = this.studentId,
            studentName = this.studentName,
            startedAt = this.startedAt,
            completedAt = this.completedAt,
            transcript = transcript.map { TranscriptMessageDTO(it.role, it.message, it.timestamp) },
            summary = this.summary,
            score = this.score
        )
    }
}

