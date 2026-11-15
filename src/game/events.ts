import Phaser from 'phaser';

export const gameEvents = new Phaser.Events.EventEmitter();

export const EVENTS = {
  INTERACT: 'interact',
  ENTER_ROOM: 'enter-room',
  DAY_CHANGE: 'day-change',
  CHOICE_MADE: 'choice-made',
  MENU_OPENED: 'menu-opened',
  MENU_CLOSED: 'menu-closed',
  SHOW_DIALOGUE: 'show-dialogue',
  HIDE_DIALOGUE: 'hide-dialogue',
  MISSION_START: 'mission-start',
  MISSION_COMPLETE: 'mission-complete',
  PLAYER_MOVED: 'player-moved',
  ROBOT_MOVED: 'robot-moved',
  ROBOT_INTERACT: 'robot-interact',
} as const;

export interface PlayerMovedPayload {
  x: number;
  y: number;
}
