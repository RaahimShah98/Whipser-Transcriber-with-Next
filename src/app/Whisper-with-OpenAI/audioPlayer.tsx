// GloomyAudioPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface GloomyAudioPlayerProps {
  audioSource: string;
  audioDuration:number
}

const GloomyAudioPlayer: React.FC<GloomyAudioPlayerProps> = ({ audioSource , audioDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      console.log(audio.duration)
    };
    
    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };
    
    // Set up event listeners
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    
    // Cleanup
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const audio = audioRef.current;
    if (!progressBar || !audio) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentClicked = clickPosition / rect.width;
    
    // Set the audio's current time based on the click position
    audio.currentTime = percentClicked * duration;
  };

  // Format time in mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-gray-900 rounded-xl p-4 shadow-lg border border-purple-500/30 shadow-purple-500/10">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        src={audioSource}
      />
      
      {/* Player Controls */}
      <div className="flex items-center gap-4 mb-3">
        <button 
          onClick={togglePlay}
          className="bg-blue-800 hover:bg-black text-white p-2 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause  size={20} /> : <Play size={20} />}
        </button>
        
        <div className="text-gray-300 text-sm">
          {formatTime(currentTime)}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div 
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="h-2 bg-gray-700 rounded-full w-full cursor-pointer overflow-hidden"
      >
        <div 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all"
          style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default GloomyAudioPlayer;