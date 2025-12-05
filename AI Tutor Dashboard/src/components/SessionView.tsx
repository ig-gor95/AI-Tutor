import { useState, useEffect, useRef } from 'react';
import { Session, SessionResult, User } from '@/types';
import { AIAvatar } from './AIAvatar';
import { Mic, MicOff, Volume2, VolumeX, Clock, Target, Info, ArrowLeft, Send, Loader2, MessageSquare } from 'lucide-react';
import { startSessionResult, sendChatMessage, completeSession, generateGreeting } from '@/lib/chatApi';
import { TextToSpeechAdvanced, TTSProvider } from '@/lib/textToSpeechAdvanced';
import { SpeechToText } from '@/lib/speechToText';

interface Props {
  session: Session;
  user: User | null;
  onComplete?: () => void;
  onBack?: () => void;
}

export function SessionView({ session, user, onComplete, onBack }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<SessionResult['transcript']>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [sessionResultId, setSessionResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const ttsRef = useRef<TextToSpeechAdvanced | null>(null);
  const sttRef = useRef<SpeechToText | null>(null);
  const [ttsProvider, setTTSProvider] = useState<TTSProvider>('yandex'); // yandex (лучше), openai, browser

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Initialize TTS and STT
  useEffect(() => {
    const lang = session.params.language === 'en' ? 'en' : 'ru';
    
    // Используем Yandex TTS для лучшего качества русского языка
    ttsRef.current = new TextToSpeechAdvanced({
      provider: ttsProvider,
      language: lang,
      voice: lang === 'ru' ? 'jane' : 'alloy', // jane - лучший женский голос Yandex для русского
      speed: 1.15, // Немного ускоренная речь для более динамичного диалога
      volume: 1.0
    });
    
    sttRef.current = new SpeechToText(lang);
    
    return () => {
      ttsRef.current?.stop();
      sttRef.current?.stop();
    };
  }, [session.params.language, ttsProvider]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startSession = async () => {
    try {
      setIsProcessing(true);
      
      // Start session on backend
      const result = await startSessionResult(session.id!, {
        studentId: user?.id,
        studentName: user?.name || 'Гость'
      });
      
      setSessionResultId(result.id!);
      setSessionStarted(true);
      setShowInfo(false);
      setShowChat(true);
      
      // Get AI greeting from backend (generated through AI)
      try {
        const greetingResponse = await generateGreeting(result.id!);
        const greeting = greetingResponse.message;
        addMessage('ai', greeting);
        
        // Speak greeting
        if (!isMuted) {
          setIsSpeaking(true);
          ttsRef.current?.speak(greeting, () => {
            setIsSpeaking(false);
          }, () => {
            setIsSpeaking(true);
          }).catch((error) => {
            console.error('TTS error:', error);
            setIsSpeaking(false);
          });
        }
      } catch (error) {
        console.error('Failed to generate greeting:', error);
        // Fallback to static greeting
        const fallbackGreeting = generateGreetingStatic();
        addMessage('ai', fallbackGreeting);
        
        if (!isMuted) {
          setIsSpeaking(true);
          ttsRef.current?.speak(fallbackGreeting, () => {
            setIsSpeaking(false);
          }, () => {
            setIsSpeaking(true);
          }).catch((error) => {
            console.error('TTS error:', error);
            setIsSpeaking(false);
          });
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to start session:', error);
      setError((error as Error).message);
      setIsProcessing(false);
      alert('Ошибка запуска сессии: ' + (error as Error).message);
    }
  };

  // Fallback static greeting (used if AI generation fails)
  const generateGreetingStatic = () => {
    const { params } = session;
    const greetings = {
      friendly: `Привет! Я твой AI-тьютор. Сегодня мы изучим "${params.topic}". Давай начнем с основ!`,
      professional: `Здравствуйте. Я готова провести занятие по теме "${params.topic}". Начнем с ключевых концепций.`,
      motivating: `Отлично! Сегодня мы освоим "${params.topic}". Уверена, у тебя всё получится! Начинаем прямо сейчас!`
    };
    return greetings[params.personality];
  };

  const toggleListening = () => {
    if (isMuted || isProcessing || !sessionResultId) return;
    
    if (!isListening) {
      // Start listening
      setIsListening(true);
      sttRef.current?.start(
        (text) => {
          // Speech recognized
          setIsListening(false);
          addMessage('user', text);
          respondToUser(text);
        },
        (error) => {
          // Error
          setIsListening(false);
          console.error('Speech recognition error:', error);
          alert(error.message || 'Ошибка распознавания речи');
        }
      );
    } else {
      // Stop listening
      setIsListening(false);
      sttRef.current?.stop();
    }
  };

  const handleSendText = () => {
    if (textInput.trim() && !isProcessing && sessionResultId) {
      const message = textInput.trim();
      setTextInput('');
      addMessage('user', message);
      respondToUser(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const addMessage = (role: 'ai' | 'user', message: string) => {
    setTranscript(prev => [...prev, {
      role,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  const respondToUser = async (userMessage: string) => {
    if (!sessionResultId) return;
    
    setIsProcessing(true);
    
    try {
      // Send message to backend
      const response = await sendChatMessage({
        message: userMessage,
        sessionResultId: sessionResultId
      });
      
      // Add AI response to transcript
      addMessage('ai', response.message);
      
      // Speak response if not muted
      if (!isMuted) {
        setIsSpeaking(true);
        ttsRef.current?.speak(response.message, () => {
          setIsSpeaking(false);
        }, () => {
          setIsSpeaking(true);
        }).catch((error) => {
          console.error('TTS error:', error);
          setIsSpeaking(false);
        });
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError((error as Error).message);
      setIsProcessing(false);
      alert('Ошибка отправки сообщения: ' + (error as Error).message);
    }
  };

  const endSession = async () => {
    if (!sessionResultId) {
      onComplete?.();
      return;
    }
    
    setIsProcessing(true);
    ttsRef.current?.stop();
    sttRef.current?.stop();
    
    try {
      // Complete session and get feedback
      const result = await completeSession(sessionResultId);
      
      // Show results
      alert(`Сессия завершена!\n\nОценка: ${result.score}/100\n\n${result.summary}`);
      
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Ошибка завершения сессии: ' + (error as Error).message);
      onComplete?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((timeElapsed / (session.params.duration * 60)) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Вернуться в кабинет"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-gray-900">{session.params.topic}</h2>
              <p className="text-sm text-gray-600">с {session.organizerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {sessionStarted && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">{formatTime(timeElapsed)}</span>
                  <span className="text-sm text-blue-600">/ {session.params.duration} мин</span>
                </div>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-2 rounded-lg transition-colors ${
                    showChat 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={showChat ? 'Скрыть чат' : 'Показать чат'}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-2 rounded-lg transition-colors ${
                    showInfo 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={showInfo ? 'Скрыть информацию' : 'Показать информацию'}
                >
                  <Info className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
        {sessionStarted && (
          <div className="max-w-7xl mx-auto mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Avatar */}
        <div className="flex-1 relative">
          <AIAvatar isListening={isListening} isSpeaking={isSpeaking} />
          
          {/* Status indicator overlay */}
          {sessionStarted && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              {isListening && (
                <div className="px-6 py-3 bg-red-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                  <span>Слушаю вас...</span>
                </div>
              )}
              {isProcessing && !isListening && (
                <div className="px-6 py-3 bg-blue-500 text-white rounded-full shadow-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Обрабатываю...</span>
                </div>
              )}
              {isSpeaking && !isListening && !isProcessing && (
                <div className="px-6 py-3 bg-green-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                  <span>Говорю...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {sessionStarted && showChat && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Чат с AI-тьютором
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Говорите голосом или пишите текстом
              </p>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'ai'
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-xs mb-1 opacity-70">
                      {msg.role === 'ai' ? '🤖 AI-тьютор' : '👤 Вы'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI печатает...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Text Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendText}
                  disabled={!textInput.trim() || isProcessing}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter для отправки
              </p>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {showInfo && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            {!sessionStarted ? (
              <div>
                <h3 className="text-gray-900 mb-4">Информация о сессии</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">Уровень сложности</p>
                    <p className="text-blue-700">
                      {session.params.difficulty === 'beginner' ? 'Начальный' :
                       session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900 mb-2">Длительность</p>
                    <p className="text-purple-700">{session.params.duration} минут</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900 mb-2">Характер AI</p>
                    <p className="text-green-700">
                      {session.params.personality === 'friendly' ? 'Дружелюбный' :
                       session.params.personality === 'professional' ? 'Профессиональный' : 'Мотивирующий'}
                    </p>
                  </div>
                </div>

                {session.params.goals.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-gray-700" />
                      <h4 className="text-gray-900">Цели обучения</h4>
                    </div>
                    <ul className="space-y-2">
                      {session.params.goals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={startSession}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Начать обучение
                </button>

                {!user && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      Вы не авторизованы. Результаты будут отправлены организатору, 
                      но не сохранятся в вашем профиле.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-gray-900 mb-4">Управление</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 mb-2">Статус</p>
                    <p className="text-blue-700">
                      {isListening ? '🎤 Слушаю' : 
                       isSpeaking ? '🗣️ Говорю' : 
                       isProcessing ? '⚙️ Обрабатываю' : '✅ Готов'}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900 mb-2">Сообщений</p>
                    <p className="text-purple-700">{transcript.length}</p>
                  </div>
                </div>

                <button
                  onClick={endSession}
                  className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Завершить сессию
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice Controls */}
      {sessionStarted && (
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center gap-4">
              {/* Mute button */}
              <button
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  if (newMuted) {
                    // Stop speaking when muted
                    ttsRef.current?.stop();
                    setIsSpeaking(false);
                  }
                }}
                className={`p-4 rounded-full transition-all ${
                  isMuted
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>

              {/* Microphone button */}
              <div className="relative">
                <button
                  onClick={toggleListening}
                  disabled={isMuted || isProcessing}
                  className={`p-8 rounded-full transition-all shadow-lg ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600 scale-110 animate-pulse'
                      : isMuted || isProcessing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
                  }`}
                  title={
                    isListening ? 'Остановить запись' : 
                    isMuted ? 'Включите звук' :
                    isProcessing ? 'Подождите ответа' :
                    'Нажмите и говорите'
                  }
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
                
                {/* Recording indicator */}
                {isListening && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>

              {/* Status text */}
              <div className="min-w-[200px] text-center">
                <p className="text-sm text-gray-700">
                  {isListening ? (
                    <span className="text-red-600">🔴 Запись...</span>
                  ) : isMuted ? (
                    <span className="text-gray-500">🔇 Микрофон выключен</span>
                  ) : isProcessing ? (
                    <span className="text-blue-600">⏳ Обрабатываю ответ...</span>
                  ) : (
                    <span className="text-gray-600">🎤 Нажмите для голосового ввода</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  или используйте текстовый чат
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}