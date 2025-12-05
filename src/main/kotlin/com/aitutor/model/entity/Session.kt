package com.aitutor.model.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "sessions")
data class Session(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: String? = null,
    
    @Column(name = "organizer_id", nullable = false)
    val organizerId: String,
    
    @Column(name = "organizer_name", nullable = false)
    val organizerName: String,
    
    @Embedded
    val params: SessionParams,
    
    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @Column(name = "share_url")
    val shareUrl: String? = null
)

@Embeddable
data class SessionParams(
    @Column(nullable = false)
    val topic: String,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val difficulty: Difficulty,
    
    @Column(nullable = false)
    val duration: Int, // в минутах
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val language: Language,
    
    @Column(columnDefinition = "TEXT[]")
    val goals: List<String> = emptyList(),
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val personality: Personality,
    
    @Column(name = "role_context")
    val roleContext: String? = null,
    
    @Column(name = "context_description", columnDefinition = "TEXT")
    val contextDescription: String? = null,
    
    @Column(name = "evaluation_criteria", columnDefinition = "TEXT[]")
    val evaluationCriteria: List<String>? = null,
    
    @Column(name = "expected_knowledge", columnDefinition = "TEXT")
    val expectedKnowledge: String? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_style")
    val interactionStyle: InteractionStyle? = InteractionStyle.MIXED,
    
    @Column(name = "focus_areas", columnDefinition = "TEXT[]")
    val focusAreas: List<String>? = null,
    
    @Column(name = "additional_instructions", columnDefinition = "TEXT")
    val additionalInstructions: String? = null
)

enum class Difficulty {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED
}

enum class Language {
    RU,
    EN
}

enum class Personality {
    FRIENDLY,
    PROFESSIONAL,
    MOTIVATING
}

enum class InteractionStyle {
    QUESTIONS,
    PRACTICE,
    THEORY,
    MIXED
}

