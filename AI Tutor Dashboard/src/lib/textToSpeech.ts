export class TextToSpeech {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  constructor(language: 'ru' | 'en' = 'ru') {
    this.synth = window.speechSynthesis;
    this.loadVoices(language);
  }
  
  private loadVoices(language: 'ru' | 'en') {
    const voices = this.synth.getVoices();
    const lang = language === 'ru' ? 'ru' : 'en';
    
    // Prefer native language voice
    this.voice = voices.find(v => v.lang.startsWith(lang)) || voices[0];
    
    // Chrome loads voices async
    if (voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        const newVoices = this.synth.getVoices();
        this.voice = newVoices.find(v => v.lang.startsWith(lang)) || newVoices[0];
      };
    }
  }
  
  speak(text: string, onEnd?: () => void, onStart?: () => void) {
    // Cancel any ongoing speech
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.rate = 1.0;   // Speed
    utterance.pitch = 1.0;  // Pitch
    utterance.volume = 1.0; // Volume
    
    utterance.onstart = () => {
      onStart?.();
    };
    
    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentUtterance = null;
      onEnd?.();
    };
    
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
  
  // Stream text as it arrives (speak sentence by sentence)
  speakStream(text: string, onEnd?: () => void, onStart?: () => void) {
    // Split into sentences for better streaming experience
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length > 0) {
      this.speak(sentences[0], () => {
        if (sentences.length > 1) {
          // Continue with next sentences
          this.speakStream(sentences.slice(1).join(' '), onEnd);
        } else {
          onEnd?.();
        }
      }, onStart);
    }
  }
  
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }
  
  pause() {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }
  
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }
  
  isSpeaking() {
    return this.synth.speaking;
  }
  
  isPaused() {
    return this.synth.paused;
  }
}

