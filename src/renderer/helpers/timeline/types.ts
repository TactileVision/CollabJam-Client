import { Container, FederatedPointerEvent, Graphics } from "pixi.js";
export class BlockChanges {
  x: number | null = null;
  width: number | null = null;
  height: number | null = null;
  track: number | null = null;
}

export type EventHandler = (event: FederatedPointerEvent) => void;
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

  private listeners: {
    left?: EventHandler;
    right?: EventHandler;
    top?: EventHandler;
    bottom?: EventHandler;
    rect?: EventHandler;
  } = {};
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
  addListeners(context: {
    onHorizontalResize: (
      e: FederatedPointerEvent,
      dir: Direction,
      dto: BlockDTO,
    ) => void;
    onChangeAmplitude: (
      e: FederatedPointerEvent,
      dir: Direction,
      dto: BlockDTO,
    ) => void;
    onMoveBlock: (e: FederatedPointerEvent, dto: BlockDTO) => void;
  }): void {
    this.listeners.left = (e) =>
      context.onHorizontalResize(e, Direction.LEFT, this);
    this.listeners.right = (e) =>
      context.onHorizontalResize(e, Direction.RIGHT, this);
    this.listeners.top = (e) =>
      context.onChangeAmplitude(e, Direction.TOP, this);
    this.listeners.bottom = (e) =>
      context.onChangeAmplitude(e, Direction.BOTTOM, this);
    this.listeners.rect = (e) => context.onMoveBlock(e, this);

    this.leftHandle.on("pointerdown", this.listeners.left);
    this.rightHandle.on("pointerdown", this.listeners.right);
    this.topHandle.on("pointerdown", this.listeners.top);
    this.bottomHandle.on("pointerdown", this.listeners.bottom);
    this.rect.on("pointerdown", this.listeners.rect);
  }
  removeListeners(): void {
    if (this.listeners.left)
      this.leftHandle.off("pointerdown", this.listeners.left);
    if (this.listeners.right)
      this.rightHandle.off("pointerdown", this.listeners.right);
    if (this.listeners.top)
      this.topHandle.off("pointerdown", this.listeners.top);
    if (this.listeners.bottom)
      this.bottomHandle.off("pointerdown", this.listeners.bottom);
    if (this.listeners.rect) this.rect.off("pointerdown", this.listeners.rect);

    this.listeners = {};
  }
}
export interface BlockSelection {
  trackId: number;
  index: number;
  uuid: string;
  groupUuid: string | null;
}
export interface BlockData {
  trackId: number;
  startTime: number;
  endTime: number;
  intensity: number;
  uuid: string;
  groupUuid: string | null;
}
export enum Direction {
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "bottom",
}
export enum TimelineEvents {
  TACTON_WAS_EDITED = "tactonWasEdited",
  TACTON_BLOCK_SELECTED = "tactonPartWasSelected",
  UPDATED_USER_LOCKS = "updatedUserLocks",
  CHANGE_SLIDER_INTERACTIVITY = "changeSliderInteractivity",
}
export const SnackbarTexts = {
  TACTON_IS_READONLY: (): string =>
    "This file is currently read-only. Enable edit-mode to make changes.",
  TACTON_CAN_BE_EDITED: (): string => "This file can now be edited.",
  BLOCKS_ARE_EDITED_BY_USER: (editorName?: string): string => {
    if (editorName) {
      return `The selected Blocks are currently edited by ${editorName}.`;
    } else {
      return `The selected Blocks are currently edited.`;
    }
  },
  SELECTION_EXPIRED: (): string =>
    "Your block selection expired due to inactivity and is now available for others to edit.",
};

export interface SliderStateSnapshot {
  initialZoom: number;
  zoom: number;
  initialViewportWidth: number;
  viewportWidth: number;
  horizontalViewportOffset: number;
}
