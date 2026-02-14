export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export enum GameMode {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI'
}

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  pos: Position;
  dim: Dimensions;
  type: 'player' | 'enemy' | 'particle' | 'coin';
  color: string;
  speed: number;
  lane?: number;
  passed?: boolean;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  velocity: Position;
}

export interface GameScore {
  current: number;
  best: number;
  speed: number;
  distance: number;
}