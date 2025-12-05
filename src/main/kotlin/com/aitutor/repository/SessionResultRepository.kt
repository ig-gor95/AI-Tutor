package com.aitutor.repository

import com.aitutor.model.entity.SessionResult
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface SessionResultRepository : JpaRepository<SessionResult, String> {
    fun findBySessionId(sessionId: String): List<SessionResult>
    fun findByStudentId(studentId: String): List<SessionResult>
    
    @Query("""
        SELECT sr FROM SessionResult sr 
        WHERE sr.sessionId IN 
            (SELECT s.id FROM Session s WHERE s.organizerId = :organizerId)
    """)
    fun findByOrganizerId(organizerId: String): List<SessionResult>
}

