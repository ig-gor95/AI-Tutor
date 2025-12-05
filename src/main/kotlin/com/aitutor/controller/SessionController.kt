package com.aitutor.controller

import com.aitutor.model.dto.CreateSessionRequest
import com.aitutor.model.dto.SessionDTO
import com.aitutor.repository.UserRepository
import com.aitutor.service.SessionService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/sessions")
class SessionController(
    private val sessionService: SessionService,
    private val userRepository: UserRepository
) {
    
    @PostMapping
    fun createSession(
        authentication: Authentication,
        @RequestBody request: CreateSessionRequest
    ): ResponseEntity<SessionDTO> {
        val username = (authentication.principal as org.springframework.security.core.userdetails.User).username
        val user = userRepository.findByEmail(username)
            .orElseThrow { IllegalArgumentException("User not found") }
        
        val session = sessionService.createSession(user.id!!, request)
        return ResponseEntity.ok(session)
    }
    
    @GetMapping("/{id}")
    fun getSession(@PathVariable id: String): ResponseEntity<SessionDTO> {
        return try {
            ResponseEntity.ok(sessionService.getSessionById(id))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.notFound().build()
        }
    }
    
    @GetMapping("/public/{id}")
    fun getPublicSession(@PathVariable id: String): ResponseEntity<SessionDTO> {
        return try {
            ResponseEntity.ok(sessionService.getSessionById(id))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.notFound().build()
        }
    }
    
    @GetMapping("/organizer/{organizerId}")
    fun getSessionsByOrganizer(@PathVariable organizerId: String): ResponseEntity<List<SessionDTO>> {
        return ResponseEntity.ok(sessionService.getSessionsByOrganizer(organizerId))
    }
    
    @GetMapping
    fun getAllSessions(authentication: Authentication): ResponseEntity<List<SessionDTO>> {
        return ResponseEntity.ok(sessionService.getAllSessions())
    }
}

