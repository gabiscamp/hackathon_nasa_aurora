import Phaser from 'phaser';

export const gameEvents = new Phaser.Events.EventEmitter();

export const EVENTS = {
  INTERACT: 'interact',
  TOUCH_MOVE: 'touch-move',
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
  SHOW_SPEECH_BUBBLE: 'show-speech-bubble',
  HIDE_SPEECH_BUBBLE: 'hide-speech-bubble',
  /** React → Phaser: the "!" of every open problem (MissionMarkerSpec[]). */
  SET_MISSION_MARKERS: 'set-mission-markers',
} as const;

/** One "!" on the map. MISSION_START is emitted with this id when the player presses E next to it. */
export interface MissionMarkerSpec {
  id: string;
  room: string;
  critical: boolean;
}

export interface PlayerMovedPayload {
  x: number;
  y: number;
}
