import { Container, Graphics } from "pixi.js";
import { User } from "@sharedTypes/roomTypes";
import { Store, useStore } from "@/renderer/store/store";

export class BlockChanges {
  x: number | null = null;
  width: number | null = null;
  height: number | null = null;
  track: number | null = null;
}
export class BlockDTO {
  rect: Graphics;
  strokedRect: Graphics;
  initX: number;
  initY: number;
  initWidth: number;
  leftHandle: Graphics;
  leftIndicator: Graphics;
  rightHandle: Graphics;
  rightIndicator: Graphics;
  topHandle: Graphics;
  topIndicator: Graphics;
  bottomHandle: Graphics;
  bottomIndicator: Graphics;
  container: Container;
  trackId: number;
  initTrackId: number;
  groupId?: number;
  constructor(
    rect: Graphics,
    strokedRect: Graphics,
    leftHandle: Graphics,
    leftIndicator: Graphics,
    rightHandle: Graphics,
    rightIndicator: Graphics,
    topHandle: Graphics,
    topIndicator: Graphics,
    bottomHandle: Graphics,
    bottomIndicator: Graphics,
    container: Container,
    trackId: number,
  ) {
    this.rect = rect;
    this.strokedRect = strokedRect;
    this.initWidth = rect.width;
    this.initX = rect.x;
    this.initY = rect.y;
    this.leftHandle = leftHandle;
    this.leftIndicator = leftIndicator;
    this.rightHandle = rightHandle;
    this.rightIndicator = rightIndicator;
    this.topHandle = topHandle;
    this.topIndicator = topIndicator;
    this.bottomHandle = bottomHandle;
    this.bottomIndicator = bottomIndicator;
    this.container = container;
    this.trackId = trackId;
    this.initTrackId = trackId;
  }
}
export interface BlockSelection {
  trackId: number;
  index: number;
  uid: number;
}
export interface BlockData {
  trackId: number;
  startTime: number;
  endTime: number;
  intensity: number;
}
export enum TimelineEvents {
  TACTON_WAS_EDITED = "tactonWasEdited",
  TACTON_BLOCK_SELECTED = "tactonPartWasSelected",
  TACTON_ALL_DESELECTED = "tactonAllDeselected",
}
function getCurrentEditorName(): string | undefined {
  const store: Store = useStore();
  const editorId: string | null =
    store.state.roomSettings.currentlyEditingUserId;
  return store.state.roomSettings.participants.find((user: User): boolean => {
    return user.id == editorId;
  })?.name;
}
export const SnackbarTexts = {
  TACTON_IS_READONLY: (): string =>
    "This file is currently read-only. Enable edit-mode to make changes.",
  TACTON_IS_EDITED_BY_USER: (): string => {
    const editorName: string | undefined = getCurrentEditorName();
    if (editorName) {
      return `This file is currently edited by ${editorName}.`;
    } else {
      return `This file is currently edited.`;
    }
  },
  TACTON_CAN_BE_EDITED: (): string => "This file can now be edited.",
  CANT_CHANGE_EDITMODE: (): string => {
    const editorName: string | undefined = getCurrentEditorName();
    if (editorName) {
      return `This file is currently edited by ${editorName}. Can't change edit-mode`;
    } else {
      return `This file is currently edited. Can't change edit-mode.`;
    }
  },
};
