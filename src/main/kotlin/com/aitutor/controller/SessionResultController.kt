package com.aitutor.controller

import com.aitutor.model.dto.*
import com.aitutor.service.SessionResultService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/session-results")
class SessionResultController(
    private val sessionResultService: SessionResultService
) {
    
    @PostMapping("/start/{sessionId}")
    fun startSession(
        @PathVariable sessionId: String,
        @RequestBody request: StartSessionRequest
    ): ResponseEntity<SessionResultDTO> {
        return ResponseEntity.ok(sessionResultService.startSession(sessionId, request))
    }
    
    @GetMapping("/{id}")
    fun getResult(@PathVariable id: String): ResponseEntity<SessionResultDTO> {
        return try {
            ResponseEntity.ok(sessionResultService.getResultById(id))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.notFound().build()
        }
    }
    
    @GetMapping("/session/{sessionId}")
    fun getResultsBySession(@PathVariable sessionId: String): ResponseEntity<List<SessionResultDTO>> {
        return ResponseEntity.ok(sessionResultService.getResultsBySession(sessionId))
    }
    
    @GetMapping("/student/{studentId}")
    fun getResultsByStudent(@PathVariable studentId: String): ResponseEntity<List<SessionResultDTO>> {
        return ResponseEntity.ok(sessionResultService.getResultsByStudent(studentId))
    }
    
    @GetMapping("/organizer/{organizerId}")
    fun getResultsByOrganizer(@PathVariable organizerId: String): ResponseEntity<List<SessionResultDTO>> {
        return ResponseEntity.ok(sessionResultService.getResultsByOrganizer(organizerId))
    }
    
    @GetMapping("/stats/{organizerId}")
    fun getStats(@PathVariable organizerId: String): ResponseEntity<SessionStatsDTO> {
        return ResponseEntity.ok(sessionResultService.getStats(organizerId))
    }
    
    @PostMapping("/complete/{resultId}")
    fun completeSession(
        @PathVariable resultId: String,
        @RequestBody request: CompleteSessionRequest
    ): ResponseEntity<SessionResultDTO> {
        // This would be called after generating feedback from OpenAI
        return ResponseEntity.ok(sessionResultService.getResultById(resultId))
    }
}

