package com.aitutor.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtUtil {
    
    @Value("\${jwt.secret}")
    private lateinit var secret: String
    
    @Value("\${jwt.expiration}")
    private var expiration: Long = 86400000 // 24 hours
    
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray())
    }
    
    fun generateToken(username: String, userId: String, role: String): String {
        val now = Date()
        val expiryDate = Date(now.time + expiration)
        
        return Jwts.builder()
            .claims()
            .add("userId", userId)
            .add("role", role)
            .subject(username)
            .issuedAt(now)
            .expiration(expiryDate)
            .and()
            .signWith(key)
            .compact()
    }
    
    fun extractUsername(token: String): String {
        return extractClaim(token, Claims::getSubject)
    }
    
    fun extractUserId(token: String): String {
        return extractClaim(token) { it["userId"] as String }
    }
    
    fun extractRole(token: String): String {
        return extractClaim(token) { it["role"] as String }
    }
    
    fun <T> extractClaim(token: String, claimsResolver: (Claims) -> T): T {
        val claims = extractAllClaims(token)
        return claimsResolver(claims)
    }
    
    private fun extractAllClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
    }
    
    fun isTokenValid(token: String, userDetails: UserDetails): Boolean {
        val username = extractUsername(token)
        return (username == userDetails.username && !isTokenExpired(token))
    }
    
    private fun isTokenExpired(token: String): Boolean {
        return extractExpiration(token).before(Date())
    }
    
    private fun extractExpiration(token: String): Date {
        return extractClaim(token, Claims::getExpiration)
    }
}

