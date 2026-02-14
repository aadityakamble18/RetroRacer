import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import GameEngine from './components/GameEngine';
import TerminalMenu from './components/TerminalMenu';
import Dashboard from './components/Dashboard';
import { GameState, GameMode } from './types';
import { COLORS } from './constants';
import { AudioManager } from './utils/audio';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SINGLE);
  const [isMuted, setIsMuted] = useState(false);

  // Crash State
  const [p1Crashed, setP1Crashed] = useState(false);
  const [p2Crashed, setP2Crashed] = useState(false);

  // Player 1 Stats
  const [scoreP1, setScoreP1] = useState(0);
  const [speedP1, setSpeedP1] = useState(0);

  // Player 2 Stats
  const [scoreP2, setScoreP2] = useState(0);
  const [speedP2, setSpeedP2] = useState(0);

  const [bestScore, setBestScore] = useState(0);

  // Global Audio Initialization on Interaction
  useEffect(() => {
    const initAudio = () => {
      AudioManager.getInstance().init();
      // If we are in menu, ensure menu music starts once interaction happens
      if (gameState === GameState.MENU) {
        AudioManager.getInstance().playMenuTheme();
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [gameState]);

  // Handle Music State Switching
  useEffect(() => {
    if (gameState === GameState.MENU) {
      AudioManager.getInstance().playMenuTheme();
    } else if (gameState === GameState.PLAYING) {
      AudioManager.getInstance().playRaceTheme();
    } else if (gameState === GameState.GAME_OVER) {
      // Keep playing race theme or switch to menu/gameover theme
      // For now, let's switch back to the ambient drone for the game over screen
      AudioManager.getInstance().playMenuTheme();
    }
  }, [gameState]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('retroracer_highscore');
    if (saved) setBestScore(parseInt(saved));
  }, []);

  // Update high score
  useEffect(() => {
    if (gameState === GameState.GAME_OVER && gameMode === GameMode.SINGLE) {
      if (scoreP1 > bestScore) {
        setBestScore(scoreP1);
        localStorage.setItem('retroracer_highscore', scoreP1.toString());
      }
    }
  }, [gameState, scoreP1, bestScore, gameMode]);

  const handleStartSingle = () => {
    setGameMode(GameMode.SINGLE);
    setP1Crashed(false);
    setP2Crashed(false);
    setGameState(GameState.PLAYING);
  };

  const handleStartMulti = () => {
    setGameMode(GameMode.MULTI);
    setP1Crashed(false);
    setP2Crashed(false);
    setGameState(GameState.PLAYING);
  };

  const handleP1Crash = () => {
    setP1Crashed(true);
    AudioManager.getInstance().playCrash();
    if (gameMode === GameMode.SINGLE || p2Crashed) {
      setTimeout(() => setGameState(GameState.GAME_OVER), 500); // Small delay for impact
    }
  };

  const handleP2Crash = () => {
    setP2Crashed(true);
    AudioManager.getInstance().playCrash();
    if (p1Crashed) {
      setTimeout(() => setGameState(GameState.GAME_OVER), 500);
    }
  };

  const handleRestart = () => {
    setP1Crashed(false);
    setP2Crashed(false);
    setGameState(GameState.MENU);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    AudioManager.getInstance().setMute(newMuteState);
    AudioManager.getInstance().playUiClick();
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-2 relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">

      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      {/* Audio Control */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded-full"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Game Container Wrapper */}
      <div className={`relative z-10 flex gap-4 w-full max-w-[95vw] justify-center items-center h-[90vh]`}>

        {/* Player 1 Console */}
        <div className={`relative rounded-lg overflow-hidden border-2 border-green-500 shadow-[0_0_30px_rgba(0,255,65,0.2)] bg-black flex-1 h-full max-w-lg transition-all duration-500`}>
          {gameState === GameState.PLAYING && (
            <Dashboard score={scoreP1} speed={speedP1} />
          )}
          <GameEngine
            gameState={gameState}
            setGameState={setGameState}
            setScore={setScoreP1}
            setSpeedDisplay={setSpeedP1}
            controls={gameMode === GameMode.SINGLE ? 'BOTH' : 'WASD'}
            playerColor={COLORS.player}
            onCrash={handleP1Crash}
          />
          {gameMode === GameMode.MULTI && (
            <div className="absolute bottom-2 left-2 text-xs font-mono text-green-500 bg-black/80 px-2 py-1 border border-green-800 backdrop-blur-sm">P1: WASD {p1Crashed && "[CRITICAL FAILURE]"}</div>
          )}
        </div>

        {/* Player 2 Console (Multiplayer Only) */}
        {gameMode === GameMode.MULTI && (
          <div className="relative rounded-lg overflow-hidden border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,204,255,0.2)] bg-black flex-1 h-full max-w-lg">
            {gameState === GameState.PLAYING && (
              <Dashboard score={scoreP2} speed={speedP2} />
            )}
            <GameEngine
              gameState={gameState}
              setGameState={setGameState}
              setScore={setScoreP2}
              setSpeedDisplay={setSpeedP2}
              controls="ARROWS"
              playerColor={COLORS.player2}
              onCrash={handleP2Crash}
            />
            <div className="absolute bottom-2 left-2 text-xs font-mono text-cyan-500 bg-black/80 px-2 py-1 border border-cyan-800 backdrop-blur-sm">P2: ARROWS {p2Crashed && "[CRITICAL FAILURE]"}</div>
          </div>
        )}

        {/* Global Menu Overlay */}
        <TerminalMenu
          gameState={gameState}
          score={scoreP1}
          scoreP2={scoreP2}
          bestScore={bestScore}
          gameMode={gameMode}
          onStart={handleStartSingle}
          onStartMulti={handleStartMulti}
          onRestart={handleRestart}
        />

      </div>

      {/* Footer Info */}
      <div className="absolute bottom-2 left-0 w-full text-center text-white/20 text-[10px] font-mono pointer-events-none z-20">
        RETRO_ENGINE | DUAL_THREADING: {gameMode === GameMode.MULTI ? 'ACTIVE' : 'STANDBY'}
      </div>

      <div className="scanline"></div>
    </div>
  );
}

export default App;