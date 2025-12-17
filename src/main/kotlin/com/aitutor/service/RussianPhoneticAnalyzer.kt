package com.aitutor.service

import org.springframework.stereotype.Component

/**
 * Анализатор фонетики русского языка
 * Разбивает текст на фонемы с учетом правил русской фонетики
 */
@Component
class RussianPhoneticAnalyzer {

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
        
        while (i < word.length) {
            val char = word[i]
            val nextChar = if (i + 1 < word.length) word[i + 1] else null
            val prevChar = if (i > 0) word[i - 1] else null
            
            when {
                // Гласные
                char in "аеёиоуыэюя" -> {
                    val phoneme = when (char) {
                        'а' -> "а"
                        'е' -> if (prevChar == null || isHardConsonant(prevChar)) "э" else "е"
                        'ё' -> "о" // Всегда ударная, но для упрощения используем "о"
                        'и' -> if (prevChar != null && isHardConsonant(prevChar)) "ы" else "и"
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
     * Извлекает фонемы из одного слова (публичный метод для использования извне)
     */
    fun extractWordPhonemes(word: String): List<String> {
        val cleaned = word.lowercase().replace(Regex("[^а-яё]"), "")
        return extractWordPhonemesInternal(cleaned)
    }
}

