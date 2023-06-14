/**
 * Types
 * 
 */

import { User } from "@/renderer/store/modules/roomSettings/roomSettings"

export interface KeyBoardAttributes {
  channels: number[],
  color: string,
  intensity: number,
  name?: string,
  key: string,
  isActive: {
    mouse: boolean,
    keyboard: boolean,
  }
}

export interface KeyBoardButton extends KeyBoardAttributes {
  i: string,
  x: number,
  y: number,
  h: number,
  w: number,
}
export interface TactileTask {
  channelIds: number[],
  intensity: number,
}


export interface InstructionToClient {
  channelIds: number[],
  intensity: number,
  author: User | undefined
}