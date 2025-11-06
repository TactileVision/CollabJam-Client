import { Container, FederatedPointerEvent, Graphics } from "pixi.js";
import {
  BlockDTO,
  BlockSelection,
  Direction,
  EventHandler,
} from "@/renderer/helpers/timeline/types";
import config from "@/renderer/helpers/timeline/config";
import { Store, useStore } from "@/renderer/store/store";

export class Border {
  container: Container;
  border: Graphics;
  groupUuid: string | undefined = undefined;

  leftHandle: Graphics;
  leftIndicator: Graphics;
  rightHandle: Graphics;
  rightIndicator: Graphics;

  initStartX: number;
  lastStartX: number;
  initWidth: number;
  lastWidth: number;
  initY: number;
  lastY: number;
  initHeight: number;

  firstBlock: BlockSelection;
  lastBlock: BlockSelection;

  topHandle: Graphics;
  topIndicator: Graphics;
  bottomHandle: Graphics;
  bottomIndicator: Graphics;

  topBlock: BlockSelection;
  bottomBlock: BlockSelection;

  private listeners: {
    left?: EventHandler;
    right?: EventHandler;
    top?: EventHandler;
    bottom?: EventHandler;
  } = {};

  constructor(
    container: Container,
    border: Graphics,
    leftHandle: Graphics,
    leftIndicator: Graphics,
    rightHandle: Graphics,
    rightIndicator: Graphics,
    topHandle: Graphics,
    topIndicator: Graphics,
    bottomHandle: Graphics,
    bottomIndicator: Graphics,
    firstBlock: BlockSelection,
    lastBlock: BlockSelection,
    topBlock: BlockSelection,
    bottomBlock: BlockSelection,
    initStartX = 0,
    lastStartX = 0,
    initWidth = 0,
    lastWidth = 0,
    initY = 0,
    lastY = 0,
    initHeight = 0,
  ) {
    this.container = container;
    this.border = border;
    this.leftHandle = leftHandle;
    this.leftIndicator = leftIndicator;
    this.rightHandle = rightHandle;
    this.rightIndicator = rightIndicator;
    this.topHandle = topHandle;
    this.topIndicator = topIndicator;
    this.bottomHandle = bottomHandle;
    this.bottomIndicator = bottomIndicator;
    this.firstBlock = firstBlock;
    this.lastBlock = lastBlock;
    this.topBlock = topBlock;
    this.bottomBlock = bottomBlock;

    this.initStartX = initStartX;
    this.lastStartX = lastStartX;
    this.initWidth = initWidth;
    this.lastWidth = lastWidth;
    this.initY = initY;
    this.lastY = lastY;
    this.initHeight = initHeight;
  }

  addListeners(context: {
    onHorizontalResize: (
      e: FederatedPointerEvent,
      dir: Direction,
      groupUuid?: string,
    ) => void;
    onVerticalResize: (
      e: FederatedPointerEvent,
      dir: Direction,
      groupUuid?: string,
    ) => void;
  }): void {
    this.listeners.left = (e) =>
      context.onHorizontalResize(e, Direction.LEFT, this.groupUuid);
    this.listeners.right = (e) =>
      context.onHorizontalResize(e, Direction.RIGHT, this.groupUuid);
    this.listeners.top = (e) =>
      context.onVerticalResize(e, Direction.TOP, this.groupUuid);
    this.listeners.bottom = (e) =>
      context.onVerticalResize(e, Direction.BOTTOM, this.groupUuid);

    this.leftHandle.on("pointerdown", this.listeners.left);
    this.rightHandle.on("pointerdown", this.listeners.right);
    this.topHandle.on("pointerdown", this.listeners.top);
    this.bottomHandle.on("pointerdown", this.listeners.bottom);
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

    this.listeners = {};
  }
}
export function getBoundingData(
  selection: BlockSelection[],
  currentMemberUuid: string | null,
  lastTrackOffset?: number,
): BoundingData {
  const store: Store = useStore();
  let startX: number = Infinity;
  let endX: number = -Infinity;
  let lowestTrack: number = Infinity;
  let highestTrack: number = 0;
  let maxHeightOfLowestTrack: number = config.minBlockHeight;
  let maxHeightOfHighestTrack: number = config.minBlockHeight;
  let firstBlock!: BlockSelection;
  let lastBlock!: BlockSelection;
  let topBlock!: BlockSelection;
  let bottomBlock!: BlockSelection;

  for (const sel of selection) {
    const block: BlockDTO = store.state.timeline.blocks[sel.trackId][sel.index];
    const blockStart: number = block.rect.x;
    const blockEnd: number = blockStart + block.rect.width;
    let trackId: number = block.trackId;
    const height: number = block.rect.height;

    if (block.uuid === currentMemberUuid && lastTrackOffset != undefined) {
      console.log(
        "updating trackId. Original ",
        trackId,
        " offset: ",
        lastTrackOffset,
      );
      trackId += lastTrackOffset;
    }

    if (blockStart < startX) {
      startX = blockStart;
      firstBlock = sel;
    }
    if (blockEnd > endX) {
      endX = blockEnd;
      lastBlock = sel;
    }

    if (trackId < lowestTrack) {
      lowestTrack = trackId;
      maxHeightOfLowestTrack = height;
      topBlock = sel;
    } else if (trackId === lowestTrack && height > maxHeightOfLowestTrack) {
      maxHeightOfLowestTrack = height;
      topBlock = sel;
    }

    if (trackId > highestTrack) {
      highestTrack = trackId;
      maxHeightOfHighestTrack = height;
      bottomBlock = sel;
    } else if (trackId === highestTrack && height > maxHeightOfHighestTrack) {
      maxHeightOfHighestTrack = height;
      bottomBlock = sel;
    }
  }

  const groupWidth: number = endX - startX;
  const groupY: number =
    store.state.timeline.blocks[topBlock.trackId][topBlock.index].rect.y;
  const groupHeight: number =
    (highestTrack - lowestTrack) * config.trackHeight +
    Math.min(maxHeightOfLowestTrack, maxHeightOfHighestTrack) +
    Math.abs(maxHeightOfLowestTrack - maxHeightOfHighestTrack) / 2;

  return {
    startX,
    groupWidth,
    groupY,
    groupHeight,
    firstBlock,
    lastBlock,
    topBlock,
    bottomBlock,
  };
}
export interface BoundingData {
  startX: number;
  groupWidth: number;
  groupY: number;
  groupHeight: number;
  firstBlock?: BlockSelection;
  lastBlock?: BlockSelection;
  topBlock?: BlockSelection;
  bottomBlock?: BlockSelection;
}
