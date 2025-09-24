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
  uuid: string;
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
  groupUuid: string | null;
  constructor(
    uuid: string,
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
    this.uuid = uuid;
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
    this.groupUuid = null;
  }
}
export interface BlockSelection {
  trackId: number;
  index: number;
  uuid: string;
}
export interface BlockData {
  trackId: number;
  startTime: number;
  endTime: number;
  intensity: number;
  uuid: string;
  groupUuid: string | null;
}
export enum TimelineEvents {
  TACTON_WAS_EDITED = "tactonWasEdited",
  TACTON_BLOCK_SELECTED = "tactonPartWasSelected",
  TACTON_ALL_DESELECTED = "tactonAllDeselected",
  UPADTED_USER_LOCKS = "updatedUserLocks",
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
  TACTON_IS_EDITABLE_BUT_EDITED: (): string => {
    const editorName: string | undefined = getCurrentEditorName();
    if (editorName) {
      return `This file is currently edited by ${editorName}.`;
    } else {
      return `This file is currently edited.`;
    }
  },
};
