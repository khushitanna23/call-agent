import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, FastForward } from 'lucide-react';

export const AudioPlayer = ({
  audioUrl = 'https://actions.google.com/sounds/v1/telephones/phone_ring.ogg',
  durationSeconds = 120,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((e) => console.log('Audio autoplay prevented:', e));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-navy-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-indigo hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-glow transition"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Restart Button */}
        <button
          onClick={restart}
          title="Restart audio"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Progress Bar & Visualizer */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
              <span className="text-[11px] text-slate-400">HD Call Recording</span>
            </div>
            <span>{formatTime(durationSeconds)}</span>
          </div>

          <input
            type="range"
            min="0"
            max={durationSeconds || 120}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
          />
        </div>

        {/* Speed button */}
        <button
          onClick={toggleSpeed}
          className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-navy-800 text-brand-cyan border border-cyan-500/20 hover:border-cyan-500/50 transition"
        >
          {speed}x
        </button>
      </div>

      {/* Simulated Audio Waveform display */}
      <div className="flex items-center justify-between gap-1 h-6 px-1 overflow-hidden opacity-75">
        {[20, 45, 80, 60, 30, 90, 70, 40, 100, 55, 35, 75, 95, 40, 65, 85, 50, 30, 90, 60, 45, 80, 35, 70, 90, 40, 60, 85, 30, 50].map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-t from-brand-cyan to-brand-indigo wave-bar'
                : 'bg-slate-700'
            }`}
            style={{
              height: isPlaying ? `${Math.max(6, (h / 100) * 24)}px` : `${Math.max(4, (h / 100) * 16)}px`,
              animationDelay: `${(i % 8) * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
