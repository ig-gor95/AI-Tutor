package com.aitutor.service

import com.aitutor.model.dto.SessionDTO
import com.aitutor.model.entity.Difficulty
import com.aitutor.model.entity.Language
import com.aitutor.model.entity.Personality
import com.theokanning.openai.completion.chat.ChatCompletionRequest
import com.theokanning.openai.completion.chat.ChatMessage
import com.theokanning.openai.service.OpenAiService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class OpenAIService(
    @Value("\${openai.api-key:}") private val apiKey: String,
    @Value("\${openai.model:gpt-3.5-turbo}") private val model: String,
    @Value("\${openai.max-tokens:2000}") private val maxTokens: Int,
    @Value("\${openai.temperature:0.7}") private val temperature: Double,
    @Value("\${openai.top-p:1.0}") private val topP: Double,
    @Value("\${openai.frequency-penalty:0.0}") private val frequencyPenalty: Double,
    @Value("\${openai.presence-penalty:0.0}") private val presencePenalty: Double,
    @Value("\${openai.streaming:true}") private val streaming: Boolean,
    @Value("\${openai.timeout:60}") private val timeoutSeconds: Int
) {
    init {
        println("=== OpenAI Service Initialization ===")
        println("API Key length: ${apiKey.length}")
        println("API Key starts with: ${apiKey.take(10)}...")
        println("API Key is blank: ${apiKey.isBlank()}")
        println("API Key equals default: ${apiKey == "your-openai-api-key"}")
    }
    
    private val openAiService: OpenAiService? by lazy {
        if (apiKey.isBlank() || apiKey == "your-openai-api-key") {
            println("WARNING: OpenAI API key is not configured. Set OPENAI_API_KEY environment variable.")
            println("Current apiKey value: '${apiKey}'")
            null
        } else {
            println("OpenAI API key configured successfully (length: ${apiKey.length})")
            println("OpenAI Settings: model=$model, maxTokens=$maxTokens, temperature=$temperature, streaming=$streaming")
            OpenAiService(apiKey, Duration.ofSeconds(timeoutSeconds.toLong()))
        }
    }
    
    private fun requireOpenAIService(): OpenAiService {
        return openAiService ?: throw IllegalStateException(
            "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable."
        )
    }
    
    fun generateSystemPrompt(session: SessionDTO): String {
        val params = session.params
        
        val difficultyText = when (params.difficulty) {
            Difficulty.BEGINNER -> "начальный (новичок, базовые понятия)"
            Difficulty.INTERMEDIATE -> "средний (есть базовые знания, нужно углубление)"
            Difficulty.ADVANCED -> "продвинутый (опытный специалист, продвинутые темы)"
        }
        
        val languageInstruction = when (params.language) {
            Language.RU -> "Веди диалог ТОЛЬКО на русском языке. Все объяснения, примеры и вопросы должны быть на русском."
            Language.EN -> "Conduct the dialogue ONLY in English. All explanations, examples and questions must be in English."
        }
        
        val personalityText = when (params.personality) {
            Personality.FRIENDLY -> """
                Стиль общения: ДРУЖЕЛЮБНЫЙ и НЕФОРМАЛЬНЫЙ
                - Обращайся на "ты"
                - Используй эмодзи и живой язык
                - Поддерживай и подбадривай
                - Радуйся успехам ученика
                - Создавай комфортную атмосферу
            """.trimIndent()
            Personality.PROFESSIONAL -> """
                Стиль общения: ПРОФЕССИОНАЛЬНЫЙ и ФОРМАЛЬНЫЙ
                - Обращайся на "вы"
                - Используй точные термины
                - Структурируй информацию
                - Фокусируйся на деталях
                - Будь объективным и беспристрастным
            """.trimIndent()
            Personality.MOTIVATING -> """
                Стиль общения: МОТИВИРУЮЩИЙ и ВДОХНОВЛЯЮЩИЙ
                - Заряжай энергией и энтузиазмом
                - Подчеркивай прогресс и достижения
                - Превращай ошибки в возможности для роста
                - Используй позитивное подкрепление
                - Помогай поверить в свои силы
            """.trimIndent()
        }
        
        val interactionText = when (params.interactionStyle?.name) {
            "QUESTIONS" -> """
                Формат диалога: ВОПРОСЫ И ОТВЕТЫ
                - Задавай проверочные вопросы после каждого объяснения
                - Используй метод Сократа
                - Помогай ученику самому прийти к ответу
                - Проверяй понимание через практические кейсы
            """.trimIndent()
            "PRACTICE" -> """
                Формат диалога: ПРАКТИЧЕСКИЕ ЗАДАНИЯ
                - Давай конкретные задачи для решения
                - Предлагай упражнения и примеры
                - Разбирай решения пошагово
                - Используй реальные кейсы
            """.trimIndent()
            "THEORY" -> """
                Формат диалога: ТЕОРЕТИЧЕСКОЕ ОБУЧЕНИЕ
                - Последовательно объясняй концепции
                - Используй аналогии и метафоры
                - Строй логическую цепочку
                - Углубляйся в детали при необходимости
            """.trimIndent()
            else -> """
                Формат диалога: СМЕШАННЫЙ (гибкий подход)
                - Чередуй теорию с практикой
                - Задавай вопросы для проверки
                - Давай примеры и упражнения
                - Адаптируйся к темпу ученика
            """.trimIndent()
        }
        
        val goalsText = if (params.goals.isNotEmpty()) {
            "\n\n🎯 ЦЕЛИ СЕССИИ (обязательно достичь):\n${params.goals.joinToString("\n") { "✓ $it" }}"
        } else ""
        
        val criteriaText = if (!params.evaluationCriteria.isNullOrEmpty()) {
            "\n\n📊 КРИТЕРИИ ОЦЕНКИ (отслеживай в процессе):\n${params.evaluationCriteria.joinToString("\n") { "• $it" }}"
        } else ""
        
        val focusText = if (!params.focusAreas.isNullOrEmpty()) {
            "\n\n🔍 КЛЮЧЕВЫЕ ОБЛАСТИ ФОКУСА:\n${params.focusAreas.joinToString("\n") { "→ $it" }}"
        } else ""
        
        val roleText = params.roleContext?.let { 
            "\n\n👤 ТВОЯ РОЛЬ: $it\nВеди себя соответственно этой роли во всем диалоге." 
        } ?: ""
        
        val contextText = params.contextDescription?.let { 
            "\n\n📝 КОНТЕКСТ ОБУЧЕНИЯ:\n$it" 
        } ?: ""
        
        val knowledgeText = params.expectedKnowledge?.let { 
            "\n\n📚 ПРЕДПОЛАГАЕМЫЙ УРОВЕНЬ ЗНАНИЙ:\n$it\nУчитывай это при выборе сложности объяснений." 
        } ?: ""
        
        val additionalText = params.additionalInstructions?.let { 
            "\n\n⚡ ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n$it" 
        } ?: ""
        
        return """
            🤖 ТЫ - AI-ТЬЮТОР для персонализированного обучения и тестирования
            
            ═══════════════════════════════════════════════════════
            👤 ВАЖНО: ТЫ ОТВЕЧАЕШЬ ОТ ЖЕНСКОГО ЛИЦА
            ═══════════════════════════════════════════════════════
            Твой голос - женский (jane), поэтому:
            - Используй женские формы глаголов: "я объясню", "я помогу", "я расскажу"
            - Используй женские окончания: "готова помочь", "рада помочь", "я могу объяснить"
            - Обращайся к ученику естественно, как женщина-преподаватель
            - Будь дружелюбной, но профессиональной
            
            ═══════════════════════════════════════════════════════
            📚 ТЕМА ДИАЛОГА: ${params.topic}
            ⭐ УРОВЕНЬ СЛОЖНОСТИ: $difficultyText
            ⏱️ ДЛИТЕЛЬНОСТЬ: ${params.duration} минут
            ═══════════════════════════════════════════════════════
            
            🌍 ЯЗЫК ДИАЛОГА:
            $languageInstruction
            
            ⚠️ ВАЖНО: ПРАВИЛЬНОЕ ПРОИЗНОШЕНИЕ:
            - Язык программирования называется "кОтлин" (ударение на первый слог: кОт-лин)
            - Всегда произноси и пиши с правильным ударением: "кОтлин", "в кОтлине", "для кОтлина"
            
            🎭 $personalityText
            
            💬 $interactionText$roleText$contextText$knowledgeText$goalsText$criteriaText$focusText$additionalText
            
            ═══════════════════════════════════════════════════════
            📋 ПРАВИЛА ВЕДЕНИЯ ДИАЛОГА:
            ═══════════════════════════════════════════════════════
            
            ⚡ ВАЖНО: ОТВЕЧАЙ КОРОТКО И ПО ДЕЛУ!
               - Максимум 2-3 предложения на ответ
               - Будь лаконичным, но информативным
               - Избегай длинных объяснений
               - Если нужно больше - разбивай на несколько коротких ответов
            
            1. АДАПТИВНОСТЬ:
               - Подстраивайся под уровень ученика
               - Если видишь непонимание - упрощай объяснение
               - Если ученик схватывает быстро - усложняй материал
            
            2. ИНТЕРАКТИВНОСТЬ:
               - Задавай наводящие вопросы
               - Проверяй понимание после каждого блока
               - Поощряй вопросы от ученика
            
            3. ПРИМЕРЫ:
               - Используй конкретные, понятные примеры
               - Проводи аналогии с реальной жизнью
               - Показывай на практических кейсах
               - Примеры должны быть КОРОТКИМИ (1-2 предложения)
            
            4. ОБРАТНАЯ СВЯЗЬ:
               - В процессе диалога отмечай успехи
               - Мягко корректируй ошибки
               - Давай конструктивные советы
            
            5. СТРУКТУРА:
               - Следуй логической последовательности
               - От простого к сложному
               - Закрепляй пройденное перед новым материалом
            
            6. ВРЕМЕННЫЕ РАМКИ:
               - Учитывай ограничение в ${params.duration} минут
               - Распределяй материал равномерно
               - Оставь время на закрепление
            
            ═══════════════════════════════════════════════════════
            🎬 НАЧАЛО ДИАЛОГА:
            ═══════════════════════════════════════════════════════
            Начни с приветствия, представься в соответствии со своей ролью,
            кратко опиши что вы будете изучать и спроси у ученика о его
            текущем уровне знаний по теме.
            
            ═══════════════════════════════════════════════════════
            📊 В КОНЦЕ СЕССИИ:
            ═══════════════════════════════════════════════════════
            Будь готова предоставить детальную обратную связь:
            - Что ученик усвоил хорошо
            - Где были трудности
            - Рекомендации для дальнейшего изучения
            - Объективную оценку от 0 до 100 баллов
            
            Удачи в обучении! 🚀
        """.trimIndent()
    }
    
    fun generateGreeting(session: SessionDTO): String {
        val params = session.params
        
        return when (params.personality) {
            Personality.FRIENDLY -> "Привет! Я твой AI-тьютор. Рада помочь тебе изучить \"${params.topic}\". Готова начать?"
            Personality.PROFESSIONAL -> "Здравствуйте. Я готова провести занятие по теме \"${params.topic}\". Приступим к обучению."
            Personality.MOTIVATING -> "Отлично! Сегодня мы освоим \"${params.topic}\". Уверена, у тебя всё получится! Поехали!"
        }
    }
    
    fun chat(systemPrompt: String, conversationHistory: List<ChatMessage>, userMessage: String): String {
        try {
            val service = requireOpenAIService()
            val messages = mutableListOf<ChatMessage>()
            messages.add(ChatMessage("system", systemPrompt))
            messages.addAll(conversationHistory)
            messages.add(ChatMessage("user", userMessage))
            
            val requestBuilder = ChatCompletionRequest.builder()
                .model(model)
                .messages(messages)
                .maxTokens(maxTokens)
                .temperature(temperature)
                .topP(topP)
                .frequencyPenalty(frequencyPenalty)
                .presencePenalty(presencePenalty)
            
            // Если streaming включен, но мы используем обычный метод (не streaming)
            // Streaming будет реализован через отдельный метод
            if (!streaming) {
                requestBuilder.stream(false)
            }
            
            val request = requestBuilder.build()
            
            val response = service.createChatCompletion(request)
            return response.choices.firstOrNull()?.message?.content 
                ?: "Извините, не смог сгенерировать ответ."
        } catch (e: Exception) {
            println("OpenAI API error: ${e.message}")
            e.printStackTrace()
            throw RuntimeException("Ошибка при обращении к OpenAI API: ${e.message}", e)
        }
    }
    
    /**
     * Streaming chat - возвращает полный ответ через callback chunks
     * Используется для real-time чата через WebSocket
     * 
     * Примечание: Streaming пока не реализован полностью из-за ограничений библиотеки.
     * Используется обычный метод chat() с полным ответом.
     */
    fun chatStream(
        systemPrompt: String, 
        conversationHistory: List<ChatMessage>, 
        userMessage: String,
        onChunk: (String) -> Unit
    ): String {
        // Временно используем обычный метод chat()
        // Streaming будет реализован позже через SSE или WebSocket
        val fullResponse = chat(systemPrompt, conversationHistory, userMessage)
        
        // Симулируем streaming, отправляя ответ по частям
        if (streaming && fullResponse.length > 10) {
            val chunkSize = 15 // Отправляем по 15 символов за раз (быстрее)
            var index = 0
            while (index < fullResponse.length) {
                val chunk = fullResponse.substring(
                    index, 
                    minOf(index + chunkSize, fullResponse.length)
                )
                onChunk(chunk)
                index += chunkSize
                // Минимальная задержка для эффекта streaming (быстрее)
                Thread.sleep(30)
            }
        } else {
            // Если streaming выключен, отправляем весь ответ сразу
            onChunk(fullResponse)
        }
        
        return fullResponse
    }
    
    fun generateFeedback(
        session: SessionDTO,
        conversationHistory: List<ChatMessage>
    ): Pair<String, Int> {
        val messages = mutableListOf<ChatMessage>()
        
        val feedbackPrompt = """
            Проанализируй диалог с учеником по теме "${session.params.topic}".
            
            Предоставь детальную обратную связь:
            1. Что ученик усвоил хорошо
            2. Где были сложности или пробелы в знаниях
            3. На что обратить внимание
            4. Рекомендации для дальнейшего обучения
            
            После feedback дай числовую оценку от 0 до 100.
            Формат ответа:
            [FEEDBACK]
            <текст обратной связи>
            [SCORE]
            <число от 0 до 100>
        """.trimIndent()
        
        messages.add(ChatMessage("system", generateSystemPrompt(session)))
        messages.addAll(conversationHistory)
        messages.add(ChatMessage("user", feedbackPrompt))
        
        val service = requireOpenAIService()
        val request = ChatCompletionRequest.builder()
            .model(model)
            .messages(messages)
            .maxTokens(1000)
            .temperature(0.7)
            .build()
        
        val response = service.createChatCompletion(request)
        val content = response.choices.firstOrNull()?.message?.content ?: ""
        
        // Parse feedback and score
        val feedbackMatch = Regex("\\[FEEDBACK\\]\\s*(.+?)\\s*\\[SCORE\\]", RegexOption.DOT_MATCHES_ALL)
            .find(content)
        val scoreMatch = Regex("\\[SCORE\\]\\s*(\\d+)").find(content)
        
        val feedback = feedbackMatch?.groupValues?.get(1)?.trim() 
            ?: "Сессия завершена. Продолжайте практиковаться!"
        val score = scoreMatch?.groupValues?.get(1)?.toIntOrNull() ?: 75
        
        return Pair(feedback, score.coerceIn(0, 100))
    }
}

