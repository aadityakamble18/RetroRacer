import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Entity, Particle, Position } from '../types';
import { AudioManager } from '../utils/audio';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  LANE_COUNT, 
  LANE_WIDTH, 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT,
  COLORS,
  MAX_SPEED,
  ACCELERATION,
  BRAKING,
  FRICTION,
  STEERING_SPEED
} from '../constants';

interface GameEngineProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setSpeedDisplay: (speed: number) => void;
  onCrash: () => void;
  controls?: 'BOTH' | 'WASD' | 'ARROWS';
  playerColor?: string;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  gameState, 
  setGameState, 
  setScore,
  setSpeedDisplay,
  onCrash,
  controls = 'BOTH',
  playerColor = COLORS.player
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs
  const playerPos = useRef<Position>({ x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 250 });
  const playerSpeed = useRef<number>(0);
  const enemies = useRef<Entity[]>([]);
  const particles = useRef<Particle[]>([]);
  const roadOffset = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastTime = useRef<number>(0);
  const difficultyMultiplier = useRef<number>(1);
  const touchX = useRef<number | null>(null);
  const isCrashed = useRef<boolean>(false);
  const stopTimer = useRef<number>(0);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      let relevant = false;
      
      if (controls === 'BOTH') relevant = true;
      if (controls === 'WASD' && ['w','a','s','d','W','A','S','D'].includes(key)) relevant = true;
      if (controls === 'ARROWS' && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) relevant = true;

      if (relevant) {
        keysPressed.current[key] = true;
      }

      if (key === 'Escape') {
         if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
         else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, setGameState, controls]);

  // Touch Handling for Mobile (Only enabled if controls allows Arrows/Both)
  useEffect(() => {
    if (controls === 'WASD') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchX.current = touch.clientX - rect.left;
      keysPressed.current['ArrowUp'] = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchX.current = touch.clientX - rect.left;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchX.current = null;
      keysPressed.current['ArrowUp'] = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [controls]);

  // Reset Game Logic
  const resetGame = useCallback(() => {
    playerPos.current = { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 250 };
    playerSpeed.current = 0;
    enemies.current = [];
    particles.current = [];
    roadOffset.current = 0;
    scoreRef.current = 0;
    difficultyMultiplier.current = 1;
    isCrashed.current = false;
    stopTimer.current = 0;
    setScore(0);
    setSpeedDisplay(0);
    
    // Clear canvas
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.fillStyle = COLORS.grass;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, [setScore, setSpeedDisplay]);

  // Spawn Enemy (Front)
  const spawnEnemy = () => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const x = lane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    const y = -PLAYER_HEIGHT - 100; 
    
    const laneBlocked = enemies.current.some(e => 
      Math.abs(e.pos.x - x) < 50 && 
      Math.abs(e.pos.y - y) < PLAYER_HEIGHT * 3
    );

    const nearbyEnemies = enemies.current.filter(e => Math.abs(e.pos.y - y) < PLAYER_HEIGHT * 1.5);
    const blockedLanes = new Set(nearbyEnemies.map(e => Math.round((e.pos.x / CANVAS_WIDTH) * LANE_COUNT)));
    blockedLanes.add(lane);
    
    if (!laneBlocked && blockedLanes.size < LANE_COUNT) {
      const isBlocker = Math.random() < 0.4;
      const speedBase = isBlocker ? 3 : 10;
      
      enemies.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        dim: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
        type: 'enemy',
        color: COLORS.enemy[Math.floor(Math.random() * COLORS.enemy.length)],
        speed: speedBase + (Math.random() * 5) + (difficultyMultiplier.current * 1.2),
        passed: false
      });
    }
  };

  // Spawn Rear Enemy (When stopped)
  const spawnRearEnemy = () => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const x = lane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    const y = CANVAS_HEIGHT + 200; // Spawn below screen

    const laneBlocked = enemies.current.some(e => 
        Math.abs(e.pos.x - x) < 50 && 
        Math.abs(e.pos.y - y) < PLAYER_HEIGHT * 3
    );

    if (!laneBlocked) {
        enemies.current.push({
            id: Math.random().toString(),
            pos: { x, y },
            dim: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
            type: 'enemy',
            color: '#888888', // Greyish color for passing cars
            speed: 40 + Math.random() * 20,
            passed: false 
        });
    }
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        dim: { width: 3, height: 3 },
        type: 'particle',
        color: color,
        speed: Math.random() * 2,
        life: 1.0,
        maxLife: 1.0,
        velocity: { 
          x: (Math.random() - 0.5) * 6, 
          y: (Math.random() - 0.5) * 6 
        }
      });
    }
  };

  const drawCrashedState = (ctx: CanvasRenderingContext2D) => {
     ctx.fillStyle = 'rgba(0,0,0,0.7)';
     ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
     
     ctx.font = 'bold 48px "JetBrains Mono"';
     ctx.fillStyle = 'red';
     ctx.textAlign = 'center';
     ctx.fillText('SYSTEM FAILURE', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
     
     ctx.font = '24px "JetBrains Mono"';
     ctx.fillStyle = '#ff5555';
     ctx.fillText('CONNECTION LOST', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
  };

  const update = useCallback((time: number) => {
    if (!lastTime.current) lastTime.current = time;
    const deltaTime = (time - lastTime.current) / 16.67;
    lastTime.current = time;

    if (isCrashed.current) {
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    if (gameState !== GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    // Input Mapping
    let accel = false;
    let brake = false;
    let left = false;
    let right = false;

    if (controls === 'WASD') {
      accel = keysPressed.current['w'] || keysPressed.current['W'];
      brake = keysPressed.current['s'] || keysPressed.current['S'];
      left = keysPressed.current['a'] || keysPressed.current['A'];
      right = keysPressed.current['d'] || keysPressed.current['D'];
    } else if (controls === 'ARROWS') {
      accel = keysPressed.current['ArrowUp'];
      brake = keysPressed.current['ArrowDown'];
      left = keysPressed.current['ArrowLeft'];
      right = keysPressed.current['ArrowRight'];
    } else {
      // BOTH
      accel = keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W'];
      brake = keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S'];
      left = keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A'];
      right = keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D'];
    }

    // Physics
    if (accel) playerSpeed.current += ACCELERATION * deltaTime;
    else if (brake) playerSpeed.current -= BRAKING * deltaTime;
    else {
      if (playerSpeed.current > 0) playerSpeed.current -= FRICTION * deltaTime;
      if (playerSpeed.current < 0) playerSpeed.current += FRICTION * deltaTime;
    }
    
    playerSpeed.current = Math.max(0, Math.min(playerSpeed.current, MAX_SPEED));

    if (left && playerSpeed.current > 0.5) playerPos.current.x -= STEERING_SPEED * deltaTime;
    if (right && playerSpeed.current > 0.5) playerPos.current.x += STEERING_SPEED * deltaTime;

    // Update Audio Engine Sound
    const speedRatio = playerSpeed.current / MAX_SPEED;
    AudioManager.getInstance().updateEngine(speedRatio);

    // Touch Steering
    if (controls !== 'WASD' && touchX.current !== null && playerSpeed.current > 0.5 && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const canvasX = touchX.current * scaleX;
      if (canvasX < playerPos.current.x + PLAYER_WIDTH / 2 - 30) playerPos.current.x -= STEERING_SPEED * deltaTime;
      else if (canvasX > playerPos.current.x + PLAYER_WIDTH / 2 + 30) playerPos.current.x += STEERING_SPEED * deltaTime;
    }

    // Boundaries
    if (playerPos.current.x < 0) {
      playerPos.current.x = 0;
      playerSpeed.current *= 0.9;
      createParticles(playerPos.current.x, playerPos.current.y + PLAYER_HEIGHT/2, '#888', 1);
    }
    if (playerPos.current.x > CANVAS_WIDTH - PLAYER_WIDTH) {
      playerPos.current.x = CANVAS_WIDTH - PLAYER_WIDTH;
      playerSpeed.current *= 0.9;
      createParticles(playerPos.current.x + PLAYER_WIDTH, playerPos.current.y + PLAYER_HEIGHT/2, '#888', 1);
    }

    roadOffset.current = (roadOffset.current + playerSpeed.current * 15 * deltaTime) % 100;
    scoreRef.current += (playerSpeed.current * 0.1) * deltaTime;
    setScore(scoreRef.current);
    setSpeedDisplay(playerSpeed.current);
    
    difficultyMultiplier.current = 1 + Math.floor(scoreRef.current / 1500) * 0.1;

    // Front Spawning
    if (Math.random() < 0.015 * difficultyMultiplier.current && playerSpeed.current > 5) {
      spawnEnemy();
    }

    // Rear Spawning Logic (When stopped)
    if (playerSpeed.current < 2) {
        stopTimer.current += deltaTime;
        // If stopped for more than ~2 seconds (approx 120 frames)
        if (stopTimer.current > 100) {
            if (Math.random() < 0.02) { // 2% chance per frame
                spawnRearEnemy();
            }
        }
    } else {
        stopTimer.current = 0;
    }

    // Enemy Updates
    enemies.current.forEach(enemy => {
      const relativeSpeed = (playerSpeed.current * 0.85) - (enemy.speed * 0.3);
      enemy.pos.y += relativeSpeed * 10 * deltaTime;

      // Audio: Check if passing
      // We check if the enemy center passes the player center on Y axis
      const enemyCenterY = enemy.pos.y + enemy.dim.height / 2;
      const playerCenterY = playerPos.current.y + PLAYER_HEIGHT / 2;
      
      // If passing happens (within a range and hasn't been triggered)
      // We only care if they are close enough on X to be "passing" nicely or just generally on screen
      // Let's simpler logic: if it crosses the player's Y plane
      if (!enemy.passed && enemyCenterY > playerCenterY) {
         // Only play if relative speed is high enough to warrant a "whoosh"
         if (Math.abs(relativeSpeed) > 1.0) {
             AudioManager.getInstance().playPass();
         }
         enemy.passed = true;
      }
    });

    // Cleanup
    enemies.current = enemies.current.filter(e => e.pos.y < CANVAS_HEIGHT + 300 && e.pos.y > -600);

    // Particles
    particles.current.forEach(p => {
      p.pos.x += p.velocity.x * deltaTime;
      p.pos.y += p.velocity.y * deltaTime + (playerSpeed.current * 5 * deltaTime);
      p.life -= 0.05 * deltaTime;
    });
    particles.current = particles.current.filter(p => p.life > 0);

    if (playerSpeed.current > MAX_SPEED * 0.8) {
      createParticles(playerPos.current.x + 10, playerPos.current.y + PLAYER_HEIGHT, '#333', 1);
      createParticles(playerPos.current.x + PLAYER_WIDTH - 10, playerPos.current.y + PLAYER_HEIGHT, '#333', 1);
    }

    // Draw
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = COLORS.roadLine;
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 60]);
      ctx.lineDashOffset = -roadOffset.current;

      for (let i = 1; i < LANE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, -100);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT + 100);
        ctx.stroke();
      }

      enemies.current.forEach(enemy => drawCar(ctx, enemy.pos.x, enemy.pos.y, enemy.color, false));
      drawCar(ctx, playerPos.current.x, playerPos.current.y, playerColor, true);

      particles.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.pos.x, p.pos.y, p.dim.width, p.dim.height);
        ctx.globalAlpha = 1.0;
      });
      
      if (playerSpeed.current > 15) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([50, 200]);
        ctx.lineDashOffset = -roadOffset.current * 5;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(10, CANVAS_HEIGHT);
        ctx.moveTo(CANVAS_WIDTH - 10, 0);
        ctx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT);
        ctx.stroke();
      }
    }

    // Collision Check - Tightened buffers (4px) to prevent passing through gaps
    const collisionBuffer = 4;
    const playerRect = {
      l: playerPos.current.x + collisionBuffer,
      r: playerPos.current.x + PLAYER_WIDTH - collisionBuffer,
      t: playerPos.current.y + collisionBuffer,
      b: playerPos.current.y + PLAYER_HEIGHT - collisionBuffer
    };

    for (const enemy of enemies.current) {
      const enemyRect = {
        l: enemy.pos.x + collisionBuffer,
        r: enemy.pos.x + enemy.dim.width - collisionBuffer,
        t: enemy.pos.y + collisionBuffer,
        b: enemy.pos.y + enemy.dim.height - collisionBuffer
      };

      if (
        playerRect.l < enemyRect.r &&
        playerRect.r > enemyRect.l &&
        playerRect.t < enemyRect.b &&
        playerRect.b > enemyRect.t
      ) {
        createParticles(playerPos.current.x + PLAYER_WIDTH/2, playerPos.current.y + PLAYER_HEIGHT/2, 'orange', 40);
        
        // Handle Crash
        isCrashed.current = true;
        if (ctx) drawCrashedState(ctx);
        onCrash();
        return;
      }
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, setGameState, setScore, setSpeedDisplay, controls, playerColor, onCrash]);

  const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isPlayer: boolean) => {
    const w = PLAYER_WIDTH;
    const h = PLAYER_HEIGHT;
    
    // Tires
    ctx.fillStyle = '#111';
    const tireWidth = 14;
    const tireHeight = 32;
    const tireInsetY = 25;
    
    ctx.fillRect(x + 2, y + tireInsetY, tireWidth, tireHeight);
    ctx.fillRect(x + w - tireWidth - 2, y + tireInsetY, tireWidth, tireHeight);
    ctx.fillRect(x + 2, y + h - tireInsetY - tireHeight, tireWidth, tireHeight);
    ctx.fillRect(x + w - tireWidth - 2, y + h - tireInsetY - tireHeight, tireWidth, tireHeight);

    // Body
    ctx.fillStyle = color;
    const bodyMargin = 8;
    ctx.fillRect(x + bodyMargin, y, w - bodyMargin * 2, h);
    
    // Cabin
    ctx.fillStyle = isPlayer ? '#002200' : '#220000';
    if (color === COLORS.player2) ctx.fillStyle = '#002233'; // Special dark cabin for P2
    
    const cabinMargin = 16;
    const cabinY = h * 0.35;
    const cabinH = h * 0.3;
    ctx.fillRect(x + cabinMargin, y + cabinY, w - cabinMargin * 2, cabinH);
    
    // Windows
    const windowColor = isPlayer ? '#004400' : '#440000';
    ctx.fillStyle = windowColor;
    if (color === COLORS.player2) ctx.fillStyle = '#004466';

    ctx.fillRect(x + cabinMargin, y + cabinY, w - cabinMargin * 2, 6);
    ctx.fillRect(x + cabinMargin, y + cabinY + cabinH - 6, w - cabinMargin * 2, 6);

    // Lights
    ctx.fillStyle = '#ffffcc';
    ctx.shadowColor = '#ffffcc';
    ctx.shadowBlur = isPlayer ? 10 : 0;
    ctx.fillRect(x + bodyMargin + 4, y + 2, 12, 6);
    ctx.fillRect(x + w - bodyMargin - 16, y + 2, 12, 6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = isPlayer ? 10 : 0;
    ctx.fillRect(x + bodyMargin + 4, y + h - 8, 12, 6);
    ctx.fillRect(x + w - bodyMargin - 16, y + h - 8, 12, 6);
    ctx.shadowBlur = 0;
    
    // Stripe
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + w/2 - 8, y, 16, h);

    if (isPlayer) {
       ctx.strokeStyle = color;
       ctx.lineWidth = 2;
       ctx.strokeRect(x + bodyMargin, y, w - bodyMargin * 2, h);
    }
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  useEffect(() => {
    if (gameState === GameState.MENU) resetGame();
  }, [gameState, resetGame]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block w-full h-full object-contain touch-none"
    />
  );
};

export default GameEngine;