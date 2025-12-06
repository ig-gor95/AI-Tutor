import { useState, useEffect, useRef } from 'react';
import { Session, SessionResult, User } from '@/types';
import { AIAvatar } from './AIAvatar';
import { Mic, MicOff, Volume2, VolumeX, Clock, Target, Info, ArrowLeft, Send, Loader2, MessageSquare, X } from 'lucide-react';
import { startSessionResult, sendChatMessage, completeSession, getActiveSessionResult, getSessionResult } from '@/lib/chatApi';
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
  const [sessionResultId, setSessionResultId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const ttsRef = useRef<TextToSpeechAdvanced | null>(null);
  const speechToTextRef = useRef<SpeechToText | null>(null);
  const timeExpiredHandledRef = useRef(false);

  // НЕ восстанавливаем старую сессию - всегда начинаем новый разговор
  // Восстановление нужно только при перезагрузке страницы во время активной сессии
  // Для этого используем localStorage только для текущей активной сессии

  // Сохранение состояния сессии только для восстановления при перезагрузке страницы
  // во время активной сессии (не для продолжения старого разговора)
  useEffect(() => {
    if (sessionResultId && sessionStarted) {
      const sessionKey = `active_session_${session.id}`;
      localStorage.setItem(sessionKey, sessionResultId);
    }
  }, [sessionResultId, sessionStarted, session.id]);

  // Восстановление активной сессии только при перезагрузке страницы во время сессии
  useEffect(() => {
    const restoreActiveSession = async () => {
      try {
        const sessionKey = `active_session_${session.id}`;
        const activeSessionResultId = localStorage.getItem(sessionKey);
        
        if (activeSessionResultId) {
          try {
            // Проверяем, существует ли эта сессия и не завершена ли она
            const result = await getSessionResult(activeSessionResultId);
            
            // Восстанавливаем только если сессия не завершена
            if (!result.completedAt) {
              setSessionResultId(result.id);
              setTranscript(result.transcript || []);
              setTimeElapsed(0); // Таймер всегда сбрасывается
              setSessionStarted(true);
              setShowInfo(false);
              
              // Инициализируем TTS и STT
              ttsRef.current = new TextToSpeechAdvanced({
                provider: 'yandex',
                language: session.params.language || 'ru',
                speed: 1.0
              });
              
              speechToTextRef.current = new SpeechToText(session.params.language || 'ru');
            } else {
              // Сессия завершена, очищаем
              localStorage.removeItem(sessionKey);
            }
          } catch (error) {
            console.error('Failed to restore active session:', error);
            localStorage.removeItem(sessionKey);
          }
        }
      } catch (error) {
        console.error('Error restoring active session:', error);
      }
    };
    
    restoreActiveSession();
  }, [session.id, session.params.language]);

  // Открываем чат на десктопе по умолчанию
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowChat(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Таймер сессии
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStarted) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          // Проверяем, не истекло ли время сессии
          const durationSeconds = session.params.duration * 60;
          if (newTime >= durationSeconds && !timeExpiredHandledRef.current) {
            // Время истекло, завершаем сессию только один раз
            timeExpiredHandledRef.current = true;
            handleTimeExpired();
            return durationSeconds;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, session.params.duration]);

  // Инициализация TTS
  useEffect(() => {
    if (sessionStarted) {
      ttsRef.current = new TextToSpeechAdvanced({
        provider: 'yandex',
        language: session.params.language || 'ru',
        speed: 1.0
      });
      
      speechToTextRef.current = new SpeechToText(session.params.language || 'ru');
    }
    
    return () => {
      ttsRef.current?.stop();
      speechToTextRef.current?.stop();
    };
  }, [sessionStarted, session.params.language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startSession = async () => {
    try {
      setIsProcessing(true);
      // Сбрасываем флаг обработки истечения времени
      timeExpiredHandledRef.current = false;
      
      // Очищаем старую активную сессию из localStorage перед началом новой
      const oldSessionKey = `active_session_${session.id}`;
      localStorage.removeItem(oldSessionKey);
      
      // Запускаем сессию на бэкенде (всегда создается новая сессия)
      const result = await startSessionResult(session.id, {
        studentId: user?.id,
        studentName: user?.name
      });
      
      setSessionResultId(result.id);
      setTimeElapsed(0); // Сбрасываем таймер при начале новой сессии
      setSessionStarted(true);
      setShowInfo(false);
      if (window.innerWidth < 768) {
        setShowChat(false);
      }
      
      // Получаем приветствие от AI
      // Используем обычный запрос, бэкенд обработает специальное сообщение
      const greetingResponse = await sendChatMessage({
        message: '__GREETING__',
        sessionResultId: result.id
      });
      const greeting = greetingResponse.message;
      setIsSpeaking(true);
      setTranscript([{
        role: 'ai',
        message: greeting,
        timestamp: new Date().toISOString()
      }]);
      
      // Озвучиваем приветствие
      if (!isMuted && ttsRef.current) {
        await ttsRef.current.speak(greeting, () => {
          setIsSpeaking(false);
          setIsProcessing(false);
        }, () => {
          setIsSpeaking(true);
        });
      } else {
        setTimeout(() => {
          setIsSpeaking(false);
          setIsProcessing(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Ошибка начала сессии. Попробуйте еще раз.');
      setIsProcessing(false);
    }
  };

  const generateGreeting = () => {
    const { params } = session;
    const greetings = {
      friendly: `Привет! Я твой AI-тьютор. Рад помочь тебе изучить "${params.topic}". Готов начать?`,
      professional: `Здравствуйте. Я готов провести занятие по теме "${params.topic}". Приступим к обучению.`,
      motivating: `Отлично! Сегодня мы освоим "${params.topic}". Уверен, у тебя всё получится! Поехали!`
    };
    return greetings[params.personality];
  };

  const toggleListening = () => {
    if (!isMuted && !isProcessing && sessionResultId) {
      if (!isListening) {
        setIsListening(true);
        speechToTextRef.current?.start(
          (text) => {
            setIsListening(false);
            if (text.trim()) {
              addMessage('user', text);
              respondToUser(text);
            }
          },
          (error) => {
            console.error('Speech recognition error:', error);
            setIsListening(false);
            alert(error.message || 'Ошибка распознавания речи');
          }
        );
      } else {
        setIsListening(false);
        speechToTextRef.current?.stop();
      }
    }
  };

  const handleSendText = () => {
    if (textInput.trim() && !isProcessing) {
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
    setCurrentAiMessage('');
    
    try {
      // Отправляем сообщение и получаем ответ с стримингом
      const response = await sendChatMessage({
        message: userMessage,
        sessionResultId
      });
      
      const aiResponse = response.message;
      
      // Симулируем стриминг - показываем ответ по частям
      await streamMessage(aiResponse);
      
      // Озвучиваем ответ
      if (!isMuted && ttsRef.current) {
        setIsSpeaking(true);
        await ttsRef.current.speak(aiResponse, () => {
          setIsSpeaking(false);
          setIsProcessing(false);
        }, () => {
          setIsSpeaking(true);
        });
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      alert('Ошибка получения ответа. Попробуйте еще раз.');
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  // Симуляция стриминга - показываем сообщение по частям
  const streamMessage = async (message: string): Promise<void> => {
    return new Promise((resolve) => {
      const words = message.split(' ');
      let currentText = '';
      let wordIndex = 0;
      
      const addWord = () => {
        if (wordIndex < words.length) {
          currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
          setCurrentAiMessage(currentText);
          
          // Обновляем последнее сообщение AI в транскрипте
          setTranscript(prev => {
            const newTranscript = [...prev];
            const lastIndex = newTranscript.length - 1;
            if (lastIndex >= 0 && newTranscript[lastIndex].role === 'ai') {
              newTranscript[lastIndex] = {
                ...newTranscript[lastIndex],
                message: currentText
              };
            } else {
              newTranscript.push({
                role: 'ai',
                message: currentText,
                timestamp: new Date().toISOString()
              });
            }
            return newTranscript;
          });
          
          wordIndex++;
          setTimeout(addWord, 50); // Задержка между словами для эффекта стриминга
        } else {
          setCurrentAiMessage('');
          resolve();
        }
      };
      
      addWord();
    });
  };

  // Обработка истечения времени сессии
  const handleTimeExpired = async () => {
    if (!sessionResultId || timeExpiredHandledRef.current) return;
    
    // Устанавливаем флаг, чтобы предотвратить повторные вызовы
    timeExpiredHandledRef.current = true;
    
    try {
      setIsProcessing(true);
      // Отправляем специальное сообщение о истечении времени
      const response = await sendChatMessage({
        message: '__TIME_EXPIRED__',
        sessionResultId
      });
      
      const timeExpiredMessage = response.message;
      addMessage('ai', timeExpiredMessage);
      
      // Озвучиваем сообщение о завершении
      if (!isMuted && ttsRef.current) {
        setIsSpeaking(true);
        await ttsRef.current.speak(timeExpiredMessage, () => {
          setIsSpeaking(false);
          // Завершаем сессию после озвучки
          endSession();
        });
      } else {
        // Завершаем сессию сразу, если TTS отключен
        setTimeout(() => endSession(), 1000);
      }
    } catch (error) {
      console.error('Failed to handle time expired:', error);
      // Завершаем сессию даже при ошибке
      endSession();
    }
  };

  const endSession = async () => {
    if (!sessionResultId) return;
    
    try {
      setIsProcessing(true);
      // Завершаем сессию на бэкенде
      const result = await completeSession(sessionResultId);
      
      // Обновляем транскрипт с финальным результатом
      setTranscript(result.result.transcript);
      
      // Очищаем сохраненное состояние активной сессии
      const sessionKey = `active_session_${session.id}`;
      localStorage.removeItem(sessionKey);
      
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Ошибка завершения сессии');
      
      // Очищаем состояние даже при ошибке
      const sessionKey = `active_session_${session.id}`;
      localStorage.removeItem(sessionKey);
      
      onComplete?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((timeElapsed / (session.params.duration * 60)) * 100, 100);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onBack || (() => window.history.back())}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Вернуться в кабинет"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base text-gray-900 truncate">{session.params.topic}</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">с {session.organizerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {sessionStarted && (
              <>
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-50 rounded-lg">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="text-xs sm:text-sm text-blue-900">{formatTime(timeElapsed)}</span>
                  <span className="text-[10px] sm:text-sm text-blue-600">/ {session.params.duration} мин</span>
                </div>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors relative ${showChat ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                  title={showChat ? 'Скрыть чат' : 'Показать чат'}
                >
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  {!showChat && transcript.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
                      {transcript.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={endSession}
                  className="md:hidden px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                  title="Завершить сессию"
                >
                  Завершить
                </button>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`hidden sm:block p-2 rounded-lg transition-colors ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
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

      {/* Main Content - Flex container with fixed proportions */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* AI Avatar - Fixed size container */}
        <div className="flex-1 relative flex flex-col min-h-0">
          {/* Avatar container - FIXED HEIGHT */}
          <div className="absolute inset-0 overflow-hidden">
            <AIAvatar isListening={isListening} isSpeaking={isSpeaking} />
          </div>
          
          {/* Mobile Start Session Button */}
          {!sessionStarted && (
            <div className="md:hidden absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 p-4 z-10">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                <div className="text-center mb-6">
                  <h3 className="text-lg text-gray-900 mb-2">Готовы начать?</h3>
                  <p className="text-sm text-gray-600">{session.params.topic}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-900">Уровень</span>
                    <span className="text-xs text-blue-700">
                      {session.params.difficulty === 'beginner' ? 'Начальный' :
                       session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-xs text-purple-900">Длительность</span>
                    <span className="text-xs text-purple-700">{session.params.duration} мин</span>
                  </div>
                </div>

                <button
                  onClick={startSession}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Начать обучение
                </button>

                {!user && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      Вы не авторизованы. Результаты будут отправлены организатору.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Status indicator overlay */}
          {sessionStarted && (
            <div className="absolute bottom-24 sm:bottom-28 left-1/2 transform -translate-x-1/2 z-20">
              {isListening && (
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse text-xs sm:text-sm">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping" />
                  <span>Слушаю вас...</span>
                </div>
              )}
              {isProcessing && !isListening && (
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full shadow-lg flex items-center gap-2 text-xs sm:text-sm">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  <span>Обрабатываю...</span>
                </div>
              )}
              {isSpeaking && !isListening && !isProcessing && (
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-full shadow-lg flex items-center gap-2 animate-pulse text-xs sm:text-sm">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping" />
                  <span>Говорю...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {sessionStarted && showChat && (
          <div className="absolute bottom-0 left-0 right-0 md:relative md:inset-auto md:w-96 bg-white md:border-l border-gray-200 flex flex-col z-30 md:h-auto h-[50vh] rounded-t-3xl md:rounded-none shadow-2xl md:shadow-none">
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm sm:text-base text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  Чат с AI-тьютором
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Говорите голосом или пишите текстом
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-0">
              {transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${msg.role === 'ai' ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900'}`}>
                    <p className="text-[10px] sm:text-xs mb-1 opacity-70">
                      {msg.role === 'ai' ? '🤖 AI-тьютор' : '👤 Вы'}
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-[10px] sm:text-xs opacity-50 mt-1">
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
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      <span className="text-xs sm:text-sm">AI печатает...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  disabled={isProcessing}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendText}
                  disabled={!textInput.trim() || isProcessing}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2 text-center">
                Enter для отправки
              </p>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {showInfo && (
          <div className="hidden md:block w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex-shrink-0">
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

      {/* Voice Controls - FIXED at bottom */}
      {sessionStarted && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 shadow-lg z-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 sm:p-4 rounded-full transition-all ${isMuted ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title={isMuted ? 'Включить звук' : 'Выключить звук'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" /> : <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" />}
              </button>

              <div className="relative">
                <button
                  onClick={toggleListening}
                  disabled={isMuted || isProcessing}
                  className={`p-5 sm:p-8 rounded-full transition-all shadow-lg ${isListening ? 'bg-red-500 text-white hover:bg-red-600 scale-110 animate-pulse' : isMuted || isProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'}`}
                  title={isListening ? 'Остановить запись' : isMuted ? 'Включите звук' : isProcessing ? 'Подождите ответа' : 'Нажмите и говорите'}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6 sm:w-8 sm:h-8" />
                  ) : (
                    <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
                  )}
                </button>
                
                {isListening && (
                  <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>

              <div className="hidden sm:block min-w-[200px] text-center">
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
