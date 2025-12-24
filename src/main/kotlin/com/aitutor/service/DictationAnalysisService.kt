package com.aitutor.service

import com.aitutor.config.*
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
    private val phoneticAnalyzer: RussianPhoneticAnalyzer,
    private val praatFormantService: PraatFormantService,
    private val phonemeConfig: PhonemeConfig,
    private val openAIService: OpenAIService
) {

    /**
     * Основной метод анализа дикции
     */
    suspend fun analyzeDictation(request: DictationAnalysisRequest): DictationAnalysisResponse = withContext(Dispatchers.IO) {
        val totalStartTime = System.nanoTime()
        
        // Проверяем доступность Praat-сервиса перед началом анализа
        if (!praatFormantService.isServiceAvailable()) {
            throw IllegalStateException(
                "Praat phonetics service is not available at ${praatFormantService.serviceUrl}. " +
                "Please ensure the Python phonetics service is running. " +
                "Start it with: cd phonetics-service && ./start.sh"
            )
        }
        
        try {
            // Декодируем аудио из base64
            val decodeStartTime = System.nanoTime()
            logger.debug { "Decoding base64 audio: length=${request.audioData.length}" }
            val audioBytes = Base64.getDecoder().decode(request.audioData)
            val decodeTime = (System.nanoTime() - decodeStartTime) / 1_000_000.0 // в миллисекундах
            logger.info { "Decoded audio bytes: size=${audioBytes.size}, first 20 bytes (hex): ${audioBytes.take(20).joinToString(" ") { "%02X".format(it) }}, time=${String.format("%.2f", decodeTime)}ms" }
            
            // Проверяем, что это действительно WAV файл
            val wavHeader = audioBytes.take(4).map { it.toInt().toChar() }.joinToString("")
            if (wavHeader != "RIFF" && request.audioFormat.lowercase() == "wav") {
                logger.warn { "WAV header mismatch: expected 'RIFF', got '$wavHeader'. Audio may be corrupted or in wrong format." }
            }
            
            // Проверяем, что есть ненулевые данные
            val nonZeroInHeader = audioBytes.take(100).count { it != 0.toByte() }
            if (nonZeroInHeader < 10) {
                logger.error { 
                    "WARNING: Audio data appears to be mostly zeros (only $nonZeroInHeader non-zero bytes in first 100). " +
                    "This may indicate a problem with audio recording or transmission."
                }
            }
            
            val audioStream = ByteArrayInputStream(audioBytes)
            
            // Определяем формат аудио
            val formatStartTime = System.nanoTime()
            val audioInputStream = when (request.audioFormat.lowercase()) {
                "wav" -> {
                    logger.debug { "Creating AudioInputStream for WAV format" }
                    try {
                        val ais = AudioSystem.getAudioInputStream(audioStream)
                        val format = ais.format
                        logger.info { 
                            "AudioSystem format detected: sampleRate=${format.sampleRate}, " +
                            "channels=${format.channels}, bitsPerSample=${format.sampleSizeInBits}, " +
                            "encoding=${format.encoding}, frameLength=${ais.frameLength}, " +
                            "frameSize=${format.frameSize}, bigEndian=${format.isBigEndian}"
                        }
                        ais
                    } catch (e: Exception) {
                        logger.error(e) { "Failed to create AudioInputStream from WAV: ${e.message}" }
                        throw IllegalArgumentException("Invalid WAV file format: ${e.message}", e)
                    }
                }
                "mp3" -> {
                    logger.debug { "Creating AudioInputStream for MP3 format" }
                    // Для MP3 может потребоваться дополнительная обработка
                    AudioSystem.getAudioInputStream(audioStream)
                }
                "webm" -> {
                    logger.debug { "Creating AudioInputStream for WebM format (trying as WAV)" }
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
            val formatTime = (System.nanoTime() - formatStartTime) / 1_000_000.0
            logger.debug { "AudioInputStream created: time=${String.format("%.2f", formatTime)}ms" }
            
            val format = audioInputStream.format
            val sampleRate = format.sampleRate.toInt()
            
            // Читаем все аудио данные
            val readStartTime = System.nanoTime()
            val audioData = readAudioData(audioInputStream)
            val readTime = (System.nanoTime() - readStartTime) / 1_000_000.0
            val duration = audioData.size.toDouble() / sampleRate
            
            logger.info { "Analyzing dictation: ${audioData.size} samples, ${duration}s duration, ${sampleRate}Hz sample rate, readTime=${String.format("%.2f", readTime)}ms" }
            
            // Транскрибируем аудио в текст
            val transcriptionStartTime = System.nanoTime()
            logger.info { "Transcribing audio to text..." }
            val transcribedText = try {
                openAIService.transcribeAudio(audioBytes, request.audioFormat, request.language)
            } catch (e: Exception) {
                logger.error(e) { "Failed to transcribe audio: ${e.message}" }
                // Если expectedText пустой или является заглушкой, бросаем исключение
                if (request.expectedText.isBlank()) {
                    throw RuntimeException("Не удалось транскрибировать аудио через OpenAI: ${e.message}. " +
                        "Проверьте настройки OpenAI API key и подключение к интернету.", e)
                }
                // Используем ожидаемый текст как fallback только если он непустой
                logger.warn { "Using expected text as fallback: '${request.expectedText}'" }
                request.expectedText
            }
            val transcriptionTime = (System.nanoTime() - transcriptionStartTime) / 1_000_000.0
            logger.info { "Audio transcription completed: '$transcribedText', time=${String.format("%.2f", transcriptionTime)}ms" }
            
            // Выполняем различные анализы
            // ВРЕМЕННО ОТКЛЮЧЕНО: анализ интонации и тембра занимает слишком много времени
            // TODO: Оптимизировать или включить обратно после оптимизации
            val intonationStartTime = System.nanoTime()
            val intonation = IntonationAnalysis(
                pitchContour = emptyList(),
                pitchVariation = 0.0,
                averagePitch = 150.0,
                pitchRange = 0.0,
                monotonyScore = 0.5,
                intonationPattern = "neutral"
            )
            val intonationTime = (System.nanoTime() - intonationStartTime) / 1_000_000.0
            logger.info { "Intonation analysis (disabled): time=${String.format("%.2f", intonationTime)}ms" }
            
            val timbreStartTime = System.nanoTime()
            val timbre = TimbreAnalysis(
                spectralCentroid = 2000.0,
                spectralRolloff = 5000.0,
                zeroCrossingRate = 0.1,
                mfcc = List(13) { 0.0 },
                harmonicity = 0.5
            )
            val timbreTime = (System.nanoTime() - timbreStartTime) / 1_000_000.0
            logger.info { "Timbre analysis (disabled): time=${String.format("%.2f", timbreTime)}ms" }
            
            val phoneticsStartTime = System.nanoTime()
            // Используем транскрибированный текст для анализа дикции
            val (words, phonemes) = analyzePhonetics(audioData, sampleRate, transcribedText, request.language)
            val phoneticsTime = (System.nanoTime() - phoneticsStartTime) / 1_000_000.0
            logger.info { "Phonetics analysis completed: ${phonemes.size} phonemes, ${words.size} words, time=${String.format("%.2f", phoneticsTime)}ms" }
            
            val articulationStartTime = System.nanoTime()
            val articulation = analyzeArticulation(audioData, sampleRate, phonemes)
            val articulationTime = (System.nanoTime() - articulationStartTime) / 1_000_000.0
            logger.info { "Articulation analysis completed: time=${String.format("%.2f", articulationTime)}ms" }
            
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
            val recommendationsStartTime = System.nanoTime()
            val recommendations = generateRecommendations(words, phonemes, intonation, articulation)
            val recommendationsTime = (System.nanoTime() - recommendationsStartTime) / 1_000_000.0
            logger.info { "Recommendations generation completed: ${recommendations.size} recommendations, time=${String.format("%.2f", recommendationsTime)}ms" }
            
            val totalTime = (System.nanoTime() - totalStartTime) / 1_000_000.0
            logger.info { 
                "=== Dictation Analysis Summary ===\n" +
                "Transcribed text: '$transcribedText'\n" +
                "Expected text: '${request.expectedText}'\n" +
                "Total time: ${String.format("%.2f", totalTime)}ms\n" +
                "  - Base64 decode: ${String.format("%.2f", decodeTime)}ms\n" +
                "  - Audio format: ${String.format("%.2f", formatTime)}ms\n" +
                "  - Read audio data: ${String.format("%.2f", readTime)}ms\n" +
                "  - Audio transcription: ${String.format("%.2f", transcriptionTime)}ms\n" +
                "  - Intonation analysis: ${String.format("%.2f", intonationTime)}ms\n" +
                "  - Timbre analysis: ${String.format("%.2f", timbreTime)}ms\n" +
                "  - Phonetics analysis: ${String.format("%.2f", phoneticsTime)}ms (${phonemes.size} phonemes)\n" +
                "  - Articulation analysis: ${String.format("%.2f", articulationTime)}ms\n" +
                "  - Recommendations generation: ${String.format("%.2f", recommendationsTime)}ms\n" +
                "Overall accuracy: ${String.format("%.1f", overallAccuracy * 100)}%"
            }
            
            DictationAnalysisResponse(
                success = true,
                overallAccuracy = overallAccuracy,
                transcribedText = transcribedText,
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
            
            // Логируем первые несколько чтений для отладки
            if (totalRead <= 100 && bytesRead > 0) {
                val recentBytes = buffer.sliceArray((totalRead - bytesRead).coerceAtLeast(0) until totalRead)
                val nonZeroInRecent = recentBytes.count { it != 0.toByte() }
                logger.debug { 
                    "Read $bytesRead bytes (total: $totalRead), " +
                    "non-zero in this chunk: $nonZeroInRecent/$bytesRead"
                }
            }
        }
        
        logger.info { "Read $totalRead bytes from audio stream (expected $totalBytes)" }
        
        if (totalRead == 0) {
            logger.error { "No data read from audio stream!" }
            return FloatArray(0)
        }
        
        // Логируем первые несколько байт для отладки
        val previewBytes = buffer.take(min(20, totalRead))
        logger.info { 
            "First ${previewBytes.size} bytes (hex): " +
            previewBytes.joinToString(" ") { "%02X".format(it) } +
            ", first bytes (signed): " +
            previewBytes.joinToString(" ") { it.toInt().toString() }
        }
        
        // Проверяем, есть ли ненулевые байты в начале
        val nonZeroBytesCount = buffer.take(1000).count { it != 0.toByte() }
        logger.info { "Non-zero bytes in first 1000: $nonZeroBytesCount/1000" }
        
        // Если все нули, это проблема
        if (nonZeroBytesCount == 0 && totalRead > 100) {
            logger.error { 
                "WARNING: All bytes are zero! This indicates a problem with audio decoding. " +
                "Total bytes read: $totalRead, frameLength: $frameLength, frameSize: $frameSize"
            }
        }
        
        // Конвертируем в float массив (моно)
        // Для моно канала: frameSize = bytesPerSample
        // Для стерео: frameSize = bytesPerSample * 2
        val samples = FloatArray(frameLength * channels)
        
        var sampleIndex = 0
        for (frame in 0 until frameLength) {
            val frameByteIndex = frame * frameSize
            
            for (channel in 0 until channels) {
                val byteIndex = frameByteIndex + (channel * bytesPerSample)
                
                if (byteIndex + bytesPerSample > totalRead) {
                    samples[sampleIndex++] = 0.0f
                    continue
                }
                
                when (bytesPerSample) {
                    1 -> {
                        // 8-bit unsigned
                        val unsigned = buffer[byteIndex].toInt() and 0xFF
                        samples[sampleIndex++] = (unsigned - 128).toFloat() / 128.0f
                    }
                    2 -> {
                        // 16-bit signed (little-endian для WAV)
                        val byte0 = buffer[byteIndex].toInt() and 0xFF
                        val byte1 = buffer[byteIndex + 1].toInt() and 0xFF
                        val sample = if (isBigEndian) {
                            (byte0 shl 8) or byte1
                        } else {
                            byte0 or (byte1 shl 8)
                        }
                        val signed = if (sample > 32767) sample - 65536 else sample
                        val floatValue = signed / 32768.0f
                        samples[sampleIndex++] = floatValue
                        
                        // Логируем первые несколько конвертаций для отладки
                        if (sampleIndex <= 10) {
                            logger.info {
                                "Sample $sampleIndex: bytes=[$byte0, $byte1], " +
                                "raw=$sample, signed=$signed, float=$floatValue, " +
                                "isBigEndian=$isBigEndian, byteIndex=$byteIndex"
                            }
                        }
                    }
                    else -> throw IllegalArgumentException("Unsupported sample size: $bytesPerSample")
                }
            }
        }
        
        // Логируем первые несколько сэмплов для отладки
        if (samples.isNotEmpty()) {
            logger.debug {
                "First 10 samples: ${samples.take(10).joinToString { String.format("%.6f", it) }}, " +
                "min=${samples.minOrNull()}, max=${samples.maxOrNull()}"
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
        // Увеличиваем hopSize для уменьшения количества вычислений (было 512, стало 2048 - анализ каждые ~43мс вместо ~11мс)
        val hopSize = 2048  // Анализируем каждое окно вместо перекрывающихся
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
    private suspend fun analyzePhonetics(
        audioData: FloatArray,
        sampleRate: Int,
        expectedText: String,
        language: String
    ): Pair<List<WordAnalysis>, List<PhonemeAnalysis>> {
        val phoneticsStartTime = System.nanoTime()
        val words = expectedText.split("\\s+".toRegex())
        val phonemes = mutableListOf<PhonemeAnalysis>()
        val wordAnalyses = mutableListOf<WordAnalysis>()
        
        // Разбиваем текст на фонемы (упрощенная версия для русского языка)
        val extractPhonemesStartTime = System.nanoTime()
        val expectedPhonemes = extractPhonemes(expectedText, language)
        val extractPhonemesTime = (System.nanoTime() - extractPhonemesStartTime) / 1_000_000.0
        logger.info { "Extracted phonemes from text '$expectedText': ${expectedPhonemes.joinToString("-")}, time=${String.format("%.2f", extractPhonemesTime)}ms" }
        
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
        val energyStartTime = System.nanoTime()
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
        val energyTime = (System.nanoTime() - energyStartTime) / 1_000_000.0
        logger.debug { "Energy calculation completed: time=${String.format("%.2f", energyTime)}ms" }
        
        // Находим порог энергии (медиана)
        val sortedEnergy = energy.sorted()
        val energyThreshold = if (sortedEnergy.isNotEmpty()) {
            sortedEnergy[sortedEnergy.size / 2] * 0.1f // 10% от медианы
        } else {
            0.01f
        }
        
        // Проверяем, что у нас есть данные (audioMax уже объявлена выше)
        if (audioMax < 1e-6) {

            logger.error { "All audio samples are zero or near-zero! audioData.size=${audioData.size}" }
            // Возвращаем пустые результаты, но не бросаем исключение
            return Pair(emptyList(), expectedPhonemes.mapIndexed { idx, phoneme ->
                PhonemeAnalysis(
                    phoneme = phoneme,
                    position = idx,
                    accuracy = 0.0,
                    deviation = 1.0,
                    issues = listOf("No audio data available")
                )
            })
        }
        
        // Равномерно распределяем время между фонемами
        val timePerPhoneme = if (expectedPhonemes.isNotEmpty()) {
            audioData.size.toDouble() / expectedPhonemes.size
        } else {
            0.0
        }
        
        // Если очень мало фонем или очень короткое аудио, используем весь сигнал для каждой фонемы
        val useFullAudioForEachPhoneme = expectedPhonemes.size == 1 || audioData.size < sampleRate * 0.1
        
        // Используем пакетный анализ Praat для всех фонем сразу (намного эффективнее)
        // Собираем все сегменты для анализа (временные метки в секундах)
        val segmentCreationStartTime = System.nanoTime()
        val praatSegments = mutableListOf<com.aitutor.service.PraatFormantService.PhonemeSegment>()
        
        expectedPhonemes.forEachIndexed { index, expectedPhoneme ->
            val startSample = if (useFullAudioForEachPhoneme) {
                0
            } else {
                (index * timePerPhoneme).toInt()
            }
            val endSample = if (useFullAudioForEachPhoneme) {
                audioData.size
            } else {
                min(((index + 1) * timePerPhoneme).toInt(), audioData.size)
            }
            
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
            
            // Проверяем, есть ли данные в сегменте
            val segmentHasData = phonemeAudio.isNotEmpty() && segmentMax > 1e-6
            
            if (!segmentHasData) {
                // Пытаемся использовать расширенный контекст
                val contextStart = max(0, actualStartSample - (sampleRate * 0.15).toInt())
                val contextEnd = min(audioData.size, actualEndSample + (sampleRate * 0.15).toInt())
                val contextAudio = audioData.sliceArray(contextStart until contextEnd)
                
                if (contextAudio.isNotEmpty() && (contextAudio.maxOfOrNull { abs(it) } ?: 0.0f > 1e-6)) {
                    logger.info { "Using extended context for '$expectedPhoneme': ${contextAudio.size} samples" }
                    val contextStartTime = contextStart.toDouble() / sampleRate
                    val contextEndTime = contextEnd.toDouble() / sampleRate
                    praatSegments.add(
                        com.aitutor.service.PraatFormantService.PhonemeSegment(
                            phoneme = expectedPhoneme,
                            startTime = contextStartTime,
                            endTime = contextEndTime,
                            position = index
                        )
                    )
                } else {
                    // Если данных нет вообще, используем минимальный сегмент в середине
                    logger.warn { "No audio data for '$expectedPhoneme' at index $index, using minimal segment" }
                    val fallbackTime = (actualStartSample + actualEndSample) / 2.0 / sampleRate
                    val minSegmentDuration = 0.03 // 30ms minimum
                    praatSegments.add(
                        com.aitutor.service.PraatFormantService.PhonemeSegment(
                            phoneme = expectedPhoneme,
                            startTime = max(0.0, fallbackTime - minSegmentDuration / 2.0),
                            endTime = min(audioData.size.toDouble() / sampleRate, fallbackTime + minSegmentDuration / 2.0),
                            position = index
                        )
                    )
                }
            } else {
                // Сохраняем сегмент для batch анализа
                // Для гласных используем более узкий сегмент в центре, чтобы избежать переходов
                val isVowel = expectedPhoneme.lowercase() in "аеёиоуыэюя"
                val segmentStartTime = actualStartSample.toDouble() / sampleRate
                val segmentEndTime = actualEndSample.toDouble() / sampleRate
                val segmentDuration = segmentEndTime - segmentStartTime
                
                val (finalStartTime, finalEndTime) = when {
                    isVowel && segmentDuration > 0.15 -> {
                        // Для длинных гласных (больше 150мс) берем центральные 65% сегмента
                        val center = (segmentStartTime + segmentEndTime) / 2.0
                        val newDuration = segmentDuration * 0.65
                        Pair(center - newDuration / 2.0, center + newDuration / 2.0)
                    }
                    isVowel && segmentDuration > 0.08 -> {
                        // Для средних гласных (80-150мс) берем центральные 70% сегмента
                        val center = (segmentStartTime + segmentEndTime) / 2.0
                        val newDuration = segmentDuration * 0.70
                        Pair(center - newDuration / 2.0, center + newDuration / 2.0)
                    }
                    else -> {
                        // Для коротких сегментов или согласных используем весь сегмент
                        Pair(segmentStartTime, segmentEndTime)
                    }
                }
                
                praatSegments.add(
                    com.aitutor.service.PraatFormantService.PhonemeSegment(
                        phoneme = expectedPhoneme,
                        startTime = max(0.0, finalStartTime),
                        endTime = finalEndTime,
                        position = index
                    )
                )
                
                logger.debug {
                    "Phoneme '$expectedPhoneme' segment: " +
                    "original=[${String.format("%.3f", segmentStartTime)}-${String.format("%.3f", segmentEndTime)}]s, " +
                    "final=[${String.format("%.3f", finalStartTime)}-${String.format("%.3f", finalEndTime)}]s, " +
                    "duration=${String.format("%.3f", finalEndTime - finalStartTime)}s"
                }
            }
        }
        
        // Выполняем batch анализ всех фонем сразу через Praat
        logger.info { "Starting batch Praat analysis for ${praatSegments.size} phonemes" }
        
        // Конвертируем FloatArray в ByteArray (16-bit PCM) для batch анализа
        val createWavStartTime = System.nanoTime()
        val audioBytes = createWavFileForBatch(audioData, sampleRate)
        val createWavTime = (System.nanoTime() - createWavStartTime) / 1_000_000.0
        logger.debug { "WAV file creation completed: size=${audioBytes.size} bytes, time=${String.format("%.2f", createWavTime)}ms" }
        
        // Вызываем batch анализ
        val praatBatchStartTime = System.nanoTime()
        val batchResults = praatFormantService.analyzePhonemesBatch(audioBytes, praatSegments)
        val praatBatchTime = (System.nanoTime() - praatBatchStartTime) / 1_000_000.0
        logger.info { "Praat batch analysis completed: ${batchResults?.size ?: 0} results, time=${String.format("%.2f", praatBatchTime)}ms" }
        
        // Обрабатываем результаты batch анализа
        val processResultsStartTime = System.nanoTime()
        if (batchResults != null && batchResults.size == expectedPhonemes.size) {
            logger.info { "Batch analysis completed: ${batchResults.size} results received" }
            
            batchResults.forEachIndexed { index, result ->
                val expectedPhoneme = expectedPhonemes[index]
                val formants = result.formants
                
                // Вычисляем точность на основе формант
                val accuracy = calculatePhonemeAccuracyFromFormants(expectedPhoneme, formants)
                val deviation = 1.0 - accuracy
                
                // Логируем детальную информацию о каждой фонеме
                val expectedFormants = getExpectedFormantsPair(expectedPhoneme)
                logger.info {
                    "Phoneme '$expectedPhoneme' [position=$index]: " +
                    "F1=${formants.f1?.let { String.format("%.1f", it) } ?: "null"} Hz " +
                    "(expected=${expectedFormants?.first?.let { String.format("%.1f", it) } ?: "N/A"} Hz), " +
                    "F2=${formants.f2?.let { String.format("%.1f", it) } ?: "null"} Hz " +
                    "(expected=${expectedFormants?.second?.let { String.format("%.1f", it) } ?: "N/A"} Hz), " +
                    "F3=${formants.f3?.let { String.format("%.1f", it) } ?: "null"} Hz, " +
                    "F0=${formants.f0?.let { String.format("%.1f", it) } ?: "null"} Hz, " +
                    "accuracy=${String.format("%.2f", accuracy)} (${String.format("%.1f", accuracy * 100)}%), " +
                    "deviation=${String.format("%.2f", deviation)}"
                }
                
                val issues = mutableListOf<String>()
                if (formants.f1 == null || formants.f2 == null) {
                    issues.add("Не удалось извлечь форманты")
                    logger.warn { "Phoneme '$expectedPhoneme': Failed to extract formants - F1=${formants.f1}, F2=${formants.f2}" }
                } else {
                    // Проверяем отклонения от эталонных значений
                    if (expectedFormants != null) {
                        val f1Diff = abs((formants.f1 ?: 0.0) - expectedFormants.first)
                        val f2Diff = abs((formants.f2 ?: 0.0) - expectedFormants.second)
                        // Используем процентные пороги для более справедливой оценки
                        val f1Threshold = expectedFormants.first * 0.3
                        val f2Threshold = expectedFormants.second * 0.4
                        
                        logger.debug {
                            "Phoneme '$expectedPhoneme' deviations: " +
                            "F1_diff=${String.format("%.1f", f1Diff)} Hz (threshold=${String.format("%.1f", max(f1Threshold, 200.0))} Hz), " +
                            "F2_diff=${String.format("%.1f", f2Diff)} Hz (threshold=${String.format("%.1f", max(f2Threshold, 400.0))} Hz)"
                        }
                        
                        if (f1Diff > max(f1Threshold, 200.0)) {
                            issues.add("F1 отклонение: ${f1Diff.toInt()} Hz (ожидалось ~${expectedFormants.first.toInt()} Hz)")
                        }
                        if (f2Diff > max(f2Threshold, 400.0)) {
                            issues.add("F2 отклонение: ${f2Diff.toInt()} Hz (ожидалось ~${expectedFormants.second.toInt()} Hz)")
                        }
                    } else {
                        logger.debug { "Phoneme '$expectedPhoneme': No expected formants available (consonant or unknown)" }
                    }
                }
                
                phonemes.add(
                    PhonemeAnalysis(
                        phoneme = expectedPhoneme,
                        position = index,
                        accuracy = accuracy,
                        deviation = deviation,
                        issues = issues,
                        formantF1 = formants.f1,
                        formantF2 = formants.f2,
                        duration = result.formants.f0?.let { (praatSegments[index].endTime - praatSegments[index].startTime) * 1000.0 }
                    )
                )
            }
            
            // Итоговое логирование по всем фонемам
            logger.info {
                "=== Phoneme Analysis Summary ===" +
                "\nTotal phonemes analyzed: ${phonemes.size}" +
                "\nAverage accuracy: ${String.format("%.2f", phonemes.map { it.accuracy }.average())} (${String.format("%.1f", phonemes.map { it.accuracy }.average() * 100)}%)" +
                "\nPhonemes with accuracy >= 0.8: ${phonemes.count { it.accuracy >= 0.8 }}/${phonemes.size}" +
                "\nPhonemes with accuracy < 0.6: ${phonemes.count { it.accuracy < 0.6 }}/${phonemes.size}" +
                "\nDetailed results:" +
                phonemes.joinToString("\n") { p ->
                    "  [${p.position}] '${p.phoneme}': accuracy=${String.format("%.2f", p.accuracy)} " +
                    "(${String.format("%.1f", p.accuracy * 100)}%), " +
                    "F1=${p.formantF1?.let { String.format("%.0f", it) } ?: "N/A"} Hz, " +
                    "F2=${p.formantF2?.let { String.format("%.0f", it) } ?: "N/A"} Hz, " +
                    "issues=${p.issues.size}${if (p.issues.isNotEmpty()) ": ${p.issues.joinToString("; ")}" else ""}"
                }
            }
        } else {
            logger.warn { "Batch analysis failed or returned ${batchResults?.size} results instead of ${expectedPhonemes.size}, falling back to individual analysis" }
            // Fallback: используем старый метод для каждой фонемы
            expectedPhonemes.forEachIndexed { index, expectedPhoneme ->
                val segment = praatSegments[index]
                val startSample = (segment.startTime * sampleRate).toInt()
                val endSample = (segment.endTime * sampleRate).toInt()
                val phonemeAudio = audioData.sliceArray(startSample until min(endSample, audioData.size))
                val analysis = analyzePhoneme(phonemeAudio, sampleRate, expectedPhoneme, index)
                phonemes.add(analysis)
            }
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
        
        val processResultsTime = (System.nanoTime() - processResultsStartTime) / 1_000_000.0
        val segmentCreationTime = (createWavStartTime - segmentCreationStartTime) / 1_000_000.0
        val totalPhoneticsTime = (System.nanoTime() - phoneticsStartTime) / 1_000_000.0
        
        logger.info {
            "=== Phonetics Analysis Timing ===\n" +
            "  - Extract phonemes: ${String.format("%.2f", extractPhonemesTime)}ms\n" +
            "  - Energy calculation: ${String.format("%.2f", energyTime)}ms\n" +
            "  - Segment creation: ${String.format("%.2f", segmentCreationTime)}ms\n" +
            "  - WAV file creation: ${String.format("%.2f", createWavTime)}ms\n" +
            "  - Praat batch analysis: ${String.format("%.2f", praatBatchTime)}ms\n" +
            "  - Process results: ${String.format("%.2f", processResultsTime)}ms\n" +
            "Total phonetics time: ${String.format("%.2f", totalPhoneticsTime)}ms"
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
    private suspend fun analyzePhoneme(
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
        
        // Используем только Praat для анализа формант
        // Конвертируем FloatArray в WAV файл с заголовком
        val audioBytes = createWavFile(windowed, sampleRate)
        
        // Вызываем Praat-сервис (обязательно)
        val praatResult = try {
            praatFormantService.analyzePhonemeWithPraat(
                audioBytes = audioBytes,
                phoneme = expectedPhoneme
            )
        } catch (e: Exception) {
            logger.error(e) { "Failed to call Praat service for phoneme '$expectedPhoneme': ${e.message}" }
            throw IllegalStateException(
                "Praat service is not available. Please ensure the Python phonetics service is running on ${praatFormantService.serviceUrl}. " +
                "Error: ${e.message}"
            )
        }
        
        if (praatResult == null) {
            throw IllegalStateException(
                "Praat service returned null result for phoneme '$expectedPhoneme'. " +
                "Please check the Python phonetics service logs."
            )
        }
        
        if (praatResult.f1 == null || praatResult.f2 == null) {
            throw IllegalStateException(
                "Praat service returned incomplete formant analysis for phoneme '$expectedPhoneme'. " +
                "F1=${praatResult.f1}, F2=${praatResult.f2}. " +
                "Please check the audio quality and Praat service configuration."
            )
        }
        
        logger.info { 
            "Praat analysis for '$expectedPhoneme': " +
            "F1=${praatResult.f1}, F2=${praatResult.f2}, F0=${praatResult.f0}, " +
            "bandwidthF1=${praatResult.bandwidthF1}, bandwidthF2=${praatResult.bandwidthF2}"
        }
        
        val formants = listOfNotNull(praatResult.f1, praatResult.f2, praatResult.f3, praatResult.f4)
        
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
     * Создает WAV файл из FloatArray для batch анализа (использует существующую функцию)
     */
    private fun createWavFileForBatch(audioData: FloatArray, sampleRate: Int): ByteArray {
        return createWavFile(audioData, sampleRate)
    }
    
    /**
     * Получает эталонные значения формант для фонемы (F1, F2)
     */
    private fun getExpectedFormantsPair(phoneme: String): Pair<Double, Double>? {
        val settings = phonemeConfig.getSettings(phoneme)
        return settings?.expected?.let { Pair(it.f1, it.f2) }
    }
    
    /**
     * Валидирует форманты на разумность для данной фонемы
     */
    private fun validateFormants(
        phoneme: String,
        f1: Double?,
        f2: Double?
    ): Pair<Double?, Double?> {
        if (f1 == null || f2 == null) return Pair(f1, f2)
        
        val settings = phonemeConfig.getSettings(phoneme)
        if (settings != null) {
            val f1Range = settings.validation.f1
            val f2Range = settings.validation.f2
            
            // Если F1 вне диапазона, возможно это ошибка измерения
            if (f1 < f1Range.min || f1 > f1Range.max) {
                logger.warn { 
                    "Phoneme '$phoneme': F1=$f1 Hz is outside expected range [${f1Range.min}-${f1Range.max}] Hz. " +
                    "This might indicate measurement error or wrong phoneme segment."
                }
            }
            
            // Если F2 вне диапазона, это серьезная проблема
            if (f2 < f2Range.min || f2 > f2Range.max) {
                logger.warn { 
                    "Phoneme '$phoneme': F2=$f2 Hz is outside expected range [${f2Range.min}-${f2Range.max}] Hz. " +
                    "This likely indicates wrong phoneme segment or measurement error. " +
                    "F2 might be confused with F3 or another formant."
                }
            }
        }
        
        return Pair(f1, f2)
    }
    
    /**
     * Вычисляет точность произношения фонемы на основе формант
     */
    private fun calculatePhonemeAccuracyFromFormants(
        expectedPhoneme: String,
        formants: com.aitutor.service.PraatFormantService.FormantAnalysis
    ): Double {
        val expectedFormants = getExpectedFormantsPair(expectedPhoneme)
        
        if (formants.f1 == null || formants.f2 == null) {
            logger.debug { "Phoneme '$expectedPhoneme': Missing formants - accuracy set to 0.3" }
            return 0.3 // Низкая точность, если форманты не извлечены
        }
        
        // Валидируем форманты
        val (validatedF1, validatedF2) = validateFormants(expectedPhoneme, formants.f1, formants.f2)
        
        if (expectedFormants == null) {
            // Для согласных или неизвестных фонем используем базовую оценку
            // Если форманты успешно извлечены (F1 и F2 не null), считаем произношение хорошим
            // Используем 0.85 вместо 0.7, так как успешное извлечение формант указывает на нормальное произношение
            val baseAccuracy = if (validatedF1 != null && validatedF2 != null) 0.85 else 0.7
            logger.debug { 
                "Phoneme '$expectedPhoneme': No expected formants (consonant/unknown) - accuracy set to $baseAccuracy " +
                "(formants extracted: F1=${validatedF1?.let { String.format("%.1f", it) } ?: "null"}, " +
                "F2=${validatedF2?.let { String.format("%.1f", it) } ?: "null"})"
            }
            return baseAccuracy
        }
        
        val expectedFormantsNonNull = expectedFormants // Smart cast после проверки на null
        
        // Исправляем возможную путаницу между F2 и F3
        // Если F2 слишком далек от ожидаемого, а F3 ближе - используем F3
        var actualF1 = validatedF1 ?: formants.f1 ?: 0.0
        var actualF2 = validatedF2 ?: formants.f2 ?: 0.0
        
        val f2Expected = expectedFormantsNonNull.second
        val f2DiffOriginal = abs(actualF2 - f2Expected)
        val f2DiffFromExpectedPercent = f2DiffOriginal / f2Expected
        
        // Получаем настройки фонемы из конфигурации
        val settings = phonemeConfig.getSettings(expectedPhoneme)
        
        // Для 'у', 'а', 'э', 'и', 'о', 'ы' используем более мягкую логику, так как они сильно зависят от контекста
        val phoneme = expectedPhoneme.lowercase()
        val isU = phoneme == "у"
        val isA = phoneme == "а"
        val isE = phoneme == "э" || phoneme == "е"
        val isI = phoneme == "и"
        val isO = phoneme == "о"
        val isY = phoneme == "ы"
        val isContextualVowel = isU || isA || isE || isI || isO || isY
        
        // Используем пороги из конфигурации, если они есть
        val f2F3CheckThresholdPercent = settings?.thresholds?.f2F3Check ?: 0.4
        
        // Если F2 отклоняется более чем на порог и есть F3, проверяем F3
        if (f2DiffFromExpectedPercent > f2F3CheckThresholdPercent && formants.f3 != null) {
            val f3Diff = abs(formants.f3 - f2Expected)
            val f3DiffPercent = f3Diff / f2Expected
            
            // Для контекстных гласных также используем более мягкий порог для F3 (используем тот же что и для F2/F3 check)
            val f3ThresholdPercent = f2F3CheckThresholdPercent
            
            // Если F3 ближе к ожидаемому F2 (и отклонение F3 < порог), используем F3
            if (f3Diff < f2DiffOriginal && f3DiffPercent < f3ThresholdPercent) {
                logger.info {
                    "Phoneme '$expectedPhoneme': F2=${actualF2.toInt()} Hz is far from expected ${f2Expected.toInt()} Hz, " +
                    "but F3=${formants.f3.toInt()} Hz is closer (diff=${f3Diff.toInt()} Hz vs ${f2DiffOriginal.toInt()} Hz). Using F3 as F2."
                }
                actualF2 = formants.f3
            } else {
                // Для контекстных гласных не считаем это критической ошибкой, если F2 в допустимом диапазоне
                val (isAcceptableRange, phonemeName, rangeStr) = if (settings != null) {
                    val acceptableF2 = settings.acceptableRange.f2
                    val inRange = actualF2 in acceptableF2.min..acceptableF2.max
                    Triple(inRange, phoneme, "[${acceptableF2.min}-${acceptableF2.max}]")
                } else {
                    Triple(false, phoneme, "")
                }
                if (isAcceptableRange) {
                    logger.debug {
                        "Phoneme '$phonemeName': F2=${actualF2.toInt()} Hz is within acceptable range $rangeStr Hz, " +
                        "even though it differs from expected ${f2Expected.toInt()} Hz. This is acceptable for '$phonemeName' in context."
                    }
                } else {
                    // Если ни F2, ни F3 не подходят, возможно проблема в сегменте
                    logger.warn {
                        "Phoneme '$expectedPhoneme': Both F2=${actualF2.toInt()} Hz and F3=${formants.f3.toInt()} Hz " +
                        "are far from expected F2=${f2Expected.toInt()} Hz. " +
                        "This might indicate wrong phoneme segment or poor audio quality."
                    }
                }
            }
        }
        
        // Проверяем, находятся ли форманты в допустимом диапазоне из конфигурации
        val f1InRange = settings?.acceptableRange?.f1?.let { actualF1 in it.min..it.max } ?: false
        val f2InRange = settings?.acceptableRange?.f2?.let { actualF2 in it.min..it.max } ?: false
        
        val f1Diff = abs(actualF1 - expectedFormantsNonNull.first)
        val f2Diff = abs(actualF2 - expectedFormantsNonNull.second)
        
        // Нормализуем отклонения с учетом естественных вариаций
        // Используем пороги из конфигурации
        val f1ThresholdPercent = settings?.thresholds?.f1 ?: 0.4
        val f2ThresholdPercent = settings?.thresholds?.f2 ?: 0.5
        val f1Threshold = expectedFormantsNonNull.first * f1ThresholdPercent
        val f2Threshold = expectedFormantsNonNull.second * f2ThresholdPercent
        
        // Если F2 сильно отличается (возможно это F3 вместо F2), применяем штраф
        // Используем порог штрафа из конфигурации
        val f2PenaltyThreshold = settings?.thresholds?.f2Penalty ?: 1.0
        val f2Penalty = if (f2Diff > expectedFormantsNonNull.second * f2PenaltyThreshold && !f2InRange) {
            // F2 отличается более чем на порог И не в допустимом диапазоне
            logger.warn { 
                "Phoneme '$expectedPhoneme': F2 difference is very large ($f2Diff Hz vs expected ${expectedFormantsNonNull.second} Hz). " +
                "This might be F3 or measurement error. Applying penalty."
            }
            0.5 // Штраф 50%
        } else {
            1.0
        }
        
        // Используем более мягкую функцию для расчета точности
        // Используем квадратичную функцию вместо линейной для более плавного снижения точности
        val f1EffectiveThreshold = max(f1Threshold, 350.0) // минимум 350Hz порог (увеличено)
        val f2EffectiveThreshold = max(f2Threshold, 600.0) // минимум 600Hz порог (увеличено)
        
        // Квадратичная функция (степень 2) дает более мягкое снижение точности
        // При отклонении в 50% от порога точность будет ~0.75, а не ~0.5
        // При отклонении в 70% точность будет ~0.5, а не ~0.3
        val f1NormalizedDiff = f1Diff / f1EffectiveThreshold
        val f1AccuracyRaw = if (f1NormalizedDiff <= 1.0) {
            1.0 - f1NormalizedDiff * f1NormalizedDiff * 0.7  // Квадратичная функция с коэффициентом 0.7
        } else {
            // Для больших отклонений используем более резкое снижение
            val excess = f1NormalizedDiff - 1.0
            max(0.0, 0.3 - excess * 0.15)
        }
        
        val f2NormalizedDiff = f2Diff / f2EffectiveThreshold
        val f2AccuracyRaw = if (f2NormalizedDiff <= 1.0) {
            1.0 - f2NormalizedDiff * f2NormalizedDiff * 0.7
        } else {
            val excess = f2NormalizedDiff - 1.0
            max(0.0, 0.3 - excess * 0.15)
        }
        
        // Если F1 в допустимом диапазоне, применяем минимальную точность из конфигурации
        val minAccuracyForRange = settings?.acceptableRange?.minAccuracy ?: 0.0
        val f1AccuracyAdjusted = if (f1InRange && minAccuracyForRange > 0.0) {
            max(f1AccuracyRaw, minAccuracyForRange)
        } else {
            f1AccuracyRaw
        }
        
        val f1Accuracy = f1AccuracyAdjusted.coerceIn(0.0, 1.0)
        val f2Accuracy = (f2AccuracyRaw * f2Penalty).coerceIn(0.0, 1.0)
        
        // Средняя точность с весом (F1 важнее для различения гласных)
        // Если обе форманты в допустимом диапазоне, применяем минимальную точность из конфигурации к итоговому результату
        val finalAccuracyRaw = (f1Accuracy * 0.6 + f2Accuracy * 0.4)
        val finalAccuracy = if (f1InRange && f2InRange && minAccuracyForRange > 0.0) {
            max(finalAccuracyRaw, minAccuracyForRange)
        } else {
            finalAccuracyRaw
        }.coerceIn(0.0, 1.0)
        
        logger.debug {
            "Phoneme '$expectedPhoneme' accuracy calculation: " +
            "F1_accuracy=${String.format("%.3f", f1Accuracy)} (diff=${String.format("%.1f", f1Diff)} Hz), " +
            "F2_accuracy=${String.format("%.3f", f2Accuracy)} (diff=${String.format("%.1f", f2Diff)} Hz), " +
            "final_accuracy=${String.format("%.3f", finalAccuracy)}"
        }
        
        return finalAccuracy
    }

    /**
     * Создает WAV файл из FloatArray с правильным заголовком
     */
    private fun createWavFile(audioData: FloatArray, sampleRate: Int): ByteArray {
        val numChannels = 1 // моно
        val bitsPerSample = 16
        val byteRate = sampleRate * numChannels * bitsPerSample / 8
        val blockAlign = numChannels * bitsPerSample / 8
        val dataSize = audioData.size * 2 // 2 bytes per sample
        val fileSize = 36 + dataSize // 36 bytes header + data
        
        val wavBytes = ByteArray(44 + dataSize) // 44 bytes WAV header + data
        val buffer = java.nio.ByteBuffer.wrap(wavBytes)
        buffer.order(java.nio.ByteOrder.LITTLE_ENDIAN)
        
        // RIFF header
        buffer.put("RIFF".toByteArray())
        buffer.putInt(fileSize)
        buffer.put("WAVE".toByteArray())
        
        // fmt chunk
        buffer.put("fmt ".toByteArray())
        buffer.putInt(16) // fmt chunk size
        buffer.putShort(1.toShort()) // audio format (1 = PCM)
        buffer.putShort(numChannels.toShort())
        buffer.putInt(sampleRate)
        buffer.putInt(byteRate)
        buffer.putShort(blockAlign.toShort())
        buffer.putShort(bitsPerSample.toShort())
        
        // data chunk
        buffer.put("data".toByteArray())
        buffer.putInt(dataSize)
        
        // PCM data
        audioData.forEach { sample ->
            val intSample = (sample * 32767.0f).toInt().coerceIn(-32768, 32767)
            buffer.putShort(intSample.toShort())
        }
        
        return wavBytes
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

