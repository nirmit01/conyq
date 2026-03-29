// components/ui/ReadAloud.tsx
// Proper read-aloud with play/pause/stop/speed controls
'use client';
import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';

interface Props {
  text: string;
  label?: string;
}

type Status = 'idle' | 'playing' | 'paused';

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75];

export function ReadAloud({ text, label = 'Read Aloud' }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [speed, setSpeed] = useState(1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => { synthRef.current?.cancel(); };
  }, []);

  const play = () => {
    if (!synthRef.current || !text) return;

    if (status === 'paused') {
      synthRef.current.resume();
      setStatus('playing');
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
    utterance.rate = speed;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    // Prefer Indian English voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang === 'en-IN')
      ?? voices.find(v => v.lang.startsWith('en-GB'))
      ?? voices.find(v => v.lang.startsWith('en'))
      ?? null;
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');

    utterRef.current = utterance;
    synthRef.current.speak(utterance);
    setStatus('playing');
  };

  const pause = () => {
    synthRef.current?.pause();
    setStatus('paused');
  };

  const stop = () => {
    synthRef.current?.cancel();
    setStatus('idle');
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    // If playing, restart with new speed
    if (status === 'playing') {
      stop();
      setTimeout(play, 100);
    }
  };

  const isPlaying = status === 'playing';
  const isPaused  = status === 'paused';
  const isActive  = isPlaying || isPaused;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Play / Pause */}
      <button
        onClick={isPlaying ? pause : play}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
        style={{
          backgroundColor: isActive ? 'rgba(234,88,12,0.1)' : 'var(--bg-tertiary)',
          borderColor: isActive ? '#ea580c60' : 'var(--border-color)',
          color: isActive ? '#ea580c' : 'var(--text-secondary)',
        }}
        title={label}
      >
        {isPlaying ? <Pause size={13} /> : isPaused ? <Play size={13} /> : <Volume2 size={13} />}
        <span>{isPlaying ? 'Pause' : isPaused ? 'Resume' : label}</span>
      </button>

      {/* Stop */}
      {isActive && (
        <button
          onClick={stop}
          className="p-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          title="Stop"
        >
          <Square size={13} />
        </button>
      )}

      {/* Speed */}
      <button
        onClick={cycleSpeed}
        className="px-2 py-1 rounded-md text-xs font-mono border transition-colors"
        style={{
          borderColor: 'var(--border-color)',
          color: speed !== 1 ? '#ea580c' : 'var(--text-muted)',
          backgroundColor: 'var(--bg-tertiary)',
        }}
        title="Change speed"
      >
        {speed}×
      </button>

      {/* Mute indicator */}
      {status === 'idle' && (
        <VolumeX size={13} style={{ color: 'var(--text-faint)' }} />
      )}
    </div>
  );
}
