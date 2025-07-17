import { Container, Graphics } from "pixi.js";
import * as PIXI from "pixi.js";
import { getDynamicContainer } from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { Store, useStore } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";

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
export class Cursor {
  graphic: PIXI.Graphics = new PIXI.Graphics();
  position: number = 0;
  hasDrawnCursor: boolean = false;
  color: number;
  store: Store = useStore();
  constructor(color: number) {
    getDynamicContainer().addChild(this.graphic);
    this.color = color;
  }
  drawCursor(): void {
    this.hasDrawnCursor = true;

    this.graphic.clear();
    this.graphic.moveTo(
      config.leftPadding,
      config.sliderHeight + config.componentPadding,
    );
    this.graphic.lineTo(
      config.leftPadding,
      config.trackHeight * (this.store.state.timeline.trackCount + 1) +
        config.sliderHeight +
        config.componentPadding,
    );
    this.graphic.stroke({ width: 4, color: this.color });
    this.graphic._zIndex = 1;
  }
  moveToPosition(xPosition: number, isSliderFollowing: boolean = false): void {
    const middleOfCanvas: number = this.store.state.timeline.canvasWidth / 2;
    const isIndicatorAtViewportCenter: boolean =
      xPosition + config.leftPadding >= middleOfCanvas;
    if (isIndicatorAtViewportCenter && isSliderFollowing) {
      this.store.dispatch(
        TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
        xPosition + config.leftPadding - middleOfCanvas,
      );
      this.graphic.x =
        xPosition - this.store.state.timeline.horizontalViewportOffset;
    } else {
      this.graphic.x = xPosition;
    }
  }
}
export enum TimelineEvents {
  TACTON_WAS_EDITED = "tactonWasEdited",
  TACTON_BLOCK_SELECTED = "tactonPartWasSelected",
  TACTON_ALL_DESELECTED = "tactonAllDeselected",
}
