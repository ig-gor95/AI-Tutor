package com.aitutor.repository

import com.aitutor.model.entity.Session
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SessionRepository : JpaRepository<Session, String> {
    fun findByOrganizerId(organizerId: String): List<Session>
}

