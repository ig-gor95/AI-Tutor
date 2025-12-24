package com.aitutor.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.yaml.snakeyaml.Yaml
import java.io.InputStreamReader

// Сначала определяем все data classes
data class PhonemeConfig(
    val phonemes: Map<String, PhonemeSettings>,
    val defaults: Defaults
)

data class PhonemeSettings(
    val expected: ExpectedFormants,
    val validation: ValidationRanges,
    val thresholds: Thresholds,
    val acceptableRange: AcceptableRange
)

data class ExpectedFormants(
    val f1: Double,
    val f2: Double
)

data class ValidationRanges(
    val f1: Range,
    val f2: Range
)

data class Range(
    val min: Double,
    val max: Double
)

data class Thresholds(
    val f1: Double,  // Процент отклонения для F1
    val f2: Double,  // Процент отклонения для F2
    val f2F3Check: Double,  // Процент для проверки F2/F3
    val f2Penalty: Double  // Процент для применения штрафа
)

data class AcceptableRange(
    val f1: Range,
    val f2: Range,
    val minAccuracy: Double  // Минимальная точность, если в допустимом диапазоне
)

data class Defaults(
    val consonant: ConsonantSettings,
    val unknown: UnknownSettings
)

data class ConsonantSettings(
    val accuracy: Double
)

data class UnknownSettings(
    val accuracy: Double
)

// Расширение для PhonemeConfig
fun PhonemeConfig.getSettings(phoneme: String): PhonemeSettings? {
    val lowerPhoneme = phoneme.lowercase()
    // 'е' использует те же настройки что и 'э', если нет отдельной конфигурации
    return when (lowerPhoneme) {
        "е" -> phonemes["е"] ?: phonemes["э"]
        else -> phonemes[lowerPhoneme]
    }
}

@Configuration
class PhonemeConfigLoader {
    private val yaml = Yaml()
    
    @Bean
    fun phonemeConfig(): PhonemeConfig {
        val resource = ClassPathResource("phoneme-config.yml")
        val inputStream = resource.inputStream
        val configMap = yaml.load<Map<String, Any>>(InputStreamReader(inputStream, Charsets.UTF_8)) ?: emptyMap()
        inputStream.close()
        
        return parseConfig(configMap)
    }
    
    private fun parseConfig(configMap: Map<String, Any>): PhonemeConfig {
        val phonemesMap = configMap["phonemes"] as? Map<String, Any> ?: emptyMap()
        val defaultsMap = configMap["defaults"] as? Map<String, Any> ?: emptyMap()
        
        val phonemes = phonemesMap.mapValues { (_, value) ->
            parsePhonemeSettings(value as Map<String, Any>)
        }
        
        val defaults = parseDefaults(defaultsMap)
        
        return PhonemeConfig(phonemes, defaults)
    }
    
    private fun parsePhonemeSettings(map: Map<String, Any>): PhonemeSettings {
        val expectedMap = map["expected"] as Map<String, Any>
        val validationMap = map["validation"] as Map<String, Any>
        val thresholdsMap = map["thresholds"] as Map<String, Any>
        val acceptableRangeMap = map["acceptableRange"] as Map<String, Any>
        
        return PhonemeSettings(
            expected = ExpectedFormants(
                f1 = (expectedMap["f1"] as Number).toDouble(),
                f2 = (expectedMap["f2"] as Number).toDouble()
            ),
            validation = ValidationRanges(
                f1 = parseRange(validationMap["f1"] as Map<String, Any>),
                f2 = parseRange(validationMap["f2"] as Map<String, Any>)
            ),
            thresholds = Thresholds(
                f1 = (thresholdsMap["f1"] as Number).toDouble(),
                f2 = (thresholdsMap["f2"] as Number).toDouble(),
                f2F3Check = (thresholdsMap["f2F3Check"] as Number).toDouble(),
                f2Penalty = (thresholdsMap["f2Penalty"] as Number).toDouble()
            ),
            acceptableRange = AcceptableRange(
                f1 = parseRange(acceptableRangeMap["f1"] as Map<String, Any>),
                f2 = parseRange(acceptableRangeMap["f2"] as Map<String, Any>),
                minAccuracy = (acceptableRangeMap["minAccuracy"] as Number).toDouble()
            )
        )
    }
    
    private fun parseRange(map: Map<String, Any>): Range {
        return Range(
            min = (map["min"] as Number).toDouble(),
            max = (map["max"] as Number).toDouble()
        )
    }
    
    private fun parseAcceptableRange(map: Map<String, Any>): Range {
        return Range(
            min = (map["min"] as Number).toDouble(),
            max = (map["max"] as Number).toDouble()
        )
    }
    
    private fun parseDefaults(map: Map<String, Any>): Defaults {
        val consonantMap = map["consonant"] as? Map<String, Any> ?: emptyMap()
        val unknownMap = map["unknown"] as? Map<String, Any> ?: emptyMap()
        
        return Defaults(
            consonant = ConsonantSettings(
                accuracy = (consonantMap["accuracy"] as? Number)?.toDouble() ?: 0.85
            ),
            unknown = UnknownSettings(
                accuracy = (unknownMap["accuracy"] as? Number)?.toDouble() ?: 0.3
            )
        )
    }
}
