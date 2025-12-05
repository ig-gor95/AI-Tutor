export class SpeechToText {
  private recognition: any;
  private isListening = false;
  
  constructor(language: 'ru' | 'en' = 'ru') {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech Recognition not supported in this browser');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';
    this.recognition.maxAlternatives = 1;
  }
  
  start(onResult: (text: string) => void, onError?: (error: any) => void): void {
    if (this.isListening) {
      console.warn('Already listening');
      return;
    }
    
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
    };
    
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      console.log('Speech recognized:', transcript, 'Confidence:', confidence);
      onResult(transcript);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (event.error === 'no-speech') {
        onError?.({ message: 'Не услышал речь. Попробуйте еще раз.' });
      } else if (event.error === 'audio-capture') {
        onError?.({ message: 'Микрофон недоступен. Проверьте разрешения.' });
      } else if (event.error === 'not-allowed') {
        onError?.({ message: 'Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.' });
      } else {
        onError?.({ message: `Ошибка распознавания: ${event.error}` });
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
    };
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.isListening = false;
      onError?.(error);
    }
  }
  
  stop(): void {
    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
      this.isListening = false;
    }
  }
  
  isActive(): boolean {
    return this.isListening;
  }
  
  setLanguage(language: 'ru' | 'en'): void {
    this.recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';
  }
}

