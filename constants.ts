export const CANVAS_WIDTH = 700; // Increased from 600 for wider view
export const CANVAS_HEIGHT = 1100; // Increased from 800 for longer view (more reaction time)
export const LANE_COUNT = 4;
export const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;
export const PLAYER_WIDTH = 125; // Increased to 125 to strictly prevent lane splitting
export const PLAYER_HEIGHT = 180; // Adjusted height for proportion
export const INITIAL_SPEED = 0;
export const MAX_SPEED = 25;
export const ACCELERATION = 0.3; // Snappier acceleration
export const BRAKING = 0.5;
export const FRICTION = 0.05;
export const STEERING_SPEED = 8; // Slightly more responsive steering

export const COLORS = {
  player: '#00ff41', // C++ Terminal Green
  player2: '#00ccff', // Cyan for Player 2
  enemy: ['#ff0055', '#ffcc00', '#bd00ff', '#ffffff'],
  road: '#1a1a1a',
  roadLine: '#333333',
  roadMarker: '#ffffff',
  grass: '#050505',
  text: '#00ff41'
};