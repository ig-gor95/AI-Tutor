/**
 * Продвинутый Text-to-Speech с поддержкой разных провайдеров
 * 
 * Варианты:
 * - 'browser' - Web Speech API (бесплатно, но роботизированно)
 * - 'openai' - OpenAI TTS (хорошее качество, платно)
 * - 'yandex' - Yandex SpeechKit (отличное качество для русского, есть бесплатный tier)
 */

export type TTSProvider = 'browser' | 'openai' | 'yandex';

// Базовый URL API (тот же, что используется в api.ts)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface TTSOptions {
  provider?: TTSProvider;
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  language?: 'ru' | 'en';
}

export class TextToSpeechAdvanced {
  private provider: TTSProvider;
  private language: 'ru' | 'en';
  private options: TTSOptions;
  private currentAudio: HTMLAudioElement | null = null;
  
  constructor(options: TTSOptions = {}) {
    this.provider = options.provider || 'yandex'; // По умолчанию Yandex (лучше для русского)
    this.language = options.language || 'ru';
    this.options = {
      voice: options.voice,
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0,
      ...options
    };
    console.log('🎙️ TTS инициализирован:', {
      provider: this.provider,
      language: this.language,
      voice: this.options.voice
    });
  }
  
  /**
   * Озвучить текст
   */
  async speak(text: string, onEnd?: () => void, onStart?: () => void): Promise<void> {
    this.stop();
    
    console.log(`🔊 TTS speak: провайдер=${this.provider}, язык=${this.language}, текст="${text.substring(0, 30)}..."`);
    
    switch (this.provider) {
      case 'browser':
        console.log('🔊 Используется Browser TTS');
        return this.speakBrowser(text, onEnd, onStart);
      case 'openai':
        console.log('🔊 Используется OpenAI TTS');
        return this.speakOpenAI(text, onEnd, onStart);
      case 'yandex':
        console.log('🔊 Используется Yandex TTS');
        return this.speakYandex(text, onEnd, onStart);
      default:
        console.log('🔊 Используется Browser TTS (fallback)');
        return this.speakBrowser(text, onEnd, onStart);
    }
  }
  
  /**
   * Browser TTS (Web Speech API) - бесплатно, но роботизированно
   */
  private speakBrowser(text: string, onEnd?: () => void, onStart?: () => void): Promise<void> {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = synth.getVoices();
      const lang = this.language === 'ru' ? 'ru' : 'en';
      const voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = this.options.speed || 1.0;
      utterance.pitch = this.options.pitch || 1.0;
      utterance.volume = this.options.volume || 1.0;
      utterance.lang = this.language === 'ru' ? 'ru-RU' : 'en-US';
      
      utterance.onstart = () => {
        onStart?.();
      };
      
      utterance.onend = () => {
        onEnd?.();
        resolve();
      };
      
      utterance.onerror = () => {
        onEnd?.();
        resolve();
      };
      
      synth.speak(utterance);
    });
  }
  
  /**
   * OpenAI TTS - хорошее качество, естественный голос
   * Голоса: alloy, echo, fable, onyx, nova, shimmer
   */
  private async speakOpenAI(text: string, onEnd?: () => void, onStart?: () => void): Promise<void> {
    try {
      // Выбираем голос для русского
      const voice = this.language === 'ru' 
        ? (this.options.voice || 'nova') // nova - женский, onyx - мужской
        : (this.options.voice || 'alloy');
      
      const response = await fetch(`${API_BASE_URL}/tts/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: voice,
          speed: this.options.speed || 1.0
        })
      });
      
      if (!response.ok) {
        throw new Error('OpenAI TTS failed');
      }
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      audio.volume = this.options.volume || 1.0;
      
      audio.onplay = () => {
        onStart?.();
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };
      
      this.currentAudio = audio;
      await audio.play();
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      // Fallback на browser TTS
      return this.speakBrowser(text, onEnd, onStart);
    }
  }
  
  /**
   * Yandex SpeechKit - отличное качество для русского
   * Требует API ключ Yandex Cloud
   */
  private async speakYandex(text: string, onEnd?: () => void, onStart?: () => void): Promise<void> {
    try {
      const voice = this.language === 'ru'
        ? (this.options.voice || 'jane') // jane, oksana, omazh, zahar, ermil
        : (this.options.voice || 'jane');
      
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/tts/yandex`;
      console.log('🎤 Yandex TTS: отправка запроса на', url);
      console.log('🎤 Текст:', text.substring(0, 50) + '...');
      console.log('🎤 Голос:', voice);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          text: text,
          voice: voice,
          speed: this.options.speed || 1.0,
          emotion: 'good' // neutral, good, evil, mixed
        })
      });
      
      console.log('🎤 Yandex TTS: статус ответа', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Yandex TTS failed:', response.status, errorText);
        throw new Error(`Yandex TTS failed: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ Yandex TTS: аудио получено, начинаем воспроизведение');
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      audio.volume = this.options.volume || 1.0;
      
      audio.onplay = () => {
        onStart?.();
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };
      
      this.currentAudio = audio;
      await audio.play();
    } catch (error) {
      console.error('Yandex TTS error:', error);
      // Fallback на OpenAI TTS, если Yandex недоступен
      if (this.provider === 'yandex') {
        console.log('Falling back to OpenAI TTS...');
        return this.speakOpenAI(text, onEnd, onStart).catch(() => {
          // Если и OpenAI не работает, используем browser TTS
          return this.speakBrowser(text, onEnd, onStart);
        });
      }
      return this.speakBrowser(text, onEnd, onStart);
    }
  }
  
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }
  
  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }
  
  resume() {
    if (this.currentAudio) {
      this.currentAudio.play();
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }
  
  isSpeaking(): boolean {
    return (this.currentAudio && !this.currentAudio.paused) || window.speechSynthesis.speaking;
  }
  
  setProvider(provider: TTSProvider) {
    this.provider = provider;
  }
  
  setLanguage(language: 'ru' | 'en') {
    this.language = language;
  }
}

