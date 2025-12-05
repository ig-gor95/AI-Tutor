package com.aitutor.model.dto

import com.aitutor.model.entity.UserRole

data class SignupRequest(
    val email: String,
    val password: String,
    val name: String,
    val role: UserRole
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val user: UserDTO
)

data class UserDTO(
    val id: String,
    val email: String,
    val name: String,
    val role: UserRole
)

