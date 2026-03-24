// services/tts.ts
// Text-to-Speech service — uses browser Web Speech API on client, 
// or a simple mock audio file on server

export interface TTSOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
}

/**
 * Client-side TTS using Web Speech API (built into all modern browsers).
 * Returns a controller with play/pause/stop.
 */
export function speakText({ text, lang = 'en-IN', rate = 0.9, pitch = 1.0 }: TTSOptions) {
  if (typeof window === 'undefined') return null;

  const synth = window.speechSynthesis;
  synth.cancel(); // Stop any current speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = pitch;

  // Prefer an Indian English voice if available
  const voices = synth.getVoices();
  const preferred = voices.find(v => v.lang === 'en-IN') 
    ?? voices.find(v => v.lang.startsWith('en'))
    ?? null;
  if (preferred) utterance.voice = preferred;

  synth.speak(utterance);

  return {
    pause: () => synth.pause(),
    resume: () => synth.resume(),
    stop: () => synth.cancel(),
    utterance,
  };
}

export function stopSpeaking() {
  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
}

// Language codes for vernacular TTS
export const LANG_CODES: Record<string, string> = {
  english: 'en-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  bengali: 'bn-IN',
};
