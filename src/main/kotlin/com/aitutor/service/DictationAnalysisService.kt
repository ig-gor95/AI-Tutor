package com.aitutor.service

import com.aitutor.model.dto.*
import mu.KotlinLogging
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics
import org.springframework.stereotype.Service
import java.io.ByteArrayInputStream
import java.util.*
import javax.sound.sampled.AudioFormat
import javax.sound.sampled.AudioInputStream
import javax.sound.sampled.AudioSystem
import kotlin.math.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private val logger = KotlinLogging.logger {}

@Service
class DictationAnalysisService(
    private val phoneticAnalyzer: RussianPhoneticAnalyzer
) {

    /**
     * Основной метод анализа дикции
     */
    suspend fun analyzeDictation(request: DictationAnalysisRequest): DictationAnalysisResponse = withContext(Dispatchers.IO) {
        try {
            // Декодируем аудио из base64
            val audioBytes = Base64.getDecoder().decode(request.audioData)
            val audioStream = ByteArrayInputStream(audioBytes)
            
            // Определяем формат аудио
            val audioInputStream = when (request.audioFormat.lowercase()) {
                "wav" -> AudioSystem.getAudioInputStream(audioStream)
                "mp3" -> {
                    // Для MP3 может потребоваться дополнительная обработка
                    AudioSystem.getAudioInputStream(audioStream)
                }
                "webm" -> {
                    // WebM требует специальной обработки, пробуем как WAV
                    // В реальности нужна библиотека для декодирования WebM
                    try {
                        AudioSystem.getAudioInputStream(audioStream)
                    } catch (e: Exception) {
                        throw IllegalArgumentException("WebM format is not fully supported. Please use WAV format for better compatibility.")
                    }
                }
                else -> throw IllegalArgumentException("Unsupported audio format: ${request.audioFormat}. Supported formats: wav, mp3")
            }
            
            val format = audioInputStream.format
            val sampleRate = format.sampleRate.toInt()
            
            // Читаем все аудио данные
            val audioData = readAudioData(audioInputStream)
            val duration = audioData.size.toDouble() / sampleRate
            
            logger.info { "Analyzing dictation: ${audioData.size} samples, ${duration}s duration, ${sampleRate}Hz sample rate" }
            
            // Выполняем различные анализы
            val intonation = analyzeIntonation(audioData, sampleRate)
            val timbre = analyzeTimbre(audioData, sampleRate)
            val (words, phonemes) = analyzePhonetics(audioData, sampleRate, request.expectedText, request.language)
            val articulation = analyzeArticulation(audioData, sampleRate, phonemes)
            
            // Вычисляем общую точность
            val overallAccuracy = if (phonemes.isNotEmpty()) {
                phonemes.map { it.accuracy }.average()
            } else {
                0.0
            }
            
            // Собираем все проблемы
            val allIssues = mutableListOf<String>()
            words.forEach { allIssues.addAll(it.issues) }
            phonemes.forEach { allIssues.addAll(it.issues) }
            allIssues.addAll(articulation.issues)
            
            // Генерируем рекомендации
            val recommendations = generateRecommendations(words, phonemes, intonation, articulation)
            
            DictationAnalysisResponse(
                success = true,
                overallAccuracy = overallAccuracy,
                words = words,
                phonemes = phonemes,
                intonation = intonation,
                timbre = timbre,
                articulation = articulation,
                audioDuration = duration,
                sampleRate = sampleRate,
                issues = allIssues.distinct(),
                recommendations = recommendations
            )
        } catch (e: Exception) {
            logger.error(e) { "Error analyzing dictation" }
            throw RuntimeException("Failed to analyze dictation: ${e.message}", e)
        }
    }
    
    /**
     * Читает аудио данные из потока
     */
    private fun readAudioData(audioInputStream: AudioInputStream): FloatArray {
        val format = audioInputStream.format
        val frameSize = format.frameSize
        val frameLength = audioInputStream.frameLength.toInt()
        val channels = format.channels
        val bytesPerSample = format.sampleSizeInBits / 8
        val isBigEndian = format.isBigEndian
        
        logger.info { 
            "Reading audio: frameLength=$frameLength, channels=$channels, " +
            "sampleRate=${format.sampleRate}, bytesPerSample=$bytesPerSample, " +
            "bigEndian=$isBigEndian, frameSize=$frameSize"
        }
        
        // Читаем все данные в буфер
        val totalBytes = frameLength * frameSize
        val buffer = ByteArray(totalBytes)
        var totalRead = 0
        
        // Читаем данные порциями, пока не прочитаем все
        while (totalRead < totalBytes) {
            val bytesRead = audioInputStream.read(buffer, totalRead, totalBytes - totalRead)
            if (bytesRead == -1) {
                logger.warn { "Early end of stream: read $totalRead of $totalBytes bytes" }
                break
            }
            totalRead += bytesRead
        }
        
        logger.info { "Read $totalRead bytes from audio stream (expected $totalBytes)" }
        
        if (totalRead == 0) {
            logger.error { "No data read from audio stream!" }
            return FloatArray(0)
        }
        
        // Конвертируем в float массив (моно)
        val samples = FloatArray(frameLength * channels)
        
        for (i in samples.indices) {
            val byteIndex = i * bytesPerSample
            if (byteIndex + bytesPerSample > totalRead) {
                // Недостаточно данных, заполняем нулями
                samples[i] = 0.0f
                continue
            }
            
            when (bytesPerSample) {
                1 -> {
                    // 8-bit unsigned
                    val unsigned = buffer[byteIndex].toInt() and 0xFF
                    samples[i] = (unsigned / 128.0f) - 1.0f
                }
                2 -> {
                    // 16-bit signed
                    val sample = if (isBigEndian) {
                        ((buffer[byteIndex].toInt() and 0xFF) shl 8) or 
                        (buffer[byteIndex + 1].toInt() and 0xFF)
                    } else {
                        (buffer[byteIndex].toInt() and 0xFF) or 
                        ((buffer[byteIndex + 1].toInt() and 0xFF) shl 8)
                    }
                    val signed = if (sample > 32767) sample - 65536 else sample
                    samples[i] = signed / 32768.0f
                }
                else -> throw IllegalArgumentException("Unsupported sample size: $bytesPerSample")
            }
        }
        
        // Если стерео, конвертируем в моно
        val result = if (channels == 2) {
            FloatArray(frameLength) { i ->
                (samples[i * 2] + samples[i * 2 + 1]) / 2.0f
            }
        } else {
            samples
        }
        
        val maxAmplitude = result.maxOfOrNull { abs(it) } ?: 0.0f
        val nonZeroCount = result.count { abs(it) > 1e-6 }
        logger.info { 
            "Audio data converted: size=${result.size}, " +
            "maxAmplitude=$maxAmplitude, nonZero=$nonZeroCount/${result.size}"
        }
        
        if (maxAmplitude < 1e-6) {
            logger.error { "All audio samples are zero or near-zero!" }
        }
        
        return result
    }
    
    /**
     * Анализ интонации (высота тона, контур)
     * Использует автокорреляцию для определения высоты тона
     */
    private fun analyzeIntonation(audioData: FloatArray, sampleRate: Int): IntonationAnalysis {
        val pitchValues = estimatePitchFromSpectrum(audioData, sampleRate)
        
        if (pitchValues.isEmpty()) {
            // Если не удалось определить высоту тона, используем значения по умолчанию
            pitchValues.add(150.0) // Средняя частота для речи
        }
        
        val stats = DescriptiveStatistics()
        pitchValues.forEach { stats.addValue(it) }
        
        val averagePitch = stats.mean
        val pitchRange = stats.max - stats.min
        val pitchVariation = stats.standardDeviation
        
        // Оценка монотонности (низкая вариация = высокая монотонность)
        val monotonyScore = 1.0 - min(1.0, pitchVariation / 50.0)
        
        return IntonationAnalysis(
            pitchContour = pitchValues,
            pitchVariation = pitchVariation,
            averagePitch = averagePitch,
            pitchRange = pitchRange,
            monotonyScore = monotonyScore,
            intonationPattern = determineIntonationPattern(pitchValues)
        )
    }
    
    /**
     * Оценка высоты тона на основе спектрального анализа
     * Использует FFT для поиска основной частоты в диапазоне человеческого голоса
     */
    private fun estimatePitchFromSpectrum(audioData: FloatArray, sampleRate: Int): MutableList<Double> {
        val windowSize = 2048
        val hopSize = 512
        val pitches = mutableListOf<Double>()
        
        // Применяем окно Ханна для уменьшения артефактов
        val hannWindow = FloatArray(windowSize) { i ->
            (0.5 * (1 - cos(2 * PI * i / (windowSize - 1)))).toFloat()
        }
        
        for (i in 0 until (audioData.size - windowSize) step hopSize) {
            val window = audioData.sliceArray(i until min(i + windowSize, audioData.size))
            
            // Применяем окно
            val windowed = FloatArray(window.size) { idx ->
                if (idx < hannWindow.size) window[idx] * hannWindow[idx] else window[idx]
            }
            
            val fft = fft(windowed)
            
            // Находим пик в диапазоне человеческого голоса (80-400 Hz)
            var maxMagnitude = 0.0
            var maxIndex = 0
            val minFreq = 80
            val maxFreq = 400
            val minBin = (minFreq * windowSize / sampleRate).toInt()
            val maxBin = (maxFreq * windowSize / sampleRate).toInt()
            
            for (j in minBin until min(maxBin, fft.size / 2)) {
                val magnitude = sqrt(fft[j].first.pow(2) + fft[j].second.pow(2))
                if (magnitude > maxMagnitude) {
                    maxMagnitude = magnitude
                    maxIndex = j
                }
            }
            
            if (maxIndex > 0) {
                val pitch = maxIndex * sampleRate.toDouble() / windowSize
                // Фильтруем нереалистичные значения
                if (pitch in 50.0..500.0) {
                    pitches.add(pitch)
                }
            }
        }
        
        // Если не нашли пики, используем автокорреляцию как fallback
        if (pitches.isEmpty()) {
            pitches.addAll(estimatePitchWithAutocorrelation(audioData, sampleRate))
        }
        
        return pitches
    }
    
    /**
     * Оценка высоты тона с помощью автокорреляции
     */
    private fun estimatePitchWithAutocorrelation(audioData: FloatArray, sampleRate: Int): List<Double> {
        val pitches = mutableListOf<Double>()
        val windowSize = 2048
        val hopSize = 512
        
        for (i in 0 until (audioData.size - windowSize) step hopSize) {
            val window = audioData.sliceArray(i until min(i + windowSize, audioData.size))
            
            // Автокорреляция
            val minPeriod = (sampleRate / 500).toInt() // Максимальная частота 500 Hz
            val maxPeriod = (sampleRate / 50).toInt()  // Минимальная частота 50 Hz
            
            var maxCorrelation = 0.0
            var bestPeriod = 0
            
            for (period in minPeriod until min(maxPeriod, window.size / 2)) {
                var correlation = 0.0
                for (j in 0 until (window.size - period)) {
                    correlation += window[j] * window[j + period]
                }
                correlation /= (window.size - period)
                
                if (correlation > maxCorrelation) {
                    maxCorrelation = correlation
                    bestPeriod = period
                }
            }
            
            if (bestPeriod > 0) {
                val pitch = sampleRate.toDouble() / bestPeriod
                if (pitch in 50.0..500.0) {
                    pitches.add(pitch)
                }
            }
        }
        
        return pitches
    }
    
    /**
     * Простое FFT (можно заменить на JTransforms)
     */
    private fun fft(signal: FloatArray): Array<Pair<Double, Double>> {
        val n = signal.size
        val result = Array(n) { Pair(0.0, 0.0) }
        
        for (k in 0 until n) {
            var real = 0.0
            var imag = 0.0
            for (j in 0 until n) {
                val angle = -2.0 * PI * k * j / n
                real += signal[j] * cos(angle)
                imag += signal[j] * sin(angle)
            }
            result[k] = Pair(real, imag)
        }
        
        return result
    }
    
    /**
     * Определение паттерна интонации
     */
    private fun determineIntonationPattern(pitchValues: List<Double>): String? {
        if (pitchValues.size < 3) return null
        
        val firstThird = pitchValues.take(pitchValues.size / 3).average()
        val middleThird = pitchValues.slice(pitchValues.size / 3 until 2 * pitchValues.size / 3).average()
        val lastThird = pitchValues.takeLast(pitchValues.size / 3).average()
        
        return when {
            lastThird > firstThird + 10 -> "rising"
            lastThird < firstThird - 10 -> "falling"
            abs(middleThird - firstThird) < 5 && abs(lastThird - firstThird) < 5 -> "flat"
            else -> "variable"
        }
    }
    
    /**
     * Анализ тембра
     */
    private fun analyzeTimbre(audioData: FloatArray, sampleRate: Int): TimbreAnalysis {
        val windowSize = 2048
        val hopSize = 1024
        val spectralCentroids = mutableListOf<Double>()
        val spectralRolloffs = mutableListOf<Double>()
        val zeroCrossingRates = mutableListOf<Double>()
        val mfccs = mutableListOf<List<Double>>()
        
        for (i in 0 until (audioData.size - windowSize) step hopSize) {
            val window = audioData.sliceArray(i until min(i + windowSize, audioData.size))
            
            // Применяем окно Ханна
            val windowed = FloatArray(window.size) { idx ->
                window[idx] * (0.5 * (1 - cos(2 * PI * idx / (window.size - 1)))).toFloat()
            }
            
            val fft = fft(windowed)
            val magnitude = fft.map { sqrt(it.first.pow(2) + it.second.pow(2)) }
            
            // Спектральный центроид
            var weightedSum = 0.0
            var magnitudeSum = 0.0
            for (j in 0 until magnitude.size / 2) {
                val freq = j * sampleRate.toDouble() / windowSize
                weightedSum += freq * magnitude[j]
                magnitudeSum += magnitude[j]
            }
            if (magnitudeSum > 0) {
                spectralCentroids.add(weightedSum / magnitudeSum)
            }
            
            // Спектральный роллофф (85%)
            var cumulativeEnergy = 0.0
            val totalEnergy = magnitude.sum()
            var rolloffIndex = 0
            for (j in 0 until magnitude.size / 2) {
                cumulativeEnergy += magnitude[j]
                if (cumulativeEnergy >= 0.85 * totalEnergy) {
                    rolloffIndex = j
                    break
                }
            }
            spectralRolloffs.add(rolloffIndex * sampleRate.toDouble() / windowSize)
            
            // Частота пересечения нуля
            var crossings = 0
            for (j in 1 until window.size) {
                if ((window[j - 1] >= 0 && window[j] < 0) || (window[j - 1] < 0 && window[j] >= 0)) {
                    crossings++
                }
            }
            zeroCrossingRates.add(crossings.toDouble() / window.size)
            
            // Упрощенный MFCC (первые 13 коэффициентов)
            mfccs.add(calculateSimpleMFCC(magnitude, sampleRate))
        }
        
        // Усредняем значения
        val avgCentroid = if (spectralCentroids.isNotEmpty()) spectralCentroids.average() else 1000.0
        val avgRolloff = if (spectralRolloffs.isNotEmpty()) spectralRolloffs.average() else 4000.0
        val avgZCR = if (zeroCrossingRates.isNotEmpty()) zeroCrossingRates.average() else 0.1
        val avgMFCC = if (mfccs.isNotEmpty()) {
            (0 until 13).map { idx ->
                mfccs.map { it.getOrElse(idx) { 0.0 } }.average()
            }
        } else {
            List(13) { 0.0 }
        }
        
        return TimbreAnalysis(
            spectralCentroid = avgCentroid,
            spectralRolloff = avgRolloff,
            zeroCrossingRate = avgZCR,
            mfcc = avgMFCC,
            harmonicity = calculateHarmonicity(audioData, sampleRate)
        )
    }
    
    /**
     * Упрощенный расчет MFCC
     */
    private fun calculateSimpleMFCC(magnitude: List<Double>, sampleRate: Int): List<Double> {
        // Упрощенная версия - в реальности нужны mel-фильтры и DCT
        val mfcc = mutableListOf<Double>()
        val numCoeffs = 13
        
        for (i in 0 until numCoeffs) {
            var sum = 0.0
            for (j in 0 until magnitude.size / 2) {
                val freq = j * sampleRate.toDouble() / (magnitude.size * 2)
                val mel = 2595 * log10(1 + freq / 700.0)
                sum += magnitude[j] * cos(PI * i * (j + 0.5) / (magnitude.size / 2))
            }
            mfcc.add(sum)
        }
        
        return mfcc
    }
    
    /**
     * Расчет гармоничности
     */
    private fun calculateHarmonicity(audioData: FloatArray, sampleRate: Int): Double {
        val windowSize = 2048
        val window = audioData.take(windowSize).let { 
            FloatArray(it.size) { i -> it[i] }
        }
        val fft = fft(window)
        val magnitude = fft.map { sqrt(it.first.pow(2) + it.second.pow(2)) }
        
        // Находим основную частоту
        var maxMag = 0.0
        var maxIndex = 0
        for (i in 1 until magnitude.size / 2) {
            if (magnitude[i] > maxMag) {
                maxMag = magnitude[i]
                maxIndex = i
            }
        }
        
        if (maxIndex == 0) return 0.0
        
        // Проверяем наличие гармоник
        var harmonicEnergy = maxMag
        var totalEnergy = magnitude.sum()
        
        for (h in 2..5) {
            val harmonicIndex = maxIndex * h
            if (harmonicIndex < magnitude.size / 2) {
                harmonicEnergy += magnitude[harmonicIndex]
            }
        }
        
        return if (totalEnergy > 0) harmonicEnergy / totalEnergy else 0.0
    }
    
    /**
     * Анализ фонетики (сравнение с эталонным текстом)
     */
    private fun analyzePhonetics(
        audioData: FloatArray,
        sampleRate: Int,
        expectedText: String,
        language: String
    ): Pair<List<WordAnalysis>, List<PhonemeAnalysis>> {
        val words = expectedText.split("\\s+".toRegex())
        val phonemes = mutableListOf<PhonemeAnalysis>()
        val wordAnalyses = mutableListOf<WordAnalysis>()
        
        // Разбиваем текст на фонемы (упрощенная версия для русского языка)
        val expectedPhonemes = extractPhonemes(expectedText, language)
        
        // Проверка входных данных
        if (audioData.isEmpty()) {
            logger.warn { "Empty audio data for phonetics analysis" }
            return Pair(emptyList(), emptyList())
        }
        
        val audioMax = audioData.maxOfOrNull { abs(it) } ?: 0.0f
        logger.info { 
            "Phonetics analysis: audioData.size=${audioData.size}, " +
            "expectedPhonemes.size=${expectedPhonemes.size}, " +
            "audioMaxAmplitude=$audioMax, " +
            "nonZeroCount=${audioData.count { abs(it) > 1e-6 }}"
        }
        
        // Вычисляем энергию сигнала для более точного разбиения
        val windowSize = (sampleRate * 0.01).toInt() // 10мс окна
        val energy = FloatArray(audioData.size / windowSize) { i ->
            val start = i * windowSize
            val end = min(start + windowSize, audioData.size)
            var sum = 0.0f
            for (j in start until end) {
                sum += audioData[j] * audioData[j]
            }
            sqrt(sum / windowSize)
        }
        
        // Находим порог энергии (медиана)
        val sortedEnergy = energy.sorted()
        val energyThreshold = if (sortedEnergy.isNotEmpty()) {
            sortedEnergy[sortedEnergy.size / 2] * 0.1f // 10% от медианы
        } else {
            0.01f
        }
        
        // Равномерно распределяем время между фонемами
        val timePerPhoneme = if (expectedPhonemes.isNotEmpty()) {
            audioData.size.toDouble() / expectedPhonemes.size
        } else {
            0.0
        }
        
        expectedPhonemes.forEachIndexed { index, expectedPhoneme ->
            val startSample = (index * timePerPhoneme).toInt()
            val endSample = min(((index + 1) * timePerPhoneme).toInt(), audioData.size)
            
            // Ищем ближайшую область с достаточной энергией
            val searchRadius = (sampleRate * 0.1).toInt() // 100мс радиус поиска
            val searchStart = max(0, startSample - searchRadius)
            val searchEnd = min(audioData.size, endSample + searchRadius)
            
            // Находим область с максимальной энергией в окне поиска
            var bestStart = startSample
            var bestEnd = endSample
            var maxEnergy = 0.0f
            
            for (s in searchStart until (searchEnd - windowSize) step windowSize) {
                val energyIndex = s / windowSize
                if (energyIndex < energy.size) {
                    val segmentEnergy = energy[energyIndex]
                    if (segmentEnergy > maxEnergy && segmentEnergy > energyThreshold) {
                        maxEnergy = segmentEnergy
                        bestStart = s
                        bestEnd = min(s + timePerPhoneme.toInt(), audioData.size)
                    }
                }
            }
            
            // Если не нашли область с достаточной энергией, используем исходные границы
            if (maxEnergy < energyThreshold) {
                bestStart = startSample
                bestEnd = endSample
            }
            
            // Убеждаемся, что есть хотя бы минимальное количество сэмплов
            val minSamples = (sampleRate * 0.03).toInt() // Минимум 30мс
            val actualStartSample = max(0, bestStart)
            val actualEndSample = min(audioData.size, max(bestStart + minSamples, bestEnd))
            
            val phonemeAudio = if (actualStartSample < audioData.size && actualEndSample > actualStartSample) {
                audioData.sliceArray(actualStartSample until actualEndSample)
            } else {
                // Fallback: используем исходные границы
                val fallbackStart = max(0, startSample)
                val fallbackEnd = min(audioData.size, max(startSample + minSamples, endSample))
                audioData.sliceArray(fallbackStart until fallbackEnd)
            }
            
            // Проверяем, что сегмент содержит данные
            val segmentMax = phonemeAudio.maxOfOrNull { abs(it) } ?: 0.0f
            val segmentNonZero = phonemeAudio.count { abs(it) > 1e-6 }
            
            logger.debug { 
                "Phoneme '$expectedPhoneme' [$index]: " +
                "original=[$startSample..$endSample], " +
                "best=[$bestStart..$bestEnd], " +
                "final=[$actualStartSample..$actualEndSample], " +
                "size=${phonemeAudio.size}, max=$segmentMax, nonZero=$segmentNonZero"
            }
            
            if (phonemeAudio.isEmpty()) {
                logger.warn { 
                    "Empty phoneme audio for '$expectedPhoneme' at index $index"
                }
            } else if (segmentMax < 1e-6) {
                logger.warn { 
                    "Zero amplitude segment for '$expectedPhoneme' at index $index, " +
                    "using extended context"
                }
                // Используем более широкий контекст вокруг фонемы
                val contextStart = max(0, actualStartSample - (sampleRate * 0.15).toInt())
                val contextEnd = min(audioData.size, actualEndSample + (sampleRate * 0.15).toInt())
                val contextAudio = audioData.sliceArray(contextStart until contextEnd)
                
                if (contextAudio.maxOfOrNull { abs(it) } ?: 0.0f > 1e-6) {
                    logger.info { "Using extended context for '$expectedPhoneme': ${contextAudio.size} samples" }
                    val analysis = analyzePhoneme(contextAudio, sampleRate, expectedPhoneme, index)
                    phonemes.add(analysis)
                    return@forEachIndexed
                }
            }
            
            // Анализируем фонему
            val analysis = analyzePhoneme(phonemeAudio, sampleRate, expectedPhoneme, index)
            phonemes.add(analysis)
        }
        
        // Группируем фонемы по словам
        var phonemeIndex = 0
        words.forEachIndexed { wordIndex, word ->
            val wordPhonemes = when (language.lowercase()) {
                "ru", "rus", "russian" -> phoneticAnalyzer.extractWordPhonemes(word)
                else -> extractPhonemes(word, language)
            }
            val wordPhonemeAnalyses = phonemes.slice(phonemeIndex until min(phonemeIndex + wordPhonemes.size, phonemes.size))
            phonemeIndex += wordPhonemes.size
            
            val wordAccuracy = if (wordPhonemeAnalyses.isNotEmpty()) {
                wordPhonemeAnalyses.map { it.accuracy }.average()
            } else {
                0.0
            }
            
            val wordIssues = wordPhonemeAnalyses.flatMap { it.issues }
            
            wordAnalyses.add(
                WordAnalysis(
                    word = word,
                    position = wordIndex,
                    overallAccuracy = wordAccuracy,
                    phonemes = wordPhonemeAnalyses,
                    issues = wordIssues.distinct()
                )
            )
        }
        
        return Pair(wordAnalyses, phonemes)
    }
    
    /**
     * Извлечение фонем из текста с использованием фонетического анализатора
     */
    private fun extractPhonemes(text: String, language: String): List<String> {
        return when (language.lowercase()) {
            "ru", "rus", "russian" -> phoneticAnalyzer.extractPhonemes(text)
            else -> {
                // Fallback для других языков - простое разбиение по символам
                val cleaned = text.lowercase().replace("\\s+".toRegex(), "")
                cleaned.map { it.toString() }.filter { it.isNotBlank() }
            }
        }
    }
    
    /**
     * Анализ отдельной фонемы
     */
    private fun analyzePhoneme(
        audio: FloatArray,
        sampleRate: Int,
        expectedPhoneme: String,
        position: Int
    ): PhonemeAnalysis {
        if (audio.isEmpty()) {
            logger.warn { "Empty audio array for phoneme '$expectedPhoneme' at position $position" }
            return PhonemeAnalysis(
                phoneme = expectedPhoneme,
                position = position,
                accuracy = 0.0,
                deviation = 1.0,
                issues = listOf("No audio data")
            )
        }
        
        // Проверяем исходные данные
        val audioMax = audio.maxOfOrNull { abs(it) } ?: 0.0f
        val audioMin = audio.minOfOrNull { abs(it) } ?: 0.0f
        val nonZeroCount = audio.count { abs(it) > 1e-6 }
        
        logger.debug { 
            "Analyzing phoneme '$expectedPhoneme': " +
            "audio.size=${audio.size}, " +
            "max=${audioMax}, min=${audioMin}, " +
            "nonZero=$nonZeroCount/${audio.size}"
        }
        
        if (audioMax < 1e-6) {
            logger.warn { "All audio values are zero or near-zero for phoneme '$expectedPhoneme'" }
            return PhonemeAnalysis(
                phoneme = expectedPhoneme,
                position = position,
                accuracy = 0.0,
                deviation = 1.0,
                issues = listOf("All audio values are zero")
            )
        }
        
        // Анализируем спектральные характеристики
        // Применяем окно Ханна (избегаем деления на ноль для очень маленьких массивов)
        val windowSize = if (audio.size > 1) audio.size - 1 else 1
        val windowed = FloatArray(audio.size) { idx ->
            val windowValue = if (windowSize > 0) {
                (0.5 * (1 - cos(2 * PI * idx / windowSize))).toFloat()
            } else {
                1.0f
            }
            audio[idx] * windowValue
        }
        
        // Проверка наличия данных (аудио может содержать отрицательные значения - это нормально)
        // Используем абсолютные значения, так как аудио сигнал может быть в любой фазе
        val maxAmplitude = windowed.maxOfOrNull { abs(it) } ?: 0.0f
        val hasData = maxAmplitude > 1e-6
        
        if (!hasData) {
            logger.warn { 
                "No audio data detected for phoneme $expectedPhoneme: " +
                "audio.size=${audio.size}, maxAmplitude=$maxAmplitude, " +
                "positiveCount=${windowed.count { it > 0.0f }}, " +
                "negativeCount=${windowed.count { it < 0.0f }}, " +
                "zeroCount=${windowed.count { abs(it) < 1e-6 }}"
            }
            return PhonemeAnalysis(
                phoneme = expectedPhoneme,
                position = position,
                accuracy = 0.0,
                deviation = 1.0,
                issues = listOf("No audio signal detected")
            )
        }
        
        logger.debug { 
            "Phoneme $expectedPhoneme analysis: size=${windowed.size}, " +
            "maxAmplitude=$maxAmplitude, " +
            "positive=${windowed.count { it > 0.0f }}, " +
            "negative=${windowed.count { it < 0.0f }}"
        }
        
        val fft = fft(windowed)
        val magnitude = fft.map { sqrt(it.first.pow(2) + it.second.pow(2)) }
        
        // Логирование спектральных характеристик
        logger.debug {
            "Spectrum analysis for '$expectedPhoneme': " +
            "magnitude.size=${magnitude.size}, " +
            "maxMagnitude=${magnitude.maxOfOrNull { it }?.let { String.format("%.2f", it) } ?: "N/A"}, " +
            "magnitudeRange=[${magnitude.minOfOrNull { it }?.let { String.format("%.2f", it) } ?: "N/A"}.." +
            "${magnitude.maxOfOrNull { it }?.let { String.format("%.2f", it) } ?: "N/A"}]"
        }
        
        // Находим форманты (пики в спектре)
        val formants = findFormants(magnitude, sampleRate, expectedPhoneme)
        
        // Сравниваем с ожидаемыми характеристиками фонемы
        val expectedFormants = getExpectedFormants(expectedPhoneme)
        val deviation = calculateFormantDeviation(formants, expectedFormants, expectedPhoneme)
        val accuracy = max(0.0, 1.0 - deviation)
        
        val issues = mutableListOf<String>()
        if (accuracy < 0.7) {
            issues.add("Incorrect pronunciation of '$expectedPhoneme'")
        }
        if (deviation > 0.5) {
            issues.add("Significant deviation from expected formants")
        }
        
        // Детальное логирование для диагностики
        logger.info {
            """
            ===== PHONEME ANALYSIS: '$expectedPhoneme' =====
            Audio: size=${audio.size}, duration=${String.format("%.1f", audio.size * 1000.0 / sampleRate)}ms, 
            maxAmplitude=${String.format("%.4f", audioMax)}, nonZero=$nonZeroCount/${audio.size}
            
            FOUND FORMANTS:
              F1: ${formants.getOrNull(0)?.let { String.format("%.1f Hz", it) } ?: "not found"}
              F2: ${formants.getOrNull(1)?.let { String.format("%.1f Hz", it) } ?: "not found"}
              All formants: ${if (formants.isEmpty()) "none" else formants.joinToString(", ") { String.format("%.1f", it) }}
            
            EXPECTED FORMANTS:
              F1: ${expectedFormants.getOrNull(0)?.let { String.format("%.1f Hz", it) } ?: "N/A"}
              F2: ${expectedFormants.getOrNull(1)?.let { String.format("%.1f Hz", it) } ?: "N/A"}
              All expected: ${expectedFormants.joinToString(", ") { String.format("%.1f", it) }}
            
            DEVIATION CALCULATION:
              F1 deviation: ${if (formants.isNotEmpty() && expectedFormants.isNotEmpty()) {
                  String.format("%.3f", abs(formants[0] - expectedFormants[0]) / expectedFormants[0])
              } else "N/A"}
              F2 deviation: ${if (formants.size > 1 && expectedFormants.size > 1) {
                  String.format("%.3f", abs(formants[1] - expectedFormants[1]) / expectedFormants[1])
              } else "N/A"}
              Total deviation: ${String.format("%.3f", deviation)}
            
            RESULT:
              Accuracy: ${String.format("%.1f%%", accuracy * 100)}
              Issues: ${if (issues.isEmpty()) "none" else issues.joinToString(", ")}
            ============================================
            """.trimIndent()
        }
        
        return PhonemeAnalysis(
            phoneme = expectedPhoneme,
            position = position,
            accuracy = accuracy,
            deviation = deviation,
            issues = issues,
            formantF1 = formants.firstOrNull(),
            formantF2 = formants.getOrNull(1),
            duration = audio.size * 1000.0 / sampleRate
        )
    }
    
    /**
     * Поиск формант в спектре
     * Для согласных и гласных используются разные стратегии
     */
    private fun findFormants(magnitude: List<Double>, sampleRate: Int, phoneme: String = "unknown"): List<Double> {
        val formants = mutableListOf<Double>()
        val windowSize = magnitude.size * 2
        
        // Определяем, является ли фонема согласной
        val isConsonant = phoneme.lowercase().matches(Regex("[бвгджзйклмнпрстфхцчшщ]"))
        
        // Для согласных ищем в более широком диапазоне, для гласных - в стандартном
        val (minFreq, maxFreq) = if (isConsonant) {
            // Согласные могут иметь форманты в широком диапазоне
            Pair(200, 4000)
        } else {
            // Гласные обычно в диапазоне 200-3500 Hz
            Pair(200, 3500)
        }
        
        val minBin = (minFreq * windowSize / sampleRate).toInt()
        val maxBin = (maxFreq * windowSize / sampleRate).toInt()
        
        val peaks = mutableListOf<Pair<Int, Double>>()
        for (i in minBin until min(maxBin, magnitude.size / 2)) {
            if (i > 0 && i < magnitude.size / 2 - 1) {
                // Ищем локальные максимумы (пики)
                if (magnitude[i] > magnitude[i - 1] && magnitude[i] > magnitude[i + 1]) {
                    val freq = i * sampleRate.toDouble() / windowSize
                    peaks.add(Pair(i, magnitude[i]))
                }
            }
        }
        
        if (peaks.isEmpty()) {
            logger.warn { "No peaks found for phoneme '$phoneme' in range [$minFreq-$maxFreq Hz]" }
            return formants
        }
        
        // Сортируем пики по амплитуде и берем топ-2
        val sortedPeaks = peaks.sortedByDescending { it.second }
        val topPeaks = sortedPeaks.take(2)
        
        // Для согласных может быть важно учитывать порядок частот
        // F1 обычно ниже F2, но для некоторых согласных это может быть наоборот
        if (isConsonant && topPeaks.size == 2) {
            // Сортируем по частоте: F1 < F2
            val sortedByFreq = topPeaks.sortedBy { it.first * sampleRate.toDouble() / windowSize }
            sortedByFreq.forEach { (index, _) ->
                val freq = index * sampleRate.toDouble() / windowSize
                formants.add(freq)
            }
        } else {
            // Для гласных или одного пика - просто берем по амплитуде
            topPeaks.forEach { (index, _) ->
                val freq = index * sampleRate.toDouble() / windowSize
                formants.add(freq)
            }
        }
        
        // Логирование поиска формант
        logger.debug {
            "Formant search for '$phoneme' (${if (isConsonant) "consonant" else "vowel"}): " +
            "found ${peaks.size} peaks in range [$minFreq-$maxFreq Hz], " +
            "top ${topPeaks.size} peaks: ${topPeaks.joinToString { 
                "freq=${String.format("%.1f", it.first * sampleRate.toDouble() / windowSize)}Hz, " +
                "magnitude=${String.format("%.2f", it.second)}"
            }}, " +
            "selected formants: ${formants.joinToString { String.format("%.1f", it) }}"
        }
        
        return formants
    }
    
    /**
     * Ожидаемые форманты для фонем (на основе реальных акустических характеристик)
     */
    private fun getExpectedFormants(phoneme: String): List<Double> {
        // Значения основаны на реальных акустических характеристиках русских фонем
        return when (phoneme.lowercase()) {
            // Гласные
            "а" -> listOf(730.0, 1090.0)
            "о" -> listOf(570.0, 840.0)
            "у" -> listOf(300.0, 870.0)
            "э" -> listOf(530.0, 1840.0)
            "ы" -> listOf(440.0, 1020.0)
            "и" -> listOf(270.0, 2290.0)
            "е" -> listOf(530.0, 1840.0)
            
            // Согласные - фрикативные (шипящие и свистящие)
            // Для "с" и "з" характерны высокие частоты (шипение)
            // F1 может быть низкой или отсутствовать, F2 очень высокая (2000-3000 Hz)
            "с", "з" -> listOf(500.0, 2500.0) // F1 низкая, F2 очень высокая
            "ш", "ж" -> listOf(300.0, 2200.0) // Похожие характеристики
            "щ" -> listOf(350.0, 2400.0)
            "ч" -> listOf(450.0, 2100.0)
            
            // Согласные - взрывные
            "т", "д" -> listOf(500.0, 1500.0)
            "п", "б" -> listOf(600.0, 1200.0)
            "к", "г" -> listOf(400.0, 1800.0)
            
            // Согласные - сонорные
            "н" -> listOf(400.0, 1200.0)
            "м" -> listOf(500.0, 1100.0)
            "р" -> listOf(400.0, 1200.0)
            "л" -> listOf(400.0, 1100.0)
            
            // Мягкие варианты (с апострофом)
            "с'", "з'" -> listOf(350.0, 2600.0)
            "т'", "д'" -> listOf(450.0, 1700.0)
            "н'" -> listOf(350.0, 1300.0)
            "л'" -> listOf(350.0, 1200.0)
            
            else -> listOf(500.0, 1500.0) // Значения по умолчанию
        }
    }
    
    /**
     * Расчет отклонения формант
     * Для согласных использует более гибкий алгоритм сравнения
     */
    private fun calculateFormantDeviation(actual: List<Double>, expected: List<Double>, phoneme: String = "unknown"): Double {
        if (actual.isEmpty() || expected.isEmpty()) {
            logger.debug { 
                "Formant deviation calculation for '$phoneme': " +
                "actual.isEmpty=${actual.isEmpty()}, expected.isEmpty=${expected.isEmpty()}, " +
                "returning 1.0 (max deviation)"
            }
            return 1.0
        }
        
        val isConsonant = phoneme.lowercase().matches(Regex("[бвгджзйклмнпрстфхцчшщ]"))
        
        // Для согласных форманты могут быть в другом порядке или иметь только одну форманту
        if (isConsonant && actual.size >= 1 && expected.size >= 1) {
            // Для согласных сравниваем ближайшие форманты (не обязательно F1 с F1)
            val actualSorted = actual.sorted()
            val expectedSorted = expected.sorted()
            
            var totalDeviation = 0.0
            val minSize = min(actualSorted.size, expectedSorted.size)
            val deviations = mutableListOf<Double>()
            
            for (i in 0 until minSize) {
                // Используем минимальное отклонение между любой парой формант
                val bestMatch = expectedSorted.minOfOrNull { exp ->
                    abs(actualSorted[i] - exp) / exp
                } ?: 1.0
                deviations.add(bestMatch)
                totalDeviation += bestMatch
            }
            
            val avgDeviation = totalDeviation / minSize
            
            logger.debug {
                "Formant deviation calculation for '$phoneme' (consonant): " +
                "actual=[${actual.joinToString { String.format("%.1f", it) }}], " +
                "expected=[${expected.joinToString { String.format("%.1f", it) }}], " +
                "matched deviations=[${deviations.joinToString { String.format("%.3f", it) }}], " +
                "average deviation=${String.format("%.3f", avgDeviation)}"
            }
            
            return avgDeviation
        }
        
        // Для гласных - стандартное сравнение F1 с F1, F2 с F2
        var totalDeviation = 0.0
        val minSize = min(actual.size, expected.size)
        val deviations = mutableListOf<Double>()
        
        for (i in 0 until minSize) {
            val deviation = abs(actual[i] - expected[i]) / expected[i]
            deviations.add(deviation)
            totalDeviation += deviation
        }
        
        val avgDeviation = totalDeviation / minSize
        
        // Логирование отклонений
        logger.debug {
            "Formant deviation calculation for '$phoneme': " +
            "actual=[${actual.joinToString { String.format("%.1f", it) }}], " +
            "expected=[${expected.joinToString { String.format("%.1f", it) }}], " +
            "individual deviations=[${deviations.joinToString { String.format("%.3f", it) }}], " +
            "average deviation=${String.format("%.3f", avgDeviation)}"
        }
        
        return avgDeviation
    }
    
    /**
     * Анализ артикуляции
     */
    private fun analyzeArticulation(
        audioData: FloatArray,
        sampleRate: Int,
        phonemes: List<PhonemeAnalysis>
    ): ArticulationAnalysis {
        val clarity = if (phonemes.isNotEmpty()) {
            phonemes.map { it.accuracy }.average()
        } else {
            0.0
        }
        
        val consonantPhonemes = phonemes.filter { 
            it.phoneme.matches(Regex("[бвгджзйклмнпрстфхцчшщ]"))
        }
        val vowelPhonemes = phonemes.filter {
            it.phoneme.matches(Regex("[аеёиоуыэюя]"))
        }
        
        val consonantAccuracy = if (consonantPhonemes.isNotEmpty()) {
            consonantPhonemes.map { it.accuracy }.average()
        } else {
            0.0
        }
        
        val vowelAccuracy = if (vowelPhonemes.isNotEmpty()) {
            vowelPhonemes.map { it.accuracy }.average()
        } else {
            0.0
        }
        
        // Оценка плавности переходов
        val transitions = mutableListOf<Double>()
        for (i in 0 until phonemes.size - 1) {
            val transition = 1.0 - abs(phonemes[i].accuracy - phonemes[i + 1].accuracy)
            transitions.add(transition)
        }
        val transitionSmoothness = if (transitions.isNotEmpty()) {
            transitions.average()
        } else {
            1.0
        }
        
        val issues = mutableListOf<String>()
        if (clarity < 0.7) {
            issues.add("Low overall clarity")
        }
        if (consonantAccuracy < 0.6) {
            issues.add("Problems with consonants")
        }
        if (vowelAccuracy < 0.7) {
            issues.add("Problems with vowels")
        }
        if (transitionSmoothness < 0.6) {
            issues.add("Jarring transitions between sounds")
        }
        
        return ArticulationAnalysis(
            clarity = clarity,
            consonantAccuracy = consonantAccuracy,
            vowelAccuracy = vowelAccuracy,
            transitionSmoothness = transitionSmoothness,
            issues = issues
        )
    }
    
    /**
     * Генерация рекомендаций
     */
    private fun generateRecommendations(
        words: List<WordAnalysis>,
        phonemes: List<PhonemeAnalysis>,
        intonation: IntonationAnalysis,
        articulation: ArticulationAnalysis
    ): List<String> {
        val recommendations = mutableListOf<String>()
        
        if (intonation.monotonyScore > 0.7) {
            recommendations.add("Try to vary your pitch more to make speech more expressive")
        }
        
        if (articulation.clarity < 0.7) {
            recommendations.add("Focus on clearer articulation")
        }
        
        val problematicPhonemes = phonemes.filter { it.accuracy < 0.6 }
        if (problematicPhonemes.isNotEmpty()) {
            val phonemeList = problematicPhonemes.map { it.phoneme }.distinct().joinToString(", ")
            recommendations.add("Pay attention to pronunciation of: $phonemeList")
        }
        
        val problematicWords = words.filter { it.overallAccuracy < 0.6 }
        if (problematicWords.isNotEmpty()) {
            val wordList = problematicWords.map { it.word }.joinToString(", ")
            recommendations.add("Practice pronunciation of words: $wordList")
        }
        
        if (recommendations.isEmpty()) {
            recommendations.add("Good pronunciation! Keep practicing to maintain this level.")
        }
        
        return recommendations
    }
}

