import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { AIAvatar } from './AIAvatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  sessionData: any;
  onComplete: (results: any) => void;
}

const aiGreetings = [
  'Привет! Я BigBrother — твой AI-помощник. Готов помочь тебе учиться и развиваться. О чём поговорим?',
  'Здравствуй! Рад видеть тебя снова. Чем я могу помочь сегодня?',
  'Приветствую! Я здесь, чтобы поддержать тебя в обучении. Начнём?'
];

export function ChatScreen({ sessionData, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: aiGreetings[Math.floor(Math.random() * aiGreetings.length)],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response with typing indicator
    setTimeout(() => {
      const aiResponses = [
        'Отличный вопрос! Давай разберём это подробнее. Для начала нужно понять основные концепции...',
        'Я вижу, что ты на правильном пути! Позволь мне дать тебе несколько подсказок и объяснений.',
        'Хороший подход к решению задачи. Давай вместе проанализируем все варианты.',
        'Понимаю твою мысль. Давай уточним детали и найдём оптимальное решение.',
        'Интересная идея! Я могу помочь тебе развить её дальше. Что если мы посмотрим на это с другой стороны?'
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      
      // Simulate voice speaking
      if (voiceEnabled) {
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 2000);
      }
    }, 1500);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      // Stop voice recognition
      return;
    }

    setIsListening(true);
    
    // Simulate voice recognition
    setTimeout(() => {
      setInput('Это пример голосового ввода');
      setIsListening(false);
    }, 2000);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="h-[calc(100vh-64px)] flex">
        {/* AI Video Section - Clean */}
        <div className="flex-1 relative">
          <AIAvatar 
            isListening={isListening}
            isSpeaking={isSpeaking || isTyping}
          />
          
          {/* Minimal top right controls */}
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-xl backdrop-blur-md border transition-all shadow-lg ${
                voiceEnabled 
                  ? 'bg-white/90 border-indigo-200 text-indigo-600 hover:bg-white' 
                  : 'bg-red-500 border-red-400 text-white hover:bg-red-600'
              }`}
              title={voiceEnabled ? 'Выключить звук' : 'Включить звук'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Chat Panel - Minimal */}
        <div className="w-[420px] bg-white flex flex-col border-l border-gray-200 shadow-xl">
          {/* Chat Header */}
          <div className="border-b border-gray-200 px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-800">Диалог с AI</h3>
                <p className="text-xs text-gray-600 mt-0.5">BigBrother Assistant</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isSpeaking || isTyping ? 'bg-green-500' : 
                  isListening ? 'bg-blue-500' : 
                  'bg-gray-400'
                } animate-pulse`} />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2.5 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border border-blue-400' 
                      : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border border-indigo-400'
                  }`}>
                    {message.role === 'user' ? 'У' : 'AI'}
                  </div>
                  
                  {/* Message bubble */}
                  <div>
                    <div
                      className={`rounded-lg px-4 py-2.5 border shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-500 border-blue-400 text-white'
                          : 'bg-white border-indigo-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>
                    <div className={`text-xs mt-1 px-1 ${message.role === 'user' ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border border-indigo-400 flex items-center justify-center text-xs shadow-sm">
                    AI
                  </div>
                  <div className="bg-white border border-indigo-200 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Введите сообщение..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-800 placeholder-gray-500"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-indigo-500 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleVoiceInput}
                className={`w-full py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm border shadow-sm ${
                  isListening
                    ? 'bg-red-50 border-red-300 text-red-600'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {isListening ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Запись активна...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Голосовой ввод</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}