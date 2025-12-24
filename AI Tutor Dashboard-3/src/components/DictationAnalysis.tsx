import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, BarChart3, Volume2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { analyzeDictation, DictationAnalysisResponse, WordAnalysis, PhonemeAnalysis } from '@/lib/dictationApi';
import { SpeechToText } from '@/lib/speechToText';

// Lazy load Chart.js to avoid blocking render
let ChartJS: any = null;
let Line: any = null;

const loadChartJS = async () => {
  if (!ChartJS) {
    const chartModule = await import('chart.js');
    const reactChartModule = await import('react-chartjs-2');
    ChartJS = chartModule.Chart || chartModule.default?.Chart;
    Line = reactChartModule.Line || reactChartModule.default?.Line;
    
    if (ChartJS) {
      ChartJS.register(
        chartModule.CategoryScale || chartModule.default?.CategoryScale,
        chartModule.LinearScale || chartModule.default?.LinearScale,
        chartModule.PointElement || chartModule.default?.PointElement,
        chartModule.LineElement || chartModule.default?.LineElement,
        chartModule.Title || chartModule.default?.Title,
        chartModule.Tooltip || chartModule.default?.Tooltip,
        chartModule.Legend || chartModule.default?.Legend,
        chartModule.Filler || chartModule.default?.Filler
      );
    }
  }
  return { ChartJS, Line };
};

interface DictationAnalysisProps {
  onBack?: () => void;
}

export function DictationAnalysis({ onBack }: DictationAnalysisProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [analysis, setAnalysis] = useState<DictationAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechToTextRef = useRef<SpeechToText | null>(null);

  // Очистка URL при размонтировании
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];
      setTranscribedText(''); // Сбрасываем предыдущий текст

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Останавливаем все треки потока
        stream.getTracks().forEach(track => track.stop());

        // Останавливаем распознавание речи
        if (speechToTextRef.current) {
          speechToTextRef.current.stop();
        }

        // Автоматически запускаем анализ после остановки записи
        await analyzeRecording(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setAnalysis(null);

      // Запускаем распознавание речи параллельно с записью
      try {
        if (!speechToTextRef.current) {
          speechToTextRef.current = new SpeechToText('ru');
        }

        speechToTextRef.current.start(
          (text) => {
            console.log('Transcribed:', text);
            setTranscribedText(text);
          },
          (error) => {
            console.warn('Speech recognition error:', error);
            // Не показываем ошибку пользователю, так как это не критично
          }
        );
      } catch (speechErr) {
        console.warn('Failed to start speech recognition:', speechErr);
        // Продолжаем запись даже если распознавание не удалось
      }
    } catch (err) {
      setError('Не удалось получить доступ к микрофону');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Конвертация WebM в WAV
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    try {
      console.log('[WebM→WAV] Starting conversion. WebM blob size:', webmBlob.size, 'bytes');

      const arrayBuffer = await webmBlob.arrayBuffer();
      console.log('[WebM→WAV] ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[WebM→WAV] AudioContext created. Sample rate:', audioContext.sampleRate);

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('[WebM→WAV] AudioBuffer decoded:', {
        duration: audioBuffer.duration,
        length: audioBuffer.length,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });

      // Проверяем, есть ли данные в буфере
      const channelData = audioBuffer.getChannelData(0);

      // Используем reduce вместо spread operator для избежания stack overflow
      let nonZeroCount = 0;
      let maxAmplitude = 0;
      for (let i = 0; i < channelData.length; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > 0.0001) nonZeroCount++;
        if (absValue > maxAmplitude) maxAmplitude = absValue;
      }

      console.log('[WebM→WAV] Channel data analysis:', {
        totalSamples: channelData.length,
        nonZeroSamples: nonZeroCount,
        maxAmplitude: maxAmplitude,
        first10Samples: Array.from(channelData.slice(0, 10))
      });

      if (maxAmplitude < 0.0001) {
        throw new Error('Аудио буфер содержит только тишину. Проверьте, работает ли микрофон.');
      }

      // Конвертируем AudioBuffer в WAV
      const wav = audioBufferToWav(audioBuffer);
      console.log('[WebM→WAV] WAV created. Size:', wav.byteLength, 'bytes');

      return new Blob([wav], { type: 'audio/wav' });
    } catch (error) {
      console.error('[WebM→WAV] Error converting WebM to WAV:', error);
      throw new Error('Не удалось конвертировать аудио в WAV формат: ' + (error as Error).message);
    }
  };

  // Функция для конвертации AudioBuffer в WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    console.log('[audioBufferToWav] Creating WAV file:', {
      length,
      numberOfChannels,
      sampleRate,
      dataSize,
      bufferSize
    });

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV заголовок
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Записываем аудио данные
    let offset = 44;
    let writtenNonZeroSamples = 0;
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16Sample, true);

        if (Math.abs(int16Sample) > 10) writtenNonZeroSamples++;

        // Логируем первые 10 сэмплов
        if (i < 10 && channel === 0) {
          console.log(`[audioBufferToWav] Sample ${i}: float=${sample.toFixed(6)}, int16=${int16Sample}`);
        }

        offset += 2;
      }
    }

    console.log('[audioBufferToWav] WAV data written:', {
      totalSamples: length,
      writtenNonZeroSamples,
      firstSample: channelData[0],
      maxSample: Math.max(...Array.from(channelData.slice(0, 1000)).map(Math.abs))
    });

    return arrayBuffer;
  };

  // Новая функция для автоматического анализа после записи
  const analyzeRecording = async (blob: Blob) => {
    setIsAnalyzing(true);
    setIsTranscribing(true);
    setError(null);

    try {
      let file: File;
      const isWebm = blob.type.includes('webm');

      if (isWebm) {
        // Конвертируем WebM в WAV
        const wavBlob = await convertWebmToWav(blob);
        file = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
      } else {
        // Используем исходный файл
        file = new File([blob], 'recording.wav', { type: blob.type });
      }

      // Отправляем пустую строку как expectedText - backend сам сделает транскрибацию
      const result = await analyzeDictation(file, '', 'ru');
      setAnalysis(result);
      setIsTranscribing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при анализе');
      console.error('Analysis error:', err);
      setIsTranscribing(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 0.8) return 'text-green-600 bg-green-50';
    if (accuracy >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPhonemeColor = (phoneme: PhonemeAnalysis): string => {
    if (phoneme.accuracy >= 0.8) return 'text-green-600';
    if (phoneme.accuracy >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderTextWithHighlights = () => {
    if (!analysis) return null;

    const words = analysis.words;

    return (
      <div className="text-2xl font-medium leading-relaxed">
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block mr-2 mb-2">
            <span
              className={`px-2 py-1 rounded ${
                word.overallAccuracy >= 0.8
                  ? 'bg-green-100 text-green-800'
                  : word.overallAccuracy >= 0.6
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {word.phonemes.map((phoneme, phonemeIdx) => (
                <span
                  key={phonemeIdx}
                  className={getPhonemeColor(phoneme)}
                  title={`Точность: ${(phoneme.accuracy * 100).toFixed(0)}%${phoneme.issues.length > 0 ? `\nПроблемы: ${phoneme.issues.join(', ')}` : ''}`}
                >
                  {phoneme.phoneme}
                </span>
              ))}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    loadChartJS().then(() => setChartLoaded(true)).catch(() => {
      console.warn('Chart.js failed to load, graph will not be displayed');
    });
  }, []);

  const renderIntonationChart = () => {
    if (!analysis || analysis.intonation.pitchContour.length === 0) return null;
    if (!chartLoaded || !Line) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Загрузка графика...
        </div>
      );
    }

    const data = {
      labels: analysis.intonation.pitchContour.map((_, i) => i.toString()),
      datasets: [
        {
          label: 'Высота тона (Hz)',
          data: analysis.intonation.pitchContour,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: 'Контур интонации',
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Частота (Hz)',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Время',
          },
        },
      },
    };

    return <Line data={data} options={options} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Анализ дикции</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Назад
              </button>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Нажмите кнопку записи, чтобы начать. После остановки записи автоматически выполнится транскрибация и анализ дикции.
            </p>
          </div>

          {/* Запись */}
          <div className="mb-6 flex items-center gap-4 flex-wrap">
            {!isRecording && !isAnalyzing ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors shadow-lg font-semibold text-base"
                style={{
                  backgroundColor: '#ef4444',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                <Mic className="w-5 h-5" />
                <span>Начать запись</span>
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors shadow-lg font-semibold text-base animate-pulse"
                style={{
                  backgroundColor: '#ef4444',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Square className="w-5 h-5" />
                <span>Остановить запись</span>
              </button>
            ) : null}

            {audioUrl && !isAnalyzing && (
              <div className="flex items-center gap-2">
                <audio controls src={audioUrl} className="h-10" />
              </div>
            )}

            {isTranscribing && (
              <div className="flex items-center gap-2 text-purple-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <span>Транскрибация аудио...</span>
              </div>
            )}

            {isAnalyzing && !isTranscribing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Анализ дикции...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Результаты анализа */}
          {analysis && (
            <div className="space-y-6">
              {/* Транскрибированный текст */}
              {analysis.transcribedText && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">Распознанный текст:</h3>
                  <p className="text-xl text-gray-800 font-medium">{analysis.transcribedText}</p>
                </div>
              )}

              {/* Общая точность */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Общая точность</h2>
                    <div className="text-4xl font-bold text-gray-900">
                      {(analysis.overallAccuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className={`text-6xl ${getAccuracyColor(analysis.overallAccuracy).split(' ')[0]}`}>
                    {analysis.overallAccuracy >= 0.8 ? (
                      <CheckCircle2 className="w-16 h-16" />
                    ) : (
                      <AlertCircle className="w-16 h-16" />
                    )}
                  </div>
                </div>
              </div>

              {/* Визуализация текста с подсветкой */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Визуализация произношения</h3>
                {renderTextWithHighlights()}
                <div className="mt-4 flex gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Хорошо (≥80%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span>Средне (60-80%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span>Плохо (&lt;60%)</span>
                  </div>
                </div>
              </div>

              {/* График интонации */}
              {analysis.intonation.pitchContour.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Анализ интонации</h3>
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Средняя высота</div>
                      <div className="text-lg font-semibold">{analysis.intonation.averagePitch.toFixed(1)} Hz</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Диапазон</div>
                      <div className="text-lg font-semibold">{analysis.intonation.pitchRange.toFixed(1)} Hz</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Вариация</div>
                      <div className="text-lg font-semibold">{analysis.intonation.pitchVariation.toFixed(1)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Монотонность</div>
                      <div className="text-lg font-semibold">{(analysis.intonation.monotonyScore * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="h-64">{renderIntonationChart()}</div>
                </div>
              )}

              {/* Анализ тембра */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Анализ тембра</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Спектральный центроид</div>
                    <div className="text-lg font-semibold">{analysis.timbre.spectralCentroid.toFixed(1)} Hz</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Спектральный роллофф</div>
                    <div className="text-lg font-semibold">{analysis.timbre.spectralRolloff.toFixed(1)} Hz</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Zero Crossing Rate</div>
                    <div className="text-lg font-semibold">{analysis.timbre.zeroCrossingRate.toFixed(3)}</div>
                  </div>
                  {analysis.timbre.harmonicity && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Гармоничность</div>
                      <div className="text-lg font-semibold">{(analysis.timbre.harmonicity * 100).toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Анализ артикуляции */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Анализ артикуляции</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Ясность</div>
                    <div className="text-lg font-semibold">{(analysis.articulation.clarity * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Точность согласных</div>
                    <div className="text-lg font-semibold">{(analysis.articulation.consonantAccuracy * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Точность гласных</div>
                    <div className="text-lg font-semibold">{(analysis.articulation.vowelAccuracy * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Плавность переходов</div>
                    <div className="text-lg font-semibold">{(analysis.articulation.transitionSmoothness * 100).toFixed(0)}%</div>
                  </div>
                </div>
                {analysis.articulation.issues.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Проблемы:</div>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {analysis.articulation.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Рекомендации */}
              {analysis.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Рекомендации
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-blue-800">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Детальный анализ по словам */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Детальный анализ по словам</h3>
                <div className="space-y-4">
                  {analysis.words.map((word, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">{word.word}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccuracyColor(word.overallAccuracy)}`}>
                          {(word.overallAccuracy * 100).toFixed(0)}%
                        </span>
                      </div>
                      {word.issues.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          {word.issues.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

