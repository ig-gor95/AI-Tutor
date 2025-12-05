package com.aitutor.service

import com.aitutor.model.dto.*
import com.aitutor.model.entity.Session
import com.aitutor.model.entity.SessionParams
import com.aitutor.repository.SessionRepository
import com.aitutor.repository.UserRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SessionService(
    private val sessionRepository: SessionRepository,
    private val userRepository: UserRepository
) {
    
    fun createSession(organizerId: String, request: CreateSessionRequest): SessionDTO {
        val organizer = userRepository.findById(organizerId)
            .orElseThrow { IllegalArgumentException("Organizer not found") }
        
        val session = Session(
            organizerId = organizerId,
            organizerName = organizer.name,
            params = request.params.toEntity(),
            createdAt = LocalDateTime.now()
        )
        
        val savedSession = sessionRepository.save(session)
        val shareUrl = "/session/${savedSession.id}"
        
        val updatedSession = savedSession.copy(shareUrl = shareUrl)
        sessionRepository.save(updatedSession)
        
        return updatedSession.toDTO()
    }
    
    fun getSessionById(sessionId: String): SessionDTO {
        val session = sessionRepository.findById(sessionId)
            .orElseThrow { IllegalArgumentException("Session not found") }
        return session.toDTO()
    }
    
    fun getSessionsByOrganizer(organizerId: String): List<SessionDTO> {
        return sessionRepository.findByOrganizerId(organizerId)
            .map { it.toDTO() }
    }
    
    fun getAllSessions(): List<SessionDTO> {
        return sessionRepository.findAll()
            .map { it.toDTO() }
    }
    
    private fun SessionParamsDTO.toEntity() = SessionParams(
        topic = this.topic,
        difficulty = this.difficulty,
        duration = this.duration,
        language = this.language,
        goals = this.goals,
        personality = this.personality,
        roleContext = this.roleContext,
        contextDescription = this.contextDescription,
        evaluationCriteria = this.evaluationCriteria,
        expectedKnowledge = this.expectedKnowledge,
        interactionStyle = this.interactionStyle,
        focusAreas = this.focusAreas,
        additionalInstructions = this.additionalInstructions
    )
    
    private fun Session.toDTO() = SessionDTO(
        id = this.id!!,
        organizerId = this.organizerId,
        organizerName = this.organizerName,
        params = this.params.toDTO(),
        createdAt = this.createdAt,
        shareUrl = this.shareUrl
    )
    
    private fun SessionParams.toDTO() = SessionParamsDTO(
        topic = this.topic,
        difficulty = this.difficulty,
        duration = this.duration,
        language = this.language,
        goals = this.goals,
        personality = this.personality,
        roleContext = this.roleContext,
        contextDescription = this.contextDescription,
        evaluationCriteria = this.evaluationCriteria,
        expectedKnowledge = this.expectedKnowledge,
        interactionStyle = this.interactionStyle,
        focusAreas = this.focusAreas,
        additionalInstructions = this.additionalInstructions
    )
}

