package com.aitutor.service

import com.aitutor.model.dto.*
import com.aitutor.model.entity.User
import com.aitutor.repository.UserRepository
import com.aitutor.security.JwtUtil
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtUtil: JwtUtil,
    private val authenticationManager: AuthenticationManager
) {
    
    fun signup(request: SignupRequest): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw IllegalArgumentException("Email already exists")
        }
        
        val user = User(
            email = request.email,
            password = passwordEncoder.encode(request.password),
            name = request.name,
            role = request.role
        )
        
        val savedUser = userRepository.save(user)
        val token = jwtUtil.generateToken(
            savedUser.email,
            savedUser.id!!,
            savedUser.role.name
        )
        
        return AuthResponse(
            token = token,
            user = savedUser.toDTO()
        )
    }
    
    fun login(request: LoginRequest): AuthResponse {
        authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken(request.email, request.password)
        )
        
        val user = userRepository.findByEmail(request.email)
            .orElseThrow { IllegalArgumentException("User not found") }
        
        val token = jwtUtil.generateToken(
            user.email,
            user.id!!,
            user.role.name
        )
        
        return AuthResponse(
            token = token,
            user = user.toDTO()
        )
    }
    
    private fun User.toDTO() = UserDTO(
        id = this.id!!,
        email = this.email,
        name = this.name,
        role = this.role
    )
}

