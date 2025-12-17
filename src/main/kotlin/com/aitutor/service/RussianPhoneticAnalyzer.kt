package com.aitutor.service

import org.springframework.stereotype.Component

/**
 * Анализатор фонетики русского языка
 * Разбивает текст на фонемы с учетом правил русской фонетики
 */
@Component
class RussianPhoneticAnalyzer {
    
    /**
     * Словарь слов с непроизносимыми согласными (позиции 0-based)
     * Содержит самые частые слова-исключения
     */
    private val wordsWithSilentConsonants = mapOf(
        "солнце" to setOf(2), // 'л' не произносится
        "праздник" to setOf(3), // 'д' не произносится
        "сердце" to setOf(3), // 'д' не произносится
        "местный" to setOf(2), // 'т' не произносится
        "счастливый" to setOf(3, 4), // 'т' и 'л' не произносятся
        "известный" to setOf(3), // 'т' не произносится
        "прелестный" to setOf(5), // 'т' не произносится
        "окрестный" to setOf(4), // 'т' не произносится
        "лестница" to setOf(2), // 'т' не произносится
        "грустный" to setOf(3), // 'т' не произносится
        "радостный" to setOf(4), // 'т' не произносится
        "честный" to setOf(3), // 'т' не произносится
        "звёздный" to setOf(3), // 'д' не произносится
        "поздно" to setOf(2), // 'д' не произносится
        "громоздкий" to setOf(5), // 'д' не произносится
        "чувство" to setOf(2), // 'в' не произносится
        "здравствуй" to setOf(2), // 'в' не произносится
        "шестнадцать" to setOf(3), // 'т' не произносится
    )

    /**
     * Извлекает фонемы из текста с учетом правил русской фонетики
     */
    fun extractPhonemes(text: String): List<String> {
        val words = text.lowercase()
            .replace(Regex("[^а-яё\\s]"), "") // Убираем все кроме русских букв и пробелов
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
        
        val phonemes = mutableListOf<String>()
        
        words.forEach { word ->
            phonemes.addAll(extractWordPhonemesInternal(word))
        }
        
        return phonemes
    }

    /**
     * Извлекает фонемы из одного слова (внутренний метод)
     */
    private fun extractWordPhonemesInternal(word: String): List<String> {
        if (word.isEmpty()) return emptyList()
        
        val phonemes = mutableListOf<String>()
        var i = 0
        
        // Проверяем, есть ли это слово в словаре непроизносимых согласных
        val silentPositions = wordsWithSilentConsonants[word] ?: emptySet()
        
        while (i < word.length) {
            val char = word[i]
            val nextChar = if (i + 1 < word.length) word[i + 1] else null
            val prevChar = if (i > 0) word[i - 1] else null
            
            // Пропускаем непроизносимые согласные
            if (i in silentPositions) {
                i++
                continue
            }
            
            // Проверяем правила для непроизносимых согласных (для слов не из словаря)
            if (isSilentConsonantByRule(word, i, char)) {
                i++
                continue
            }
            
            when {
                // Гласные
                char in "аеёиоуыэюя" -> {
                    val phoneme = when (char) {
                        'а' -> "а"
                        'е' -> if (prevChar == null || isHardConsonant(prevChar)) "э" else "е"
                        'ё' -> "о" // Всегда ударная, но для упрощения используем "о"
                        'и' -> {
                            // После твердых согласных "и" произносится как "ы"
                            if (prevChar != null && isConsonant(prevChar)) {
                                // Ж, Ш, Ц - всегда твердые, после них "и" всегда становится "ы"
                                if (isHardConsonant(prevChar)) {
                                    "ы"
                                } else {
                                    // Для остальных согласных проверяем, смягчается ли она
                                    // Если после согласной идет 'и', 'е', 'ё', 'ю', 'я', 'ь' - согласная мягкая
                                    // В этом случае "и" остается "и"
                                    // Если согласная не смягчается - она твердая, "и" -> "ы"
                                    
                                    // 'и' сама по себе смягчает предыдущую согласную
                                    // Поэтому если после согласной идет 'и', согласная мягкая
                                    "и"  // После мягких согласных "и" остается "и"
                                }
                            } else {
                                "и"
                            }
                        }
                        'о' -> {
                            // Для анализа дикции используем "о" как есть
                            // Редукция в безударной позиции происходит естественным образом в речи,
                            // но для анализа мы сравниваем с эталонным "о"
                            "о"
                        }
                        'у' -> "у"
                        'ы' -> "ы"
                        'э' -> "э"
                        'ю' -> if (prevChar == null || isHardConsonant(prevChar)) "у" else "ю"
                        'я' -> if (prevChar == null || isHardConsonant(prevChar)) "а" else "я"
                        else -> char.toString()
                    }
                    phonemes.add(phoneme)
                    i++
                }
                
                // Мягкий знак
                char == 'ь' -> {
                    // Мягкий знак не является фонемой, но смягчает предыдущую согласную
                    if (phonemes.isNotEmpty() && i > 0) {
                        val prevPhoneme = phonemes.last()
                        // Помечаем предыдущую согласную как мягкую (добавляем 'j')
                        if (prevPhoneme.length == 1 && isConsonant(prevChar!!)) {
                            phonemes[phonemes.size - 1] = prevPhoneme + "'"
                        }
                    }
                    i++
                }
                
                // Твердый знак
                char == 'ъ' -> {
                    // Твердый знак не является фонемой
                    i++
                }
                
                // Согласные
                isConsonant(char) -> {
                    val phoneme = when (char) {
                        'б' -> "б"
                        'в' -> "в"
                        'г' -> "г"
                        'д' -> "д"
                        'ж' -> "ж"
                        'з' -> "з"
                        'й' -> "й"
                        'к' -> "к"
                        'л' -> "л"
                        'м' -> "м"
                        'н' -> "н"
                        'п' -> "п"
                        'р' -> "р"
                        'с' -> "с"
                        'т' -> "т"
                        'ф' -> "ф"
                        'х' -> "х"
                        'ц' -> "ц"
                        'ч' -> "ч"
                        'ш' -> "ш"
                        'щ' -> "щ"
                        else -> char.toString()
                    }
                    
                    // Проверяем, смягчается ли согласная следующей буквой
                    val isSoft = nextChar?.let { 
                        it == 'ь' || it in "еёиюя" || (it == 'е' && prevChar == null)
                    } ?: false
                    
                    phonemes.add(if (isSoft && phoneme !in listOf("ж", "ш", "ц")) {
                        phoneme + "'"
                    } else {
                        phoneme
                    })
                    i++
                }
                
                else -> i++
            }
        }
        
        return phonemes.filter { it.isNotBlank() }
    }

    /**
     * Проверяет, является ли символ согласной
     */
    private fun isConsonant(char: Char): Boolean {
        return char in "бвгджзйклмнпрстфхцчшщ"
    }

    /**
     * Проверяет, является ли согласная твердой (не может быть мягкой)
     */
    private fun isHardConsonant(char: Char): Boolean {
        return char in "жшц"
    }
    
    /**
     * Проверяет, является ли согласная непроизносимой по правилам
     * (для слов, которых нет в словаре исключений)
     */
    private fun isSilentConsonantByRule(word: String, pos: Int, char: Char): Boolean {
        if (pos == 0 || pos >= word.length - 1) return false
        
        val next = word[pos + 1]
        val nextNext = if (pos < word.length - 2) word[pos + 2] else null
        val prev = word[pos - 1]
        
        return when {
            // "л" перед "нц" (солнце)
            char == 'л' && next == 'н' && nextNext == 'ц' -> true
            
            // "д" перед "ц" после "ер" (сердце)
            char == 'д' && next == 'ц' && pos >= 2 && word.substring(pos - 2, pos) == "ер" -> true
            
            // "т" перед "н" после "с" в суффиксе (местный, известный)
            char == 'т' && next == 'н' && prev == 'с' -> true
            
            // "т" перед "л" после "с" в суффиксе (счастливый)
            char == 'т' && next == 'л' && prev == 'с' -> true
            
            // "д" перед "н" в суффиксе после "з" (праздник)
            char == 'д' && next == 'н' && prev == 'з' -> true
            
            // "в" перед "с" после "у" (чувство)
            char == 'в' && next == 'с' && prev == 'у' -> true
            
            // "в" перед "с" после "а" (здравствуй)
            char == 'в' && next == 'с' && prev == 'а' -> true
            
            else -> false
        }
    }

    /**
     * Извлекает фонемы из одного слова (публичный метод для использования извне)
     */
    fun extractWordPhonemes(word: String): List<String> {
        val cleaned = word.lowercase().replace(Regex("[^а-яё]"), "")
        return extractWordPhonemesInternal(cleaned)
    }
}

