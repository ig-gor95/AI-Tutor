package com.aitutor.controller

import com.aitutor.model.dto.AuthResponse
import com.aitutor.model.dto.LoginRequest
import com.aitutor.model.dto.SignupRequest
import com.aitutor.service.AuthService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {
    
    @PostMapping("/signup")
    fun signup(@RequestBody request: SignupRequest): ResponseEntity<AuthResponse> {
        return try {
            ResponseEntity.ok(authService.signup(request))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }
    
    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        return try {
            ResponseEntity.ok(authService.login(request))
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }
}

