import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Users, Terminal as TerminalIcon } from 'lucide-react';
import { GameState, GameMode } from '../types';
import { AudioManager } from '../utils/audio';

interface TerminalMenuProps {
  gameState: GameState;
  score: number;
  scoreP2?: number;
  bestScore: number;
  gameMode: GameMode;
  onStart: () => void;
  onStartMulti: () => void;
  onRestart: () => void;
}

const TerminalMenu: React.FC<TerminalMenuProps> = ({
  gameState,
  score,
  scoreP2 = 0,
  bestScore,
  gameMode,
  onStart,
  onStartMulti,
  onRestart
}) => {
  const [bootText, setBootText] = useState<string[]>([]);

  const playHover = () => AudioManager.getInstance().playUiHover();
  const playClick = () => AudioManager.getInstance().playUiClick();

  const handleStartSingle = () => {
    playClick();
    onStart();
  };

  const handleStartMulti = () => {
    playClick();
    onStartMulti();
  };

  const handleRestart = () => {
    playClick();
    onRestart();
  };

  useEffect(() => {
    if (gameState === GameState.MENU) {
      const lines = [
        "> INITIALIZING RETRO_ENGINE...",
        "> LOADING ASSETS...",
        "> DETECTING PERIPHERALS...",
        "> 2 CONTROLLERS DETECTED",
        "> SYSTEM READY."
      ];

      let delay = 0;
      setBootText([]);

      lines.forEach((line, index) => {
        setTimeout(() => {
          setBootText(prev => [...prev, line]);
          // Small blip for text typing
          if (Math.random() > 0.5) AudioManager.getInstance().playUiHover();
        }, delay);
        delay += 100 + Math.random() * 150;
      });
    }
  }, [gameState]);

  if (gameState === GameState.PLAYING) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50 p-4">
      <div className="w-full max-w-lg border-2 border-green-500 bg-black p-6 shadow-[0_0_20px_rgba(0,255,65,0.3)] font-mono relative overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-2 mb-6 border-b border-green-500/50 pb-4">
          <TerminalIcon className="w-6 h-6 text-green-500 animate-pulse" />
          <h1 className="text-2xl font-bold text-green-500 tracking-wider">RETRO_RACER.EXE</h1>
        </div>

        {/* Content based on State */}
        <div className="space-y-6">

          {gameState === GameState.MENU && (
            <div className="space-y-4">
              <div className="h-32 font-mono text-xs text-green-400/80 p-2 border border-green-900 bg-black/50 overflow-hidden">
                {bootText.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                <div className="animate-pulse">_</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleStartSingle}
                  onMouseEnter={playHover}
                  className="group relative px-4 py-4 bg-green-900/20 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-all duration-200 flex flex-col items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6" />
                  <span className="font-bold">SINGLE PLAYER</span>
                  <span className="text-[10px] opacity-70">WASD or ARROWS</span>
                </button>

                <button
                  onClick={handleStartMulti}
                  onMouseEnter={playHover}
                  className="group relative px-4 py-4 bg-cyan-900/20 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-200 flex flex-col items-center justify-center gap-2"
                >
                  <Users className="w-6 h-6" />
                  <span className="font-bold">MULTIPLAYER</span>
                  <span className="text-[10px] opacity-70">P1: WASD | P2: ARROWS</span>
                </button>
              </div>
            </div>
          )}

          {gameState === GameState.GAME_OVER && (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-red-500 glitch-text">FATAL ERROR</h2>
                <p className="text-red-400 font-mono text-sm">COLLISION DETECTED</p>
              </div>

              <div className="py-4 border-y border-green-900">
                {gameMode === GameMode.SINGLE ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-green-600">SCORE</p>
                      <p className="text-2xl font-bold text-green-400">{Math.floor(score)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-600">BEST</p>
                      <p className="text-2xl font-bold text-green-400">{Math.floor(bestScore)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center mb-2">
                      <span className="text-xl font-bold text-white">
                        WINNER: {Math.floor(score) > Math.floor(scoreP2) ? <span className="text-green-500">PLAYER 1</span> : <span className="text-cyan-500">PLAYER 2</span>}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center border-r border-gray-800">
                        <p className="text-xs text-green-600">PLAYER 1</p>
                        <p className="text-2xl font-bold text-green-400">{Math.floor(score)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-cyan-600">PLAYER 2</p>
                        <p className="text-2xl font-bold text-cyan-400">{Math.floor(scoreP2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRestart}
                onMouseEnter={playHover}
                className="w-full px-6 py-3 bg-red-900/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="font-bold">SYSTEM REBOOT</span>
              </button>
            </div>
          )}

          {gameState === GameState.PAUSED && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-yellow-500">SYSTEM HALTED</h2>
              <button
                onClick={onStart} // Re-using onStart to resume
                onMouseEnter={playHover}
                className="w-full px-6 py-3 bg-yellow-900/20 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-200"
              >
                RESUME PROCESS
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default TerminalMenu;