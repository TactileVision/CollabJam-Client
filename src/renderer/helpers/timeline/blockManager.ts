import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
} from "pixi.js";
import { watch } from "vue";
import { Store, useStore } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import {
  getDynamicContainer,
  getPixiApp,
} from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import {
  BlockChanges,
  BlockData,
  BlockDTO,
  BlockSelection,
  TimelineEvents,
} from "@/renderer/helpers/timeline/types";

interface SelectionBorderData {
  container: Container;
  border: Graphics;
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
  firstBlockOfGroup: BlockSelection;
  lastBlockOfGroup: BlockSelection;
}
interface GroupBorderData extends SelectionBorderData {
  topHandle: Graphics;
  topIndicator: Graphics;
  bottomHandle: Graphics;
  bottomIndicator: Graphics;
  topBlockOfGroup: BlockSelection;
  bottomBlockOfGroup: BlockSelection;
}
interface CopiedBlockData extends BlockData {
  groupId?: number;
}
enum Direction {
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "bottom",
}
class CopiedBlockDTO {
  rect: Graphics;
  initX: number;
  initY: number;
  initWidth: number;
  container: Container;
  trackId: number;
  initTrackId: number;
  groupId?: number;
  constructor(
    rect: Graphics,
    container: Container,
    trackId: number,
    groupId?: number,
  ) {
    this.rect = rect;
    this.initX = rect.x;
    this.initY = rect.y;
    this.initWidth = rect.width;
    this.container = container;
    this.trackId = trackId;
    this.initTrackId = trackId;
    this.groupId = groupId;
  }
}
export class BlockManager {
  // store
  private store: Store;

  // event
  public eventBus: EventTarget = new EventTarget();

  // cursor
  private initialX: number = 0;
  private initialY: number = 0;

  // eventHandler
  private pointerMoveHandler:
    | ((this: Window, ev: PointerEvent) => void)
    | null = null;
  private pointerUpHandler: ((this: Window, ev: PointerEvent) => void) | null =
    null;

  // resizing
  private isCollidingOnResize: boolean = false;
  private initialBlockWidth: number = 0;
  private initialBlockHeight: number = 0;
  private initialBlockX: number = 0;
  private resizeDirection: Direction | null = null;
  private lastValidDeltaX: number = 0;
  private moved: boolean = false;

  // proportional resize
  private selectionBorder: SelectionBorderData | null = null;
  private lastUidsCollisionLeft: number[] = [];
  private lastUidsCollisionRight: number[] = [];

  // collision-detection vars
  private unselectedBorders: number[][] = [];
  private selectedBorders: number[][] = [];
  private selectedTracks: number[] = [];
  private lastValidOffset: number = 0;
  private lastTrackOffset: number = 0;
  private lastViewportOffset: number = 0;
  private stickyOffsetsPerTrackOffset: Map<number, number[]> = new Map();

  // validation data
  private validTrackOffsets: number[] = [];
  private minTrackChange: number = 0;
  private maxTrackChange: number = 0;

  // horizontal viewport-scrolling
  private isScrolling: boolean = false;
  private currentDirection: Direction | null = null;
  private currentFactor: number = 0;
  private currentTacton: BlockDTO | CopiedBlockDTO | null = null;

  // thresholds for viewport-scrolling
  private rightThreshold: number = 0;
  private leftThreshold: number = 0;
  private topThreshold: number = 0;
  private bottomThreshold: number = 0;

  // vertical viewport-scrolling
  private currentYAdjustment: number = 0;
  private lastVerticalOffset: number = 0;

  // copy & paste
  private isMacOS: boolean = false;
  private strgDown: boolean = false;
  private selectedBlockUids: number[] = [];
  private copiedBlocks: CopiedBlockDTO[] = [];
  private lastCursorX: number = 0;
  private initYTrackId: number = 0;

  // multi selection
  private isSelecting: boolean = false;
  private isMouseDragging: boolean = false;
  private selectionStart = { x: 0, y: 0 };
  private selectionEnd = { x: 0, y: 0 };

  // groups
  private renderedGroupBorders: Map<number, GroupBorderData> = new Map<
    number,
    GroupBorderData
  >();

  //private showSnackbar = inject('showSnackbar') as (data: SnackbarData) => void;

  // updateHooks
  private updated: boolean = false;
  constructor() {
    this.store = useStore();

    watch(
      () => this.store.state.timeline.zoomLevel,
      this.onZoomLevelChange.bind(this),
    );
    watch(
      () => this.store.state.timeline.horizontalViewportOffset,
      this.onHorizontalViewportChange.bind(this),
    );
    watch(
      () => this.store.state.timeline.currentCursorPosition,
      ({ x, y }): void => {
        if (this.copiedBlocks.length > 0) {
          // follow cursor
          this.scrollViewportHorizontal(x);
          this.scrollViewportVertical(y);
          this.updateCopiedBlocks();
        }
      },
    );
    watch(
      () => this.store.state.timeline.trackCount,
      (value, oldValue): void => {
        // update maxTrackChange
        this.maxTrackChange += oldValue + value;
      },
    );
    watch(
      () => this.store.state.timeline.isEditable,
      this.handleEditMode.bind(this),
    );
    watch(
      () => this.store.state.timeline.canvasWidth,
      (): void => {
        this.calculateVirtualViewportLength();
        this.generateThresholds();
      },
    );

    this.generateThresholds();

    // detect strg
    document.addEventListener("keydown", (event: KeyboardEvent): void => {
      if (!this.store.state.timeline.isEditable) return;
      // detect STRG or Meta
      if (event.code == "ControlLeft" && !this.isMacOS) {
        if (!this.strgDown) {
          this.drawSelectionBorder();
          this.strgDown = true;
        }
      } else if (event.code == "MetaLeft") {
        if (!this.strgDown) {
          this.drawSelectionBorder();
          this.strgDown = true;
          if (!this.isMacOS) {
            this.isMacOS = true;
          }
        }
      }

      if (this.strgDown && event.code == "KeyC") this.copySelection();
      if (this.strgDown && event.code == "KeyV") this.pasteSelection();
      if (this.strgDown && event.code == "KeyG") {
        event.preventDefault();
        this.groupSelectedBlocks();
      }
      if (this.strgDown && event.code == "KeyS") {
        event.preventDefault();
        this.store.dispatch(TimelineActionTypes.TOGGLE_SNAPPING_STATE);
      }
      if (event.code == "Escape") this.clearCopiedBlocks();
      if (event.code == "Delete") this.deleteBlock();

      // detect shift
      if (event.key == "Shift" && !this.store.state.timeline.isPressingShift) {
        this.store.dispatch(TimelineActionTypes.TOGGLE_SHIFT_VALUE);
      }
    });

    document.addEventListener("keyup", (event: KeyboardEvent): void => {
      if (!this.store.state.timeline.isEditable) return;
      if (
        (event.code == "ControlLeft" && !this.isMacOS) ||
        event.code == "MetaLeft"
      ) {
        this.strgDown = false;
        this.clearSelectionBorder();
        this.forEachSelectedBlock((block: BlockDTO): void => {
          if (block.groupId != null) return;
          this.updateHandles(block);
          this.updateIndicators(block);
          this.updateIndicatorVisibility(block, true);
          this.updateHandleInteractivity(block, true);
        });
      }

      if (event.key == "Shift" && this.store.state.timeline.isPressingShift) {
        this.store.dispatch(TimelineActionTypes.TOGGLE_SHIFT_VALUE);
      }
    });

    this.installEventListeners();

    // init as not editable
    this.handleEditMode();
  }
  createBlocksFromData(blockData: BlockData[]): void {
    // clear rendered borders
    this.renderedGroupBorders.forEach(
      (borderData: GroupBorderData, groupId: number): void => {
        this.clearGroupBorder(groupId);
      },
    );
    this.clearSelectionBorder();

    // clear stored blocks
    this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS);

    // init tracks
    this.store.dispatch(TimelineActionTypes.INIT_TRACKS);

    // create, render and save block in store
    blockData.forEach((block: BlockData): void => {
      this.createBlock(block);
    });

    // detect blocks with dist == 0 and create group
    const variance: number = 0.05;
    // iterate over tracks
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        // iterate over blocks per track
        let before: BlockDTO | null = null;
        let currentDetectedGroup: {
          groupId: number;
          selection: BlockSelection[];
        } | null = null;
        const detectedGroups: {
          groupId: number;
          selection: BlockSelection[];
        }[] = [];
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO, index: number): void => {
            if (before == null) {
              // first block of track
              before = block;
            } else {
              const endOfBefore: number = before.rect.x + before.rect.width;
              if (block.rect.x - endOfBefore <= variance) {
                // group detected
                if (currentDetectedGroup == null) {
                  // first of group

                  // create group
                  currentDetectedGroup = {
                    groupId: before.rect.uid,
                    selection: [],
                  };

                  // add before and current block
                  currentDetectedGroup.selection.push({
                    trackId: trackId,
                    index: index - 1,
                    uid: before.rect.uid,
                  });
                  currentDetectedGroup.selection.push({
                    trackId: trackId,
                    index: index,
                    uid: block.rect.uid,
                  });

                  // add groupId to blocks
                  this.store.state.timeline.blocks[trackId][index - 1].groupId =
                    currentDetectedGroup.groupId;
                  this.store.state.timeline.blocks[trackId][index].groupId =
                    currentDetectedGroup.groupId;
                } else {
                  // add to current group
                  currentDetectedGroup.selection.push({
                    trackId: trackId,
                    index: index,
                    uid: block.rect.uid,
                  });

                  // add groupId to block
                  this.store.state.timeline.blocks[trackId][index].groupId =
                    currentDetectedGroup.groupId;
                }
              } else {
                if (currentDetectedGroup != null) {
                  // end of current group - push groupData
                  detectedGroups.push(currentDetectedGroup);
                  currentDetectedGroup = null;
                }
              }

              // last block of track - push detected groups
              if (
                this.store.state.timeline.blocks[trackId][index + 1] ==
                undefined
              ) {
                if (currentDetectedGroup != null) {
                  detectedGroups.push(currentDetectedGroup);
                }
              }
              before = block;
            }
          },
        );

        if (detectedGroups.length > 0) {
          detectedGroups.forEach(
            (groupData: { groupId: number; selection: BlockSelection[] }) => {
              this.store.dispatch(TimelineActionTypes.ADD_GROUP, groupData);
            },
          );
        }
      },
    );

    // update blocks, handles and strokes
    this.forEachBlock((block: BlockDTO): void => {
      this.updateBlock(block);
      this.updateHandles(block);
      this.updateStroke(block);
      this.updateIndicators(block);
    });

    this.store.dispatch(TimelineActionTypes.GET_LAST_BLOCK_POSITION);
  }
  private createBlock(block: BlockData): BlockDTO {
    const rect: Graphics = new Graphics();
    rect.rect(0, 0, 1, 1);
    rect.fill(config.colors.tactonColor);
    rect.interactive = true;
    rect.cursor = "pointer";

    const position: { x: number; width: number } =
      this.calculatePosition(block);
    rect.x = position.x;
    rect.width = position.width;
    rect.height = block.intensity * config.maxBlockHeight;
    rect.y =
      config.sliderHeight +
      config.componentPadding +
      block.trackId * config.trackHeight +
      (config.trackHeight / 2 - rect.height / 2);

    const strokedRect: Graphics = new Graphics();
    strokedRect.rect(0, 0, 1, 1);
    strokedRect.fill(config.colors.selectedBlockColor);
    strokedRect.visible = false;

    const leftHandle: Graphics = new Graphics();
    const leftIndicator: Graphics = new Graphics();
    const rightHandle: Graphics = new Graphics();
    const rightIndicator: Graphics = new Graphics();
    const topHandle: Graphics = new Graphics();
    const topIndicator: Graphics = new Graphics();
    const bottomHandle: Graphics = new Graphics();
    const bottomIndicator: Graphics = new Graphics();

    // left handle
    leftHandle.rect(0, 0, 1, 1);
    leftHandle.fill(config.colors.handleColor);
    leftHandle.interactive = true;
    leftHandle.cursor = "ew-resize";

    leftIndicator.circle(0, 0, config.blockHandleIndicatorRadius);
    leftIndicator.cursor = "pointer";
    leftIndicator.visible = false;

    // right handle
    rightHandle.rect(0, 0, 1, 1);
    rightHandle.fill(config.colors.handleColor);
    rightHandle.interactive = true;
    rightHandle.cursor = "ew-resize";

    rightIndicator.circle(0, 0, config.blockHandleIndicatorRadius);
    rightIndicator.cursor = "pointer";
    rightIndicator.visible = false;

    // top handle
    topHandle.rect(0, 0, 1, 1);
    topHandle.fill(config.colors.handleColor);
    topHandle.interactive = true;
    topHandle.cursor = "ns-resize";

    topIndicator.circle(0, 0, config.blockHandleIndicatorRadius);
    topIndicator.cursor = "pointer";
    topIndicator.visible = false;

    // bottom handle
    bottomHandle.rect(0, 0, 1, 1);
    bottomHandle.fill(config.colors.handleColor);
    bottomHandle.interactive = true;
    bottomHandle.cursor = "ns-resize";

    bottomIndicator.circle(0, 0, config.blockHandleIndicatorRadius);
    bottomIndicator.cursor = "pointer";
    bottomIndicator.visible = false;

    const blockContainer: Container = new Container();
    blockContainer.addChild(rect);
    blockContainer.addChild(strokedRect);
    blockContainer.addChild(leftHandle);
    blockContainer.addChild(leftIndicator);
    blockContainer.addChild(rightHandle);
    blockContainer.addChild(rightIndicator);
    blockContainer.addChild(topHandle);
    blockContainer.addChild(topIndicator);
    blockContainer.addChild(bottomHandle);
    blockContainer.addChild(bottomIndicator);

    // assign methods
    const dto: BlockDTO = new BlockDTO(
      rect,
      strokedRect,
      leftHandle,
      leftIndicator,
      rightHandle,
      rightIndicator,
      topHandle,
      topIndicator,
      bottomHandle,
      bottomIndicator,
      blockContainer,
      block.trackId,
    );

    leftHandle.on("pointerdown", (event) =>
      this.onAbsoluteResizeStart(event, dto, Direction.LEFT),
    );
    rightHandle.on("pointerdown", (event) =>
      this.onAbsoluteResizeStart(event, dto, Direction.RIGHT),
    );
    topHandle.on("pointerdown", (event) =>
      this.onChangeAmplitude(event, dto, Direction.TOP),
    );
    bottomHandle.on("pointerdown", (event) =>
      this.onChangeAmplitude(event, dto, Direction.BOTTOM),
    );
    rect.on("pointerdown", (event) => this.onMoveBlock(event, dto));

    this.store.dispatch(TimelineActionTypes.ADD_BLOCK, {
      trackId: block.trackId,
      block: dto,
    });
    getDynamicContainer().addChild(blockContainer);
    return dto;
  }
  private createCopiedBLock(block: CopiedBlockData): CopiedBlockDTO {
    const rect: Graphics = new Graphics();
    rect.rect(0, 0, 1, 1);
    rect.fill(config.colors.copyColor);

    const position: { x: number; width: number } =
      this.calculatePosition(block);
    rect.x =
      config.leftPadding + position.x * this.store.state.timeline.zoomLevel;
    rect.width = position.width * this.store.state.timeline.zoomLevel;
    rect.height = block.intensity * config.maxBlockHeight;
    rect.y =
      config.sliderHeight +
      config.componentPadding +
      block.trackId * config.trackHeight +
      (config.trackHeight / 2 - rect.height / 2);

    const blockContainer: Container = new Container();
    blockContainer.addChild(rect);

    return new CopiedBlockDTO(
      rect,
      blockContainer,
      block.trackId,
      block.groupId,
    );
  }
  private calculatePosition(tacton: BlockData): { x: number; width: number } {
    const timelineWidth: number = this.store.state.timeline.canvasWidth;
    const totalDuration: number =
      (timelineWidth / config.pixelsPerSecond) * 1000;
    return {
      x: (tacton.startTime / totalDuration) * timelineWidth,
      width:
        ((tacton.endTime - tacton.startTime) / totalDuration) * timelineWidth,
    };
  }
  private createBlockDataFromBlocks(
    blocks: BlockDTO[] | CopiedBlockDTO[],
  ): CopiedBlockData[] {
    const blockData: CopiedBlockData[] = [];
    const timelineWidth: number = this.store.state.timeline.canvasWidth;
    const totalDuration: number =
      (timelineWidth / config.pixelsPerSecond) * 1000;

    blocks.forEach((block: BlockDTO | CopiedBlockDTO): void => {
      const convertedX: number =
        (block.rect.x -
          config.leftPadding +
          this.store.state.timeline.horizontalViewportOffset) /
        this.store.state.timeline.zoomLevel;
      const convertedWidth: number =
        block.rect.width / this.store.state.timeline.zoomLevel;
      const startTime: number = (convertedX / timelineWidth) * totalDuration;
      const endTime: number =
        startTime + (convertedWidth / timelineWidth) * totalDuration;
      const intensity: number = block.rect.height / config.maxBlockHeight;

      blockData.push({
        trackId: block.trackId,
        startTime: startTime,
        endTime: endTime,
        intensity: intensity,
        groupId: block.groupId,
      });
    });

    return blockData;
  }
  private generateThresholds(): void {
    const scaleFactor: number =
      Math.max(
        0,
        this.store.state.timeline.initialZoomLevel -
          this.store.state.timeline.zoomLevel,
      ) + 1;
    this.rightThreshold =
      this.store.state.timeline.canvasWidth -
      config.horizontalScrollThreshold / scaleFactor;
    this.leftThreshold = config.horizontalScrollThreshold / scaleFactor;
    this.topThreshold = config.sliderHeight + config.verticalScrollThreshold;
    this.bottomThreshold = window.innerHeight - config.verticalScrollThreshold;
  }
  private applyChanges(changes: BlockChanges): void {
    const minBlockWidth = this.getMinBlockWidth();
    this.forEachSelectedBlock((block: BlockDTO): void => {
      let isWidthClipped: boolean = false;
      // apply Changes
      if (changes.height) {
        const newHeight: number = Math.min(
          Math.max(block.rect.height + changes.height, 10),
          150,
        );
        block.rect.height = newHeight;
        const trackOffset: number =
          config.sliderHeight +
          config.componentPadding +
          block.trackId * config.trackHeight;
        const newY: number = config.trackHeight / 2 - newHeight / 2;
        block.rect.y = newY + trackOffset;
      }

      if (changes.track != null) {
        const trackContainerY: number = block.trackId * config.trackHeight;
        const newTrackContainerY: number =
          (block.trackId + changes.track) * config.trackHeight;
        block.rect.y = newTrackContainerY - trackContainerY + block.initY;
      }

      if (changes.width != null) {
        block.rect.width = Math.max(
          block.rect.width + changes.width,
          minBlockWidth,
        );
        if (block.rect.width == minBlockWidth) {
          isWidthClipped = true;
        }
      }

      if (changes.x!) {
        if (isWidthClipped && changes.width) return;
        block.rect.x += changes.x;

        // mark track as unsorted
        this.store.state.timeline.sorted[block.trackId] = false;
      }

      this.updateStroke(block);
      this.updateIndicators(block);
    });

    this.renderedGroupBorders.forEach(
      (borderData: GroupBorderData, groupId: number): void => {
        this.updateGroup(groupId, true);
      },
    );
  }

  //*************** Update-Methods ***************

  // maybe improve performance by not storing strokes and handles and keeping them updated
  // rather create, render and update them, only if they are needed
  private updateBlock(block: BlockDTO): void {
    block.rect.width = block.initWidth * this.store.state.timeline.zoomLevel;
    block.rect.x =
      config.leftPadding +
      block.initX * this.store.state.timeline.zoomLevel -
      this.store.state.timeline.horizontalViewportOffset;
  }
  private updateCopiedBlocks(): void {
    // detect switching tracks
    const currentYTrackId: number = Math.floor(
      Math.max(
        0,
        this.store.state.timeline.currentCursorPosition.y -
          getDynamicContainer().y -
          config.sliderHeight -
          config.componentPadding,
      ) / config.trackHeight,
    );
    const trackChange: number = Math.max(
      this.minTrackChange,
      Math.min(currentYTrackId - this.initYTrackId, this.maxTrackChange),
    );

    let diff: number =
      this.store.state.timeline.currentCursorPosition.x - this.lastCursorX;
    diff = this.adjustOffset(diff, trackChange);
    this.copiedBlocks.forEach((block: CopiedBlockDTO): void => {
      block.rect.x = block.initX + diff;

      const trackContainerY: number = block.trackId * config.trackHeight;
      const newTrackContainerY: number =
        (block.trackId + trackChange) * config.trackHeight;
      block.rect.y = newTrackContainerY - trackContainerY + block.initY;
      block.trackId = trackChange + block.initTrackId;
    });
  }
  private updateBlockInitData(block: BlockDTO): void {
    // update data
    block.initY = block.rect.y;
    block.initX =
      (block.rect.x +
        this.store.state.timeline.horizontalViewportOffset -
        config.leftPadding) /
      this.store.state.timeline.zoomLevel;
  }
  private updateHandles(block: BlockDTO): void {
    // update left handle
    block.leftHandle.clear();
    block.leftHandle.rect(
      block.rect.x - config.resizingHandleWidth,
      block.rect.y,
      config.resizingHandleWidth,
      block.rect.height,
    );
    block.leftHandle.fill(config.colors.handleColor);

    // update right handle
    block.rightHandle.clear();
    block.rightHandle.rect(
      block.rect.x + block.rect.width,
      block.rect.y,
      config.resizingHandleWidth,
      block.rect.height,
    );
    block.rightHandle.fill(config.colors.handleColor);

    // update top handle
    block.topHandle.clear();
    block.topHandle.rect(
      block.rect.x,
      block.rect.y - config.resizingHandleWidth,
      block.rect.width,
      config.resizingHandleWidth,
    );

    block.topHandle.fill(config.colors.handleColor);

    // update bottom handle
    block.bottomHandle.clear();
    block.bottomHandle.rect(
      block.rect.x,
      block.rect.y + block.rect.height,
      block.rect.width,
      config.resizingHandleWidth,
    );

    block.bottomHandle.fill(config.colors.handleColor);
  }
  private updateHandleInteractivity(
    block: BlockDTO,
    isInteractive: boolean,
  ): void {
    block.leftHandle.interactive = isInteractive;
    block.rightHandle.interactive = isInteractive;
    block.topHandle.interactive = isInteractive;
    block.bottomHandle.interactive = isInteractive;
  }
  private updateStroke(block: BlockDTO): void {
    block.strokedRect.x = block.rect.x;
    block.strokedRect.width = block.rect.width;
    block.strokedRect.y = block.rect.y;
    block.strokedRect.height = block.rect.height;
  }
  private updateIndicators(block: BlockDTO): void {
    block.leftIndicator.clear();
    block.leftIndicator.circle(
      block.rect.x,
      block.rect.y + block.rect.height / 2,
      config.blockHandleIndicatorRadius,
    );
    block.leftIndicator.fill(config.colors.groupHandleColor);

    block.rightIndicator.clear();
    block.rightIndicator.circle(
      block.rect.x + block.rect.width,
      block.rect.y + block.rect.height / 2,
      config.blockHandleIndicatorRadius,
    );
    block.rightIndicator.fill(config.colors.groupHandleColor);

    block.topIndicator.clear();
    block.topIndicator.circle(
      block.rect.x + block.rect.width / 2,
      block.rect.y,
      config.blockHandleIndicatorRadius,
    );
    block.topIndicator.fill(config.colors.groupHandleColor);

    block.bottomIndicator.clear();
    block.bottomIndicator.circle(
      block.rect.x + block.rect.width / 2,
      block.rect.y + block.rect.height,
      config.blockHandleIndicatorRadius,
    );
    block.bottomIndicator.fill(config.colors.groupHandleColor);
  }
  private updateIndicatorVisibility(block: BlockDTO, isVisible: boolean): void {
    block.leftIndicator.visible = isVisible;
    block.rightIndicator.visible = isVisible;
    block.topIndicator.visible = isVisible;
    block.bottomIndicator.visible = isVisible;
  }

  //*************** Update-Hooks ***************

  // executes callback-function on every block
  private forEachBlock(callback: (block: BlockDTO) => void): void {
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO): void => {
            callback(block);
          },
        );
      },
    );
  }

  // executes callback-function on every selected block
  private forEachSelectedBlock(callback: (block: BlockDTO) => void): void {
    this.store.state.timeline.selectedBlocks.forEach(
      (selection: BlockSelection): void => {
        callback(
          this.store.state.timeline.blocks[selection.trackId][selection.index],
        );
      },
    );
  }

  // executes callback-function on every selected block
  private forEachUnselectedBlock(callback: (block: BlockDTO) => void): void {
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO): void => {
            const isSelected: boolean =
              this.store.state.timeline.selectedBlocks.some(
                (selection: BlockSelection): boolean =>
                  selection.uid == block.rect.uid,
              );
            if (!isSelected) {
              callback(block);
            }
          },
        );
      },
    );
  }

  // Updates all blocks, updates strokes of selected blocks (these are visible)
  private onZoomLevelChange(): void {
    this.forEachBlock((block: BlockDTO): void => {
      this.updateBlock(block);
      if (this.isBlockSelected(block)) {
        this.updateStroke(block);
        this.updateIndicators(block);
      }
    });
    this.generateThresholds();
    this.updateSelectionBorder();
    this.renderedGroupBorders.forEach(
      (groupBorder: GroupBorderData, groupId: number): void => {
        this.updateGroup(groupId, true);
      },
    );
    this.updated = true;
  }

  // Updates all unselected blocks of scrolling, update all blocks if moving slider
  private onHorizontalViewportChange(): void {
    if (!this.updated) {
      if (this.isScrolling) {
        // update only blocks that are not selected
        this.forEachUnselectedBlock((block: BlockDTO): void => {
          this.updateBlock(block);
        });
      } else {
        // update all blocks
        this.forEachBlock((block: BlockDTO): void => {
          this.updateBlock(block);
          if (this.isBlockSelected(block)) {
            this.updateStroke(block);
            this.updateIndicators(block);
          }
        });
      }
      this.updateSelectionBorder();
      this.renderedGroupBorders.forEach(
        (groupBorder: GroupBorderData, groupId: number): void => {
          this.updateGroup(groupId, true);
        },
      );
    }
    this.updated = false;
  }

  // Updates all handles and initData, updates strokes of not selected blocks (are not visible, so only update once after scaling)
  onSliderScaleEnd(): void {
    this.forEachBlock((block: BlockDTO): void => {
      this.updateHandles(block);
      if (!this.isBlockSelected(block)) {
        this.updateStroke(block);
        this.updateIndicators(block);
      }
      this.updateBlockInitData(block);
    });
    this.updated = false;
  }

  //*************** Interactions ***************
  private handleSelection(toSelect: BlockDTO | BlockSelection[]): void {
    console.log(toSelect);
    if (!this.store.getters.canEditTacton) {
      return;
    }

    if (Array.isArray(toSelect) && toSelect.length == 0) {
      this.eventBus.dispatchEvent(
        new Event(TimelineEvents.TACTON_ALL_DESELECTED),
      );
    } else {
      this.eventBus.dispatchEvent(
        new Event(TimelineEvents.TACTON_BLOCK_SELECTED),
      );
    }

    if (!this.store.state.timeline.isEditable) {
      /*            this.showSnackbar({
                message: 'This file is currently read-only. Enable edit mode to make changes.',
                color: 'warning',
                icon: 'mdi-lead-pencil',
                timer: 4000
            });*/
      return;
    }

    if (Array.isArray(toSelect)) {
      if (!this.store.state.timeline.isPressingShift) {
        this.forEachSelectedBlock((block: BlockDTO): void => {
          block.strokedRect.visible = false;
          this.updateIndicatorVisibility(block, false);
        });
        this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
        this.clearGroupBorder();
      }

      // detect groups
      const foundGroupIds: number[] = [];
      toSelect.forEach((selection: BlockSelection): void => {
        const block: BlockDTO =
          this.store.state.timeline.blocks[selection.trackId][selection.index];
        if (block.groupId) {
          // save groupId
          if (
            !foundGroupIds.some(
              (groupId: number): boolean => groupId == block.groupId,
            )
          ) {
            foundGroupIds.push(block.groupId);
          }
        } else {
          // select, if not grouped
          block.strokedRect.visible = true;
          this.updateIndicatorVisibility(block, true);
          this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, selection);
        }
      });

      foundGroupIds.forEach((groupId: number): void => {
        this.createGroupBorder(
          groupId,
          this.store.state.timeline.groups.get(groupId)!,
        );
        this.store.state.timeline.groups
          .get(groupId)!
          .forEach((selection: BlockSelection): void => {
            const block =
              this.store.state.timeline.blocks[selection.trackId][
                selection.index
              ];
            block.strokedRect.visible = true;
            this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, selection);
          });
      });
    } else {
      // check if selected or not
      const index: number = this.store.state.timeline.blocks[
        toSelect.trackId
      ].findIndex(
        (other: BlockDTO): boolean => other.rect.uid === toSelect.rect.uid,
      );
      if (index !== -1) {
        const selectionIndex: number =
          this.store.state.timeline.selectedBlocks.findIndex(
            (selection: BlockSelection): boolean =>
              selection.uid === toSelect.rect.uid,
          );
        const selection: BlockSelection = {
          trackId: toSelect.trackId,
          index: index,
          uid: toSelect.rect.uid,
        };
        if (selectionIndex == -1) {
          // block is not selected
          if (!this.store.state.timeline.isPressingShift) {
            // clear selection
            this.forEachSelectedBlock((block: BlockDTO): void => {
              block.strokedRect.visible = false;
              this.updateIndicatorVisibility(block, false);
            });
            this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
            this.clearGroupBorder();
          }

          // check for group
          if (toSelect.groupId == null) {
            // add block to selection
            this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, selection);

            toSelect.strokedRect.visible = true;
            this.updateIndicatorVisibility(toSelect, true);
          } else {
            this.createGroupBorder(
              toSelect.groupId,
              this.store.state.timeline.groups.get(toSelect.groupId)!,
            );
            this.store.state.timeline.groups
              .get(toSelect.groupId)!
              .forEach((selection: BlockSelection): void => {
                const block =
                  this.store.state.timeline.blocks[selection.trackId][
                    selection.index
                  ];
                block.strokedRect.visible = true;
                this.store.dispatch(
                  TimelineActionTypes.SELECT_BLOCK,
                  selection,
                );
              });
          }
        } else {
          // block already selected
          if (this.store.state.timeline.isPressingShift) {
            if (toSelect.groupId != null) {
              // remove from store
              this.store.state.timeline.groups
                .get(toSelect.groupId)!
                .forEach((selection: BlockSelection): void => {
                  const block: BlockDTO =
                    this.store.state.timeline.blocks[selection.trackId][
                      selection.index
                    ];
                  const selectionIndex: number =
                    this.store.state.timeline.selectedBlocks.findIndex(
                      (other: BlockSelection): boolean =>
                        other.uid === selection.uid,
                    );
                  this.store.dispatch(
                    TimelineActionTypes.UNSELECT_BLOCK,
                    selectionIndex,
                  );
                  block.strokedRect.visible = false;
                });

              // remove groupBorder
              this.clearGroupBorder(toSelect.groupId);
            } else {
              // remove block from selection
              this.store.dispatch(
                TimelineActionTypes.UNSELECT_BLOCK,
                selectionIndex,
              );
              toSelect.strokedRect.visible = false;
              this.updateIndicatorVisibility(toSelect, false);
            }
          }
        }
      }
    }
  }
  private copySelection(): void {
    this.clearCopiedBlocks();
    const selectedBlocks: BlockDTO[] = [];

    this.store.state.timeline.selectedBlocks.forEach(
      (selection: BlockSelection): void => {
        selectedBlocks.push(
          this.store.state.timeline.blocks[selection.trackId][selection.index],
        );
        this.selectedBlockUids.push(selection.uid);
      },
    );

    let maxTrackId: number = -Infinity;
    let minTrackId: number = Infinity;
    // copy blocks
    if (selectedBlocks.length > 0) {
      const copiedBlockData: CopiedBlockData[] =
        this.createBlockDataFromBlocks(selectedBlocks);
      let lowestXofCopies: number = Infinity;
      copiedBlockData.forEach((blockData: BlockData): void => {
        const block: CopiedBlockDTO = this.createCopiedBLock(blockData);
        if (block.rect.x < lowestXofCopies) lowestXofCopies = block.rect.x;
        this.copiedBlocks.push(block);
        getDynamicContainer().addChild(block.container);

        if (block.trackId > maxTrackId) maxTrackId = block.trackId;
        if (block.trackId < minTrackId) minTrackId = block.trackId;
      });

      const offset: number =
        this.store.state.timeline.currentCursorPosition.x - lowestXofCopies;

      this.initYTrackId = Math.floor(
        Math.max(
          0,
          this.store.state.timeline.currentCursorPosition.y -
            getDynamicContainer().y -
            config.sliderHeight -
            config.componentPadding,
        ) / config.trackHeight,
      );
      this.initYTrackId = Math.max(
        0,
        Math.min(this.initYTrackId, this.store.state.timeline.trackCount),
      );
      let trackChange: number = this.initYTrackId - minTrackId;

      if (maxTrackId + trackChange > this.store.state.timeline.trackCount) {
        trackChange = this.store.state.timeline.trackCount - maxTrackId;
      }

      this.copiedBlocks.forEach((block: CopiedBlockDTO): void => {
        block.rect.x = block.rect.x + offset;
        block.initX = block.rect.x;

        const newTrackId: number = block.trackId + trackChange;
        block.rect.y =
          config.sliderHeight +
          config.componentPadding +
          newTrackId * config.trackHeight +
          (config.trackHeight / 2 - block.rect.height / 2);
        block.initY = block.rect.y;
        block.trackId = newTrackId;
        block.initTrackId = newTrackId;
      });

      // calculate and init borders for collision detection
      this.createBordersForCopies();

      // create validTrackOffsets for collisionDetection and change validation
      this.minTrackChange = Math.min(...this.validTrackOffsets);
      this.maxTrackChange = Math.max(...this.validTrackOffsets);

      // set vars for collisionDetection
      this.initialX = this.store.state.timeline.currentCursorPosition.x;
      this.initialY = this.store.state.timeline.currentCursorPosition.y;
      this.lastCursorX = this.initialX;
      this.currentTacton = this.copiedBlocks[this.copiedBlocks.length - 1];

      this.updateCopiedBlocks();

      // unselect copied blocks
      this.forEachSelectedBlock((block: BlockDTO): void => {
        this.updateIndicatorVisibility(block, false);
        block.strokedRect.visible = false;
      });

      this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);

      if (this.selectionBorder != null) {
        this.clearSelectionBorder();
      }

      this.renderedGroupBorders.forEach(
        (borderData: GroupBorderData, groupId: number) => {
          this.clearGroupBorder(groupId);
        },
      );
    }
  }
  private pasteSelection(): void {
    if (this.copiedBlocks.length == 0) return;
    const copiedBlockData: CopiedBlockData[] = this.createBlockDataFromBlocks(
      this.copiedBlocks,
    );
    const addedBlockIds: number[] = [];

    // separate by groupId
    const groupedCopiedBlockData: Map<number | undefined, CopiedBlockData[]> =
      new Map<number | undefined, CopiedBlockData[]>();

    for (const block of copiedBlockData) {
      const key: number | undefined = block.groupId;
      if (!groupedCopiedBlockData.has(key)) {
        groupedCopiedBlockData.set(key, []);
      }
      groupedCopiedBlockData.get(key)!.push(block);
    }

    groupedCopiedBlockData.forEach(
      (
        copiedBlockData: CopiedBlockData[],
        oldGroupId: number | undefined,
      ): void => {
        if (oldGroupId == undefined) {
          // blocks were not grouped
          copiedBlockData.forEach((blockData: CopiedBlockData): void => {
            const block: BlockDTO = this.createBlock(blockData);
            addedBlockIds.push(block.rect.uid);
          });
        } else {
          // blocks were grouped
          let groupId: number | undefined;
          const groupSelectionData: BlockSelection[] = [];

          // create new blocks
          copiedBlockData.forEach((blockData: CopiedBlockData): void => {
            // create block
            const block: BlockDTO = this.createBlock(blockData);

            if (groupId == undefined) {
              groupId = block.rect.uid;
            }
            block.groupId = groupId;

            addedBlockIds.push(block.rect.uid);
            // 0 is used as dummy index, after adding all copied blocks, the stored data is sorted, thus updating the indices to the correct values
            groupSelectionData.push({
              trackId: block.trackId,
              index: 0,
              uid: block.rect.uid,
            });
          });

          if (groupId == undefined) {
            console.error("GroupId is undefined");
            return;
          }

          // create group
          this.store.dispatch(TimelineActionTypes.ADD_GROUP, {
            groupId: groupId,
            selection: groupSelectionData,
          });
        }
      },
    );

    // update blocks, handles and strokes
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO): void => {
            if (
              addedBlockIds.some((id: number): boolean => id == block.rect.uid)
            ) {
              this.updateBlock(block);
              this.updateHandles(block);
              this.updateStroke(block);
              this.updateIndicators(block);
              this.updateBlockInitData(block);
            }
          },
        );
      },
    );

    this.calculateVirtualViewportLength();

    // remove copies and clear arrays
    this.copiedBlocks.forEach((block: CopiedBlockDTO): void => {
      block.container.destroy({ children: true });
    });

    // enable handles of previously selected blocks
    this.forEachBlock((block: BlockDTO): void => {
      if (
        this.selectedBlockUids.some(
          (uid: number): boolean => uid == block.rect.uid,
        )
      ) {
        // enable handles
        block.leftHandle.interactive = true;
        block.rightHandle.interactive = true;
        block.topHandle.interactive = true;
        block.bottomHandle.interactive = true;
      }
    });

    this.copiedBlocks = [];
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }
  private clearCopiedBlocks(): void {
    if (this.copiedBlocks.length > 0) {
      this.copiedBlocks.forEach((block: CopiedBlockDTO): void => {
        block.container.destroy({ children: true });
      });

      this.copiedBlocks = [];
      return;
    }
  }
  private deleteBlock(): void {
    this.store.dispatch(TimelineActionTypes.DELETE_SELECTED_BLOCKS);
    this.calculateVirtualViewportLength();
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }
  private onMoveBlock(event: FederatedPointerEvent, block: BlockDTO): void {
    // if groupBorder is active, update
    if (this.selectionBorder) {
      // dont update, if there will be less then two blocks (requirement for proportional resizing)
      const isBlockSelected: boolean =
        this.store.state.timeline.selectedBlocks.some(
          (selection: BlockSelection): boolean =>
            selection.uid == block.rect.uid,
        );
      if (
        this.store.state.timeline.selectedBlocks.length >= 3 ||
        !isBlockSelected
      ) {
        // select / deselect block
        this.handleSelection(block);

        if (isBlockSelected) {
          this.updateHandleInteractivity(block, true);
        }
      }
      this.drawSelectionBorder();
    } else {
      // select block
      this.handleSelection(block);
    }

    // early exit if user is pressing shift --> multi-selection
    if (this.store.state.timeline.isPressingShift) {
      this.isSelecting = true;
      this.pointerUpHandler = () => this.onSelectingEnd();
      window.addEventListener("pointerup", this.pointerUpHandler);
      return;
    }

    // init vars
    this.initialX = event.data.global.x;
    this.initialY = event.data.global.y;
    this.initialBlockX = block.rect.x;
    this.currentTacton = block;
    this.currentYAdjustment = 0;
    this.lastViewportOffset =
      this.store.state.timeline.horizontalViewportOffset;
    this.lastTrackOffset = 0;

    // set interactionState to block multiSelection
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);

    // return if nothing is selected (e.g. by using multi-selection via shift
    if (this.store.state.timeline.selectedBlocks.length == 0) {
      return;
    }

    // calculate and init borders for collision detection
    this.createBorders();

    // create validTrackOffsets for collisionDetection and change validation
    this.minTrackChange = Math.min(...this.validTrackOffsets);
    this.maxTrackChange = Math.max(...this.validTrackOffsets);

    // set moved --> used to differentiate between click and drag
    this.moved = false;

    // init handlers
    this.pointerMoveHandler = (event: PointerEvent) => this.moveBlock(event);
    this.pointerUpHandler = () => this.onMoveBlockEnd();

    // add EventListeners
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
  }
  private moveBlock(event: PointerEvent): void {
    if (this.currentTacton == null) return;
    const changes: BlockChanges = new BlockChanges();
    changes.track = 0;
    const deltaX: number =
      event.clientX - this.initialX - this.store.state.timeline.wrapperXOffset;
    const deltaY: number = event.clientY - this.initialY;

    // detect switching tracks
    let currentYTrackId: number =
      this.currentTacton.trackId +
      Math.floor((deltaY - this.currentYAdjustment) / config.trackHeight);
    currentYTrackId = Math.max(
      0,
      Math.min(currentYTrackId, this.store.state.timeline.trackCount),
    );
    changes.track = Math.max(
      this.minTrackChange,
      Math.min(
        currentYTrackId - this.currentTacton.trackId,
        this.maxTrackChange,
      ),
    );

    // scroll viewport if needed
    // TODO maybe improve this by using lowest start and highest end position of the whole selection
    this.scrollViewportHorizontal(
      event.clientX - this.store.state.timeline.wrapperXOffset,
    );
    this.scrollViewportVertical(event.clientY);

    if (!this.isScrolling) {
      const adjustedDeltaX: number = this.adjustOffset(deltaX, changes.track);
      changes.x =
        this.initialBlockX + adjustedDeltaX - this.currentTacton.rect.x;
      this.applyChanges(changes);

      if (this.selectionBorder != null) {
        // update selectionBorder
        this.selectionBorder.lastStartX += changes.x;
        this.selectionBorder.initY =
          this.selectionBorder.lastY + changes.track * config.trackHeight;
        this.resizeSelectionBorder(this.selectionBorder);
        this.isCollidingOnResize = false;
      }
    }

    this.moved = true;
  }
  private onMoveBlockEnd(): void {
    if (this.currentTacton == null) return;
    if (this.pointerMoveHandler == null) return;
    if (this.pointerUpHandler == null) return;

    this.stopAutoScroll();
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);

    let borderData: SelectionBorderData | null = this.selectionBorder;

    if (borderData == null) {
      // only set InteractionState if groupBorder (from proportional resizing) is not active
      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    }
    if (borderData == null && this.currentTacton.groupId != null) {
      borderData = this.renderedGroupBorders.get(this.currentTacton.groupId)!;
    }
    if (borderData != null) {
      borderData.lastY = borderData.initY;
    }

    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;
    this.lastVerticalOffset = this.store.state.timeline.verticalViewportOffset;

    this.store.dispatch(
      TimelineActionTypes.CHANGE_BLOCK_TRACK,
      this.lastTrackOffset,
    );

    this.calculateVirtualViewportLength();
    this.currentTacton = null;
    if (this.moved) {
      this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
    }
    this.moved = false;
  }
  private onSelectingEnd(): void {
    if (this.pointerUpHandler == null) return;
    this.isSelecting = false;
    window.removeEventListener("pointerup", this.pointerUpHandler);
  }
  private onAbsoluteResizeStart(
    event: FederatedPointerEvent,
    block: BlockDTO,
    direction: Direction.LEFT | Direction.RIGHT,
  ): void {
    this.resizeDirection = direction;
    this.initialX = event.data.global.x;
    this.initialBlockWidth = block.rect.width;
    this.initialBlockX = block.rect.x;
    this.isCollidingOnResize = false;

    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
    this.handleSelection(block);

    this.pointerMoveHandler = (event: PointerEvent) =>
      this.onAbsoluteResize(event, block);
    this.pointerUpHandler = () => this.onResizeEnd();
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
  }
  private onAbsoluteResize(event: PointerEvent, block: BlockDTO): void {
    const deltaX: number =
      event.clientX - this.initialX - this.store.state.timeline.wrapperXOffset;
    const prevX: number = block.rect.x;
    const prevWidth: number = block.rect.width;
    const minBlockWidth = this.getMinBlockWidth();
    let newWidth;
    let newX: number = prevX;

    // exit, if user is pressing strg (proportional-resizing is active)
    if (this.strgDown) {
      return;
    }

    if (this.resizeDirection === Direction.RIGHT) {
      // calculate new tacton width
      newWidth = Math.max(this.initialBlockWidth + deltaX, minBlockWidth);

      // check for minTactonWidth
      if (newWidth == minBlockWidth) return;

      // calculate x coordinate of right border
      const newRightX: number = this.initialBlockX + newWidth;

      this.isCollidingOnResize = false;
      if (!this.isCollidingOnResize || deltaX < this.lastValidDeltaX) {
        this.isCollidingOnResize = false;
        const selectedTracks: number[] =
          this.store.state.timeline.selectedBlocks.map(
            (selection: BlockSelection) => selection.trackId,
          );
        selectedTracks.forEach((trackId: number): void => {
          const adjustedDeltaX: number =
            deltaX / this.store.state.timeline.zoomLevel;
          if (this.store.state.timeline.blocks[trackId].length > 1) {
            for (
              let i: number = 0;
              i < this.store.state.timeline.blocks[trackId].length;
              i++
            ) {
              if (this.isCollidingOnResize) break;
              if (
                this.store.state.timeline.selectedBlocks.some(
                  (selection: BlockSelection) =>
                    selection.trackId == trackId && selection.index == i,
                )
              ) {
                const block: BlockDTO =
                  this.store.state.timeline.blocks[trackId][i];
                const newWidth: number = Math.max(
                  block.initWidth + adjustedDeltaX,
                  minBlockWidth,
                );
                const newRightX: number = block.initX + newWidth;

                for (
                  let j: number = i + 1;
                  j < this.store.state.timeline.blocks[trackId].length;
                  j++
                ) {
                  const other: BlockDTO =
                    this.store.state.timeline.blocks[trackId][j];
                  const otherX: number = other.initX;
                  if (newRightX > otherX && block.initX < otherX) {
                    this.isCollidingOnResize = true;
                    const newValidDeltaX: number =
                      (otherX - (block.initX + block.initWidth)) *
                      this.store.state.timeline.zoomLevel;
                    this.lastValidDeltaX = Math.max(
                      newValidDeltaX,
                      this.lastValidDeltaX,
                    );
                    break;
                  }
                  this.lastValidDeltaX = deltaX;
                  this.isCollidingOnResize = false;
                }
              }
            }
          }
        });
      }

      // collided
      if (this.isCollidingOnResize) {
        newWidth = this.initialBlockWidth + this.lastValidDeltaX;
      } else {
        // test for snapping
        const snappedRightX: number = this.snapToGrid(newRightX);
        newWidth = snappedRightX - this.initialBlockX;
      }
    } else {
      // calculate new tacton width
      newWidth = Math.max(this.initialBlockWidth - deltaX, minBlockWidth);

      // check for minTactonWidth
      if (newWidth == minBlockWidth) return;

      // calculate new x coordinates of tacton
      newX = this.initialBlockX + deltaX;

      // check for collision
      if (!this.isCollidingOnResize || deltaX > this.lastValidDeltaX) {
        this.isCollidingOnResize = false;
        const selectedTracks: number[] =
          this.store.state.timeline.selectedBlocks.map(
            (selection: BlockSelection) => selection.trackId,
          );
        selectedTracks.forEach((trackId: number): void => {
          const adjustedDeltaX: number =
            deltaX / this.store.state.timeline.zoomLevel;
          if (this.store.state.timeline.blocks[trackId].length > 1) {
            for (
              let i: number = 0;
              i < this.store.state.timeline.blocks[trackId].length;
              i++
            ) {
              if (this.isCollidingOnResize) break;
              if (
                this.store.state.timeline.selectedBlocks.some(
                  (selection: BlockSelection) =>
                    selection.trackId == trackId && selection.index == i,
                )
              ) {
                const currentBlock: BlockDTO =
                  this.store.state.timeline.blocks[trackId][i];
                const newWidth: number = Math.max(
                  currentBlock.initWidth - adjustedDeltaX,
                  minBlockWidth,
                );
                const newX: number = currentBlock.initX + adjustedDeltaX;
                const newRightX: number = currentBlock.initX + newWidth;
                for (let j: number = i - 1; j >= 0; j--) {
                  const other: BlockDTO =
                    this.store.state.timeline.blocks[trackId][j];
                  const otherRightX: number = other.initX + other.initWidth;
                  if (newX < otherRightX && newRightX > otherRightX) {
                    this.isCollidingOnResize = true;
                    this.lastValidDeltaX = Math.min(
                      (otherRightX - currentBlock.initX) *
                        this.store.state.timeline.zoomLevel,
                      this.lastValidDeltaX,
                    );
                    break;
                  }
                  this.lastValidDeltaX = deltaX;
                  this.isCollidingOnResize = false;
                }
              }
            }
          }
        });
      }

      if (this.isCollidingOnResize) {
        newX = this.initialBlockX + this.lastValidDeltaX;
        newWidth = this.initialBlockWidth - this.lastValidDeltaX;
      } else {
        // test for snapping
        const snappedLeftX: number = this.snapToGrid(newX);
        newX = snappedLeftX;
        newWidth = this.initialBlockWidth + (this.initialBlockX - snappedLeftX);
      }
    }

    // early exit -> x is past start of sequence
    if (newX < config.leftPadding) return;

    const changes: BlockChanges = new BlockChanges();

    if (newX != prevX) {
      changes.x = newX - prevX;
    }
    changes.width = newWidth - prevWidth;
    this.applyChanges(changes);
  }
  private onProportionalResizeStart(
    event: FederatedPointerEvent,
    direction: Direction.LEFT | Direction.RIGHT,
    groupId?: number,
  ): void {
    let borderData: SelectionBorderData | null = this.selectionBorder;
    if (borderData == null && groupId != null) {
      borderData = this.renderedGroupBorders.get(groupId)!;
    }
    if (borderData == null) {
      return;
    }

    // need to update initData of groupBorder
    borderData.initStartX = borderData.lastStartX;
    borderData.initWidth = borderData.lastWidth;

    this.resizeDirection = direction;
    this.initialX = event.data.global.x;

    this.pointerMoveHandler = (event: PointerEvent) =>
      this.onProportionalResize(event, groupId);
    this.pointerUpHandler = () => this.onResizeEnd();
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
  }
  private onProportionalResize(event: PointerEvent, groupId?: number): void {
    let borderData: SelectionBorderData | null = this.selectionBorder;
    if (borderData == null && groupId != null) {
      borderData = this.renderedGroupBorders.get(groupId)!;
    }
    if (borderData == null) {
      return;
    }

    const deltaX: number =
      event.clientX - this.initialX - this.store.state.timeline.wrapperXOffset;
    const initWidth: number = borderData.initWidth;
    const initStartX: number = borderData.initStartX;
    const collisionsLeft: number = this.lastUidsCollisionLeft.length;
    const collisionsRight: number = this.lastUidsCollisionRight.length;

    let newGroupWidth: number = initWidth;
    let newGroupStartX: number = initStartX;
    let isDeltaXValid: boolean;

    if (this.resizeDirection === Direction.RIGHT) {
      newGroupWidth += deltaX;

      isDeltaXValid = collisionsRight == 0;

      if (collisionsRight == 1) {
        isDeltaXValid = deltaX < this.lastValidDeltaX;
      }

      if (collisionsLeft == 2) {
        isDeltaXValid = deltaX > this.lastValidDeltaX;
      }

      if (
        collisionsLeft == 1 &&
        this.lastUidsCollisionLeft[0] != borderData.firstBlockOfGroup.uid
      ) {
        isDeltaXValid = deltaX > this.lastValidDeltaX;
      }
    } else {
      newGroupStartX += deltaX;
      newGroupWidth -= deltaX;

      isDeltaXValid = collisionsLeft == 0;

      if (collisionsLeft == 1) {
        isDeltaXValid = deltaX > this.lastValidDeltaX;
      }

      if (collisionsRight == 2) {
        isDeltaXValid = deltaX < this.lastValidDeltaX;
      }

      if (
        collisionsRight == 1 &&
        this.lastUidsCollisionRight[0] != borderData.lastBlockOfGroup.uid
      ) {
        isDeltaXValid = deltaX < this.lastValidDeltaX;
      }
    }

    // check for minSize
    if (newGroupWidth < 1) {
      newGroupWidth = 1;
      newGroupStartX = borderData.lastStartX;
    }

    // check for left-overflow
    if (newGroupStartX <= config.leftPadding) {
      const overflow: number = config.leftPadding - newGroupStartX;
      newGroupStartX += overflow;
      newGroupWidth -= overflow;
    }

    const scale: number = newGroupWidth / initWidth;
    const uidsCollisionLeft: number[] = [];
    const uidsCollisionRight: number[] = [];

    for (const selection of this.store.state.timeline.selectedBlocks) {
      // calculate new block parameters
      const block =
        this.store.state.timeline.blocks[selection.trackId][selection.index];
      const newBlockParameters: { x: number; width: number } =
        this.calculateNewBlockParameters(block, newGroupStartX, scale);
      const newX: number = newBlockParameters.x;
      const newWidth: number = newBlockParameters.width;
      const newRightX: number = newX + newWidth;

      // check for collisions
      for (const other of this.store.state.timeline.blocks[selection.trackId]) {
        if (this.isBlockSelected(other)) continue;

        const otherRightX: number = other.rect.x + other.rect.width;
        if (otherRightX >= newX && otherRightX < newRightX) {
          // collision left
          uidsCollisionLeft.push(selection.uid);

          // calculate diff and new group parameters
          const diff: number = otherRightX - newX;
          newGroupStartX += diff;
          newGroupWidth -= diff;
        }

        if (other.rect.x <= newRightX && other.rect.x > newX) {
          // collision right
          uidsCollisionRight.push(selection.uid);

          // calculate diff and new group parameters
          const diff: number = newX + newWidth - other.rect.x;
          newGroupWidth -= diff;
        }
      }
    }

    if (isDeltaXValid) {
      // snapping
      if (this.resizeDirection === Direction.RIGHT) {
        newGroupWidth =
          this.snapToGrid(newGroupStartX + newGroupWidth) - newGroupStartX;
      } else {
        const snappedGroupStartX = this.snapToGrid(newGroupStartX);
        if (snappedGroupStartX != newGroupStartX) {
          const diff: number = initStartX - snappedGroupStartX;
          newGroupWidth = initWidth + diff;
        }

        newGroupStartX = snappedGroupStartX;
      }

      const scale: number = newGroupWidth / borderData.initWidth;

      // update blocks
      this.forEachSelectedBlock((block: BlockDTO): void => {
        const newBlockParameters: { x: number; width: number } =
          this.calculateNewBlockParameters(block, newGroupStartX, scale);
        const newX: number = newBlockParameters.x;
        const newWidth: number = newBlockParameters.width;

        block.rect.x = newX;
        block.rect.width = newWidth;

        block.strokedRect.x = newX;
        block.strokedRect.width = newWidth;
      });

      // update groups
      this.renderedGroupBorders.forEach(
        (borderData: GroupBorderData, groupId: number): void => {
          this.updateGroup(groupId, !this.strgDown);
        },
      );

      if (groupId == undefined) {
        this.resizeSelectionBorder(borderData, newGroupStartX, newGroupWidth);
        this.lastValidDeltaX = deltaX;
        this.lastUidsCollisionRight = uidsCollisionRight;
        this.lastUidsCollisionLeft = uidsCollisionLeft;
      }
    }
  }
  private onResizeEnd(): void {
    if (this.pointerMoveHandler == null) return;
    if (this.pointerUpHandler == null) return;
    this.resizeDirection = null;
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);

    // only set InteractionState if groupBorder is not active
    if (this.selectionBorder == null) {
      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    }

    // update borderData
    this.renderedGroupBorders.forEach((borderData: GroupBorderData): void => {
      borderData.initStartX = borderData.lastStartX;
      borderData.initWidth = borderData.lastWidth;
    });

    this.forEachSelectedBlock((block: BlockDTO): void => {
      this.updateHandles(block);
      block.initWidth = block.rect.width / this.store.state.timeline.zoomLevel;
      this.updateBlockInitData(block);
    });
    this.calculateVirtualViewportLength();
    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }
  private onChangeAmplitude(
    event: FederatedPointerEvent,
    block: BlockDTO,
    direction: Direction.TOP | Direction.BOTTOM,
  ): void {
    this.initialY = event.data.global.y;
    this.initialBlockHeight = block.rect.height;
    this.currentTacton = block;
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
    this.handleSelection(block);

    this.pointerMoveHandler = (event: PointerEvent) =>
      this.changeAmplitude(event, block, direction);
    this.pointerUpHandler = () => this.onChangeAmplitudeEnd();
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
  }
  private changeAmplitude(
    event: PointerEvent,
    block: BlockDTO,
    direction: Direction,
  ): void {
    // exit, if user is pressing strg (proportional-resizing is active)
    if (this.strgDown) {
      return;
    }

    let deltaY: number = 0;
    if (direction == Direction.TOP) {
      deltaY = this.initialY - event.clientY;
      deltaY += this.store.state.timeline.wrapperYOffset;
    } else if (direction == Direction.BOTTOM) {
      deltaY = event.clientY - this.initialY;
      deltaY -= this.store.state.timeline.wrapperYOffset;
    }

    const prevHeight: number = block.rect.height;
    const newHeight: number = Math.min(
      Math.max(this.initialBlockHeight + deltaY, config.minBlockHeight),
      config.maxBlockHeight,
    );
    const heightChange: number = newHeight - prevHeight;
    const changes: BlockChanges = new BlockChanges();
    changes.height = heightChange;
    this.applyChanges(changes);
  }
  private onChangeAmplitudeEnd(): void {
    if (this.pointerMoveHandler == null) return;
    if (this.pointerUpHandler == null) return;
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);

    // only set InteractionState if groupBorder is not active
    if (this.selectionBorder == null) {
      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    }

    this.forEachSelectedBlock((block: BlockDTO): void => {
      this.updateHandles(block);
      this.updateBlockInitData(block);
    });

    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;
    this.currentTacton = null;
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }
  private groupSelectedBlocks(): void {
    if (this.store.state.timeline.selectedBlocks.length <= 1) return;
    let groupId: number;
    let hasNewBlocks: boolean = true;
    const foundGroupIds: number[] = [];

    if (this.store.state.timeline.groups.size > 0) {
      hasNewBlocks = false;

      // get all groupIds of selection
      this.forEachSelectedBlock((block: BlockDTO): void => {
        if (block.groupId) {
          if (
            !foundGroupIds.some(
              (groupId: number): boolean => groupId == block.groupId,
            )
          ) {
            foundGroupIds.push(block.groupId);
          }
        } else {
          hasNewBlocks = true;
        }
      });

      if (foundGroupIds.length > 1) {
        hasNewBlocks = true;
      }
    }
    if (!hasNewBlocks) {
      // ungroup

      // get groupId
      const groupId: number = foundGroupIds[0];

      // remove groupId from blocks
      this.forEachSelectedBlock((block: BlockDTO): void => {
        block.groupId = undefined;
      });

      // clear border
      this.clearGroupBorder(groupId);

      // remove group from store
      this.store.state.timeline.groups.delete(groupId);

      // create selection border
      this.drawSelectionBorder();

      return;
    } else {
      // create new group

      // remove existing groups from store and clear border
      foundGroupIds.forEach((groupId: number): void => {
        this.clearGroupBorder(groupId);
        this.store.state.timeline.groups.delete(groupId);
      });

      groupId = this.store.state.timeline.selectedBlocks[0].uid;
      const blocksOfGroup: BlockSelection[] = [];

      this.store.state.timeline.selectedBlocks.forEach(
        (selection: BlockSelection): void => {
          const block =
            this.store.state.timeline.blocks[selection.trackId][
              selection.index
            ];
          block.groupId = groupId;
          blocksOfGroup.push(selection);
        },
      );

      this.store.dispatch(TimelineActionTypes.ADD_GROUP, {
        groupId: groupId,
        selection: blocksOfGroup,
      });
      this.clearSelectionBorder();
      this.createGroupBorder(groupId, this.store.state.timeline.selectedBlocks);
    }
  }

  //*************** Helper ***************
  private onGroupResize(
    event: FederatedPointerEvent,
    direction: Direction.LEFT | Direction.RIGHT,
    groupId: number,
  ): void {
    // check, if only the group is selected, or other blocks | groups
    const groupData = this.store.state.timeline.groups.get(groupId);
    const borderData: GroupBorderData | undefined =
      this.renderedGroupBorders.get(groupId);

    if (groupData == undefined || borderData == undefined) return;

    if (groupData.length == this.store.state.timeline.selectedBlocks.length) {
      this.onProportionalResizeStart(event, direction, groupId);
    } else {
      const blockOfGroup: BlockSelection = borderData.firstBlockOfGroup;
      this.onAbsoluteResizeStart(
        event,
        this.store.state.timeline.blocks[blockOfGroup.trackId][
          blockOfGroup.index
        ],
        direction,
      );
    }
  }
  private isBlockSelected(block: BlockDTO): boolean {
    return this.store.state.timeline.selectedBlocks.some(
      (selection: BlockSelection): boolean => selection.uid == block.rect.uid,
    );
  }
  private snapToGrid(positionToCheck: number) {
    if (!this.store.state.timeline.isSnappingActive) return positionToCheck;
    const snapRadius: number = config.resizingSnappingRadius;
    const gridLines = this.store.state.timeline.gridLines;
    for (const gridX of gridLines) {
      if (Math.abs(positionToCheck - gridX) <= snapRadius) {
        return gridX;
      }
    }
    return positionToCheck;
  }
  private calculateNewBlockParameters(
    block: BlockDTO,
    newGroupStartX: number,
    scale: number,
  ): { x: number; width: number } {
    let borderData: SelectionBorderData | null = this.selectionBorder;

    if (borderData == null && block.groupId != null) {
      borderData = this.renderedGroupBorders.get(block.groupId)!;
    }

    if (borderData == null) {
      return { x: NaN, width: NaN };
    }

    const relX: number =
      block.initX * this.store.state.timeline.zoomLevel -
      borderData.initStartX +
      config.leftPadding -
      this.store.state.timeline.horizontalViewportOffset;
    const newX: number = newGroupStartX + relX * scale;
    const newWidth: number =
      block.initWidth * this.store.state.timeline.zoomLevel * scale;
    return { x: newX, width: newWidth };
  }
  private drawSelectionBorder(): void {
    this.clearSelectionBorder();
    if (this.store.state.timeline.selectedBlocks.length <= 1) return;

    if (this.renderedGroupBorders.size == 1) {
      // there is only one group active, check if only members of this group are selected
      const iterator: IterableIterator<number> =
        this.renderedGroupBorders.keys();
      const groupId: number = iterator.next().value;

      const groupSelection: BlockSelection[] | undefined =
        this.store.state.timeline.groups.get(groupId);

      if (groupSelection == undefined) {
        console.error("Group is undefined");
        return;
      }

      if (
        groupSelection.length == this.store.state.timeline.selectedBlocks.length
      ) {
        return;
      }
    }

    // hide indicators
    this.forEachSelectedBlock((block: BlockDTO) =>
      this.updateIndicatorVisibility(block, false),
    );
    this.renderedGroupBorders.forEach((borderData: GroupBorderData): void => {
      borderData.rightHandle.visible = false;
      borderData.rightIndicator.visible = false;
      borderData.leftHandle.visible = false;
      borderData.leftIndicator.visible = false;
      borderData.topHandle!.visible = false;
      borderData.topIndicator!.visible = false;
      borderData.bottomHandle!.visible = false;
      borderData.bottomIndicator!.visible = false;
    });

    let groupStartX: number = Infinity;
    let groupEndX: number = -Infinity;
    let groupLowestTrack: number = Infinity;
    let groupHighestTrack: number = 0;
    let maxHeightOfLowestTrack: number = config.minBlockHeight;
    let maxHeightOfHighestTrack: number = config.minBlockHeight;
    let firstBlockOfGroup: BlockSelection;
    let lastBlockOfGroup: BlockSelection;
    let topBlockOfGroup: BlockSelection;

    this.store.state.timeline.selectedBlocks.forEach(
      (selection: BlockSelection): void => {
        const block: BlockDTO =
          this.store.state.timeline.blocks[selection.trackId][selection.index];

        // disable handles
        this.updateHandleInteractivity(block, false);

        const blockStart: number = block.rect.x;
        const blockEnd: number = blockStart + block.rect.width;
        const trackId: number = block.trackId;
        const height: number = block.rect.height;

        // track block range
        if (blockStart < groupStartX) {
          groupStartX = blockStart;
          firstBlockOfGroup = selection;
        }
        if (blockEnd > groupEndX) {
          groupEndX = blockEnd;
          lastBlockOfGroup = selection;
        }

        // highest / lowest track logic
        if (trackId < groupLowestTrack) {
          groupLowestTrack = trackId;
          maxHeightOfLowestTrack = height;
          topBlockOfGroup = selection;
        } else if (trackId === groupLowestTrack) {
          if (maxHeightOfLowestTrack < height) {
            maxHeightOfLowestTrack = height;
            topBlockOfGroup = selection;
          }
        }

        if (trackId > groupHighestTrack) {
          groupHighestTrack = trackId;
          maxHeightOfHighestTrack = height;
        } else if (trackId === groupHighestTrack) {
          maxHeightOfHighestTrack = Math.max(maxHeightOfHighestTrack, height);
        }
      },
    );

    const groupWidth: number = groupEndX - groupStartX;
    const groupY: number =
      this.store.state.timeline.blocks[topBlockOfGroup!.trackId][
        topBlockOfGroup!.index
      ].rect.y;
    const groupHeight: number =
      (groupHighestTrack - groupLowestTrack) * config.trackHeight +
      Math.min(maxHeightOfLowestTrack, maxHeightOfHighestTrack) +
      Math.abs(maxHeightOfLowestTrack - maxHeightOfHighestTrack) / 2;

    const borderContainer: Container = new Container();
    const border: Graphics = new Graphics();
    border.rect(groupStartX, groupY, groupWidth, groupHeight);
    border.fill("rgb(0, 0, 0, 0)");
    border.stroke({ width: 2, color: config.colors.groupHandleColor });

    const rightHandle: Graphics = new Graphics();
    rightHandle.rect(
      groupStartX + groupWidth - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
    );
    rightHandle.fill(config.colors.handleColor);
    rightHandle.interactive = true;
    rightHandle.cursor = "ew-resize";

    const rightIndicator: Graphics = new Graphics();
    rightIndicator.circle(
      groupStartX + groupWidth,
      groupY + groupHeight / 2,
      config.groupHandleRadius,
    );
    rightIndicator.fill(config.colors.groupHandleColor);

    const leftHandle: Graphics = new Graphics();
    leftHandle.rect(
      groupStartX - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
    );
    leftHandle.fill(config.colors.handleColor);
    leftHandle.interactive = true;
    leftHandle.cursor = "ew-resize";

    const leftIndicator: Graphics = new Graphics();
    leftIndicator.circle(
      groupStartX,
      groupY + groupHeight / 2,
      config.groupHandleRadius,
    );
    leftIndicator.fill(config.colors.groupHandleColor);

    // add eventListeners

    leftHandle.on("pointerdown", (event) =>
      this.onProportionalResizeStart(event, Direction.LEFT),
    );
    rightHandle.on("pointerdown", (event) =>
      this.onProportionalResizeStart(event, Direction.RIGHT),
    );

    borderContainer.addChild(border);
    borderContainer.addChild(rightHandle);
    borderContainer.addChild(rightIndicator);
    borderContainer.addChild(leftHandle);
    borderContainer.addChild(leftIndicator);

    this.selectionBorder = {
      container: borderContainer,
      border: border,
      rightHandle: rightHandle,
      rightIndicator: rightIndicator,
      leftHandle: leftHandle,
      leftIndicator: leftIndicator,
      initWidth: groupWidth,
      lastWidth: groupWidth,
      initStartX: groupStartX,
      lastStartX: groupStartX,
      initY: groupY,
      lastY: groupY,
      initHeight: groupHeight,
      firstBlockOfGroup: firstBlockOfGroup!,
      lastBlockOfGroup: lastBlockOfGroup!,
    };

    getDynamicContainer().addChild(borderContainer);
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
  }
  private resizeSelectionBorder(
    borderData: SelectionBorderData,
    newGroupStartX?: number,
    newGroupWidth?: number,
  ): void {
    if (!newGroupWidth) newGroupWidth = borderData.lastWidth;
    if (!newGroupStartX) newGroupStartX = borderData.lastStartX;

    const groupY: number = borderData.initY;
    const groupHeight: number = borderData.initHeight;

    borderData.border.clear();
    borderData.border.rect(newGroupStartX, groupY, newGroupWidth, groupHeight);
    borderData.border.fill("rgb(0, 0, 0, 0)");
    borderData.border.stroke({
      width: 2,
      color: config.colors.groupHandleColor,
    });

    borderData.rightHandle.clear();
    borderData.rightHandle.rect(
      newGroupStartX + newGroupWidth - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
    );
    borderData.rightHandle.fill(config.colors.handleColor);

    borderData.rightIndicator.clear();
    borderData.rightIndicator.circle(
      newGroupStartX + newGroupWidth,
      groupY + groupHeight / 2,
      config.groupHandleRadius,
    );
    borderData.rightIndicator.fill(config.colors.groupHandleColor);

    borderData.leftHandle.clear();
    borderData.leftHandle.rect(
      newGroupStartX - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
    );
    borderData.leftHandle.fill(config.colors.handleColor);

    borderData.leftIndicator.clear();
    borderData.leftIndicator.circle(
      newGroupStartX,
      groupY + groupHeight / 2,
      config.groupHandleRadius,
    );
    borderData.leftIndicator.fill(config.colors.groupHandleColor);

    borderData.lastStartX = newGroupStartX;
    borderData.lastWidth = newGroupWidth;
  }
  private updateSelectionBorder(): void {
    if (this.selectionBorder) {
      const firstSelection: BlockSelection =
        this.selectionBorder.firstBlockOfGroup;
      const lastSelection: BlockSelection =
        this.selectionBorder.lastBlockOfGroup;

      const firstBlock: BlockDTO =
        this.store.state.timeline.blocks[firstSelection.trackId][
          firstSelection.index
        ];
      const lastBlock: BlockDTO =
        this.store.state.timeline.blocks[lastSelection.trackId][
          lastSelection.index
        ];

      const newGroupStartX: number = firstBlock.rect.x;
      const newGroupEndX: number = lastBlock.rect.x + lastBlock.rect.width;
      const newGroupWidth: number = newGroupEndX - newGroupStartX;
      this.resizeSelectionBorder(
        this.selectionBorder,
        newGroupStartX,
        newGroupWidth,
      );
    }
  }
  private clearSelectionBorder(): void {
    if (this.selectionBorder != null) {
      getDynamicContainer().removeChild(this.selectionBorder.container);
      this.selectionBorder.container.destroy({ children: true });
      this.selectionBorder = null;
      this.renderedGroupBorders.forEach(
        (borderData: GroupBorderData, groupId: number): void => {
          this.updateGroup(groupId, true);
          borderData.rightHandle.visible = true;
          borderData.rightIndicator.visible = true;
          borderData.leftHandle.visible = true;
          borderData.leftIndicator.visible = true;
          borderData.topHandle!.visible = true;
          borderData.topIndicator!.visible = true;
          borderData.bottomHandle!.visible = true;
          borderData.bottomIndicator!.visible = true;
        },
      );
      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    }
  }
  private createGroupBorder(
    groupId: number,
    groupSelection: BlockSelection[],
  ): void {
    let groupStartX: number = Infinity;
    let groupEndX: number = -Infinity;
    let groupLowestTrack: number = Infinity;
    let groupHighestTrack: number = 0;
    let maxHeightOfLowestTrack: number = config.minBlockHeight;
    let maxHeightOfHighestTrack: number = config.minBlockHeight;
    let firstBlockOfGroup: BlockSelection;
    let lastBlockOfGroup: BlockSelection;
    let topBlockOfGroup: BlockSelection;
    let bottomBlockOfGroup: BlockSelection;

    groupSelection.forEach((selection: BlockSelection): void => {
      const block: BlockDTO =
        this.store.state.timeline.blocks[selection.trackId][selection.index];

      // disable handles
      this.updateHandleInteractivity(block, false);

      const blockStart: number = block.rect.x;
      const blockEnd: number = blockStart + block.rect.width;
      const trackId: number = block.trackId;
      const height: number = block.rect.height;

      // collect data
      if (blockStart < groupStartX) {
        groupStartX = block.rect.x;
        firstBlockOfGroup = selection;
      }
      if (blockEnd > groupEndX) {
        groupEndX = blockEnd;
        lastBlockOfGroup = selection;
      }

      if (trackId < groupLowestTrack) {
        groupLowestTrack = trackId;
        maxHeightOfLowestTrack = height;
        topBlockOfGroup = selection;
      } else if (trackId === groupLowestTrack) {
        if (height > maxHeightOfLowestTrack) {
          maxHeightOfLowestTrack = height;
          topBlockOfGroup = selection;
        }
      }

      if (trackId > groupHighestTrack) {
        groupHighestTrack = trackId;
        maxHeightOfHighestTrack = height;
        bottomBlockOfGroup = selection;
      } else if (trackId === groupHighestTrack) {
        if (height > maxHeightOfHighestTrack) {
          maxHeightOfHighestTrack = height;
          bottomBlockOfGroup = selection;
        }
      }
    });

    const groupWidth: number = groupEndX - groupStartX;
    const groupY: number =
      this.store.state.timeline.blocks[topBlockOfGroup!.trackId][
        topBlockOfGroup!.index
      ].rect.y;
    const groupHeight: number =
      (groupHighestTrack - groupLowestTrack) * config.trackHeight +
      Math.min(maxHeightOfLowestTrack, maxHeightOfHighestTrack) +
      Math.abs(maxHeightOfLowestTrack - maxHeightOfHighestTrack) / 2;

    const borderContainer: Container = new Container();
    const border: Graphics = new Graphics();
    border.rect(groupStartX, groupY, groupWidth, groupHeight);
    border.fill("rgb(0, 0, 0, 0)");
    border.stroke({ width: 2, color: config.colors.groupHandleColor });

    const rightHandle: Graphics = new Graphics();
    rightHandle.rect(
      groupStartX + groupWidth - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
    );
    rightHandle.fill(config.colors.handleColor);
    rightHandle.interactive = true;
    rightHandle.cursor = "ew-resize";

    const rightIndicator: Graphics = new Graphics();
    rightIndicator.circle(
      groupStartX + groupWidth,
      groupY + groupHeight / 2,
      config.groupHandleRadius,
    );
    rightIndicator.fill(config.colors.groupHandleColor);

    const leftHandle: Graphics = new Graphics();
    leftHandle.rect(
      groupStartX - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
    );
    leftHandle.fill(config.colors.handleColor);
    leftHandle.interactive = true;
    leftHandle.cursor = "ew-resize";

    const leftIndicator: Graphics = new Graphics();
    leftIndicator.circle(
      groupStartX,
      groupY + groupHeight / 2,
      config.groupHandleRadius,
    );
    leftIndicator.fill(config.colors.groupHandleColor);

    const topHandle: Graphics = new Graphics();
    topHandle.rect(
      groupStartX,
      groupY - config.resizingHandleWidth / 2,
      groupWidth,
      config.resizingHandleWidth,
    );
    topHandle.fill(config.colors.handleColor);
    topHandle.interactive = true;
    topHandle.cursor = "ns-resize";

    const topIndicator: Graphics = new Graphics();
    topIndicator.circle(
      groupStartX + groupWidth / 2,
      groupY,
      config.groupHandleRadius,
    );
    topIndicator.fill(config.colors.groupHandleColor);

    const bottomHandle: Graphics = new Graphics();
    bottomHandle.rect(
      groupStartX,
      groupY + groupHeight - config.resizingHandleWidth / 2,
      groupWidth,
      config.resizingHandleWidth,
    );
    bottomHandle.fill(config.colors.handleColor);
    bottomHandle.interactive = true;
    bottomHandle.cursor = "ns-resize";

    const bottomIndicator: Graphics = new Graphics();
    bottomIndicator.circle(
      groupStartX + groupWidth / 2,
      groupY + groupHeight,
      config.groupHandleRadius,
    );
    bottomIndicator.fill(config.colors.groupHandleColor);

    // add eventListeners
    leftHandle.on("pointerdown", (event) =>
      this.onGroupResize(event, Direction.LEFT, groupId),
    );
    rightHandle.on("pointerdown", (event) =>
      this.onGroupResize(event, Direction.RIGHT, groupId),
    );
    const block: BlockDTO =
      this.store.state.timeline.blocks[firstBlockOfGroup!.trackId][
        firstBlockOfGroup!.index
      ];
    topHandle.on("pointerdown", (event) =>
      this.onChangeAmplitude(event, block, Direction.TOP),
    );
    bottomHandle.on("pointerdown", (event) =>
      this.onChangeAmplitude(event, block, Direction.BOTTOM),
    );

    borderContainer.addChild(border);
    borderContainer.addChild(rightHandle);
    borderContainer.addChild(rightIndicator);
    borderContainer.addChild(leftHandle);
    borderContainer.addChild(leftIndicator);
    borderContainer.addChild(topHandle);
    borderContainer.addChild(topIndicator);
    borderContainer.addChild(bottomHandle);
    borderContainer.addChild(bottomIndicator);

    const groupBorder: GroupBorderData = {
      container: borderContainer,
      border: border,
      rightHandle: rightHandle,
      rightIndicator: rightIndicator,
      leftHandle: leftHandle,
      leftIndicator: leftIndicator,
      topHandle: topHandle,
      topIndicator: topIndicator,
      bottomHandle: bottomHandle,
      bottomIndicator: bottomIndicator,
      initWidth: groupWidth,
      lastWidth: groupWidth,
      lastStartX: groupStartX,
      initStartX: groupStartX,
      initY: groupY,
      lastY: groupY,
      initHeight: groupHeight,
      firstBlockOfGroup: firstBlockOfGroup!,
      lastBlockOfGroup: lastBlockOfGroup!,
      topBlockOfGroup: topBlockOfGroup!,
      bottomBlockOfGroup: bottomBlockOfGroup!,
    };

    this.renderedGroupBorders.set(groupId, groupBorder);

    getDynamicContainer().addChild(borderContainer);
  }
  private clearGroupBorder(groupId?: number): void {
    if (groupId != undefined) {
      const borderData: GroupBorderData =
        this.renderedGroupBorders.get(groupId)!;
      getDynamicContainer().removeChild(borderData.container);
      borderData.container.destroy({ children: true });
      this.renderedGroupBorders.delete(groupId);
    } else {
      // clear all
      this.renderedGroupBorders.forEach(
        (borderData: GroupBorderData, groupId: number): void => {
          getDynamicContainer().removeChild(borderData.container);
          borderData.container.destroy({ children: true });

          const groupSelection: BlockSelection[] | undefined =
            this.store.state.timeline.groups.get(groupId);

          if (groupSelection == undefined) {
            console.error("Group not found");
            return;
          }

          // enable handles
          groupSelection.forEach((selection: BlockSelection): void => {
            const block: BlockDTO =
              this.store.state.timeline.blocks[selection.trackId][
                selection.index
              ];
            block.leftHandle.interactive = true;
            block.rightHandle.interactive = true;
            block.topHandle.interactive = true;
            block.bottomHandle.interactive = true;
          });

          this.renderedGroupBorders.delete(groupId);
        },
      );
    }
  }
  private updateGroup(groupId: number, updateHandles: boolean = false): void {
    const borderData: GroupBorderData = this.renderedGroupBorders.get(groupId)!;

    const firstBlock: BlockDTO =
      this.store.state.timeline.blocks[borderData.firstBlockOfGroup.trackId][
        borderData.firstBlockOfGroup.index
      ];
    const lastBlock: BlockDTO =
      this.store.state.timeline.blocks[borderData.lastBlockOfGroup.trackId][
        borderData.lastBlockOfGroup.index
      ];
    const topBlock: BlockDTO =
      this.store.state.timeline.blocks[borderData.topBlockOfGroup.trackId][
        borderData.topBlockOfGroup.index
      ];
    const bottomBlock: BlockDTO =
      this.store.state.timeline.blocks[borderData.bottomBlockOfGroup.trackId][
        borderData.bottomBlockOfGroup.index
      ];
    const groupStartX: number = firstBlock.rect.x;
    const groupEndX: number = lastBlock.rect.x + lastBlock.rect.width;
    const groupWidth: number = groupEndX - groupStartX;
    const groupY: number = topBlock.rect.y;
    const groupHighestTrack: number = bottomBlock.trackId;
    const groupLowestTrack: number = topBlock.trackId;
    const maxHeightOfHighestTrack: number = bottomBlock.rect.height;
    const maxHeightOfLowestTrack: number = topBlock.rect.height;
    const groupHeight: number =
      (groupHighestTrack - groupLowestTrack) * config.trackHeight +
      Math.min(maxHeightOfLowestTrack, maxHeightOfHighestTrack) +
      Math.abs(maxHeightOfLowestTrack - maxHeightOfHighestTrack) / 2;

    borderData.border.clear();
    borderData.border.rect(groupStartX, groupY, groupWidth, groupHeight);
    borderData.border.fill("rgb(0, 0, 0, 0)");
    borderData.border.stroke({
      width: 2,
      color: config.colors.groupHandleColor,
    });

    if (updateHandles) {
      borderData.rightHandle.clear();
      borderData.rightHandle.rect(
        groupStartX + groupWidth - config.resizingHandleWidth / 2,
        groupY,
        config.resizingHandleWidth,
        groupHeight,
      );
      borderData.rightHandle.fill(config.colors.handleColor);

      borderData.rightIndicator.clear();
      borderData.rightIndicator.circle(
        groupStartX + groupWidth,
        groupY + groupHeight / 2,
        config.groupHandleRadius,
      );
      borderData.rightIndicator.fill(config.colors.groupHandleColor);

      borderData.leftHandle.clear();
      borderData.leftHandle.rect(
        groupStartX - config.resizingHandleWidth / 2,
        groupY,
        config.resizingHandleWidth,
        groupHeight,
      );
      borderData.leftHandle.fill(config.colors.handleColor);

      borderData.leftIndicator.clear();
      borderData.leftIndicator.circle(
        groupStartX,
        groupY + groupHeight / 2,
        config.groupHandleRadius,
      );
      borderData.leftIndicator.fill(config.colors.groupHandleColor);

      borderData.topHandle!.clear();
      borderData.topHandle!.rect(
        groupStartX,
        groupY - config.resizingHandleWidth / 2,
        groupWidth,
        config.resizingHandleWidth,
      );
      borderData.topHandle!.fill(config.colors.handleColor);

      borderData.topIndicator!.clear();
      borderData.topIndicator!.circle(
        groupStartX + groupWidth / 2,
        groupY,
        config.groupHandleRadius,
      );
      borderData.topIndicator!.fill(config.colors.groupHandleColor);

      borderData.bottomHandle!.clear();
      borderData.bottomHandle!.rect(
        groupStartX,
        groupY + groupHeight - config.resizingHandleWidth / 2,
        groupWidth,
        config.resizingHandleWidth,
      );
      borderData.bottomHandle!.fill(config.colors.handleColor);

      borderData.bottomIndicator!.clear();
      borderData.bottomIndicator!.circle(
        groupStartX + groupWidth / 2,
        groupY + groupHeight,
        config.groupHandleRadius,
      );
      borderData.bottomIndicator!.fill(config.colors.groupHandleColor);
    }

    borderData.lastStartX = groupStartX;
    borderData.lastWidth = groupWidth;
  }
  private getMinBlockWidth(): number {
    const zoom: number = this.store.state.timeline.zoomLevel;
    return (config.minBlockWidthMS / 1000) * config.pixelsPerSecond * zoom;
  }

  //******* scroll viewport when block is at border-regions *******
  private startAutoScroll(direction: Direction): void {
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.currentDirection = direction;
      this.autoScroll();
    }
  }
  private stopAutoScroll(): void {
    this.isScrolling = false;
    this.currentDirection = null;
    this.currentFactor = 0;
  }
  private autoScroll(): void {
    if (!this.isScrolling || !this.currentDirection) return;

    const horizontalScrollSpeed: number =
      this.currentFactor * config.horizontalScrollSpeed;
    const verticalScrollSpeed: number =
      this.currentFactor * config.verticalScrollSpeed;

    switch (this.currentDirection) {
      case Direction.TOP: {
        const newOffset: number = Math.min(
          getDynamicContainer().y + verticalScrollSpeed,
          0,
        );
        this.currentYAdjustment = newOffset - this.lastVerticalOffset;
        this.store.dispatch(
          TimelineActionTypes.UPDATE_VERTICAL_VIEWPORT_OFFSET,
          newOffset,
        );
        break;
      }

      case Direction.BOTTOM: {
        const newOffset: number = Math.max(
          getDynamicContainer().y - verticalScrollSpeed,
          -this.store.state.timeline.scrollableHeight,
        );
        this.currentYAdjustment = newOffset - this.lastVerticalOffset;
        this.store.dispatch(
          TimelineActionTypes.UPDATE_VERTICAL_VIEWPORT_OFFSET,
          newOffset,
        );
        break;
      }

      case Direction.LEFT: {
        const newOffset: number = Math.max(
          this.store.state.timeline.horizontalViewportOffset -
            horizontalScrollSpeed,
          0,
        );
        this.store.dispatch(
          TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
          newOffset,
        );
        break;
      }

      case Direction.RIGHT: {
        const newOffset =
          this.store.state.timeline.horizontalViewportOffset +
          horizontalScrollSpeed;
        this.store.dispatch(
          TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
          newOffset,
        );
      }
    }

    if (
      this.currentDirection == Direction.LEFT ||
      this.currentDirection == Direction.RIGHT
    ) {
      const changes: BlockChanges = new BlockChanges();
      const adjustedDeltaX: number = this.adjustOffset(
        this.lastValidOffset,
        this.lastTrackOffset,
      );
      changes.x =
        this.initialBlockX + adjustedDeltaX - this.currentTacton!.rect.x;
      this.applyChanges(changes);
    }

    requestAnimationFrame(() => this.autoScroll());
  }
  private scrollViewportHorizontal(cursorX: number): void {
    if (cursorX >= this.rightThreshold) {
      this.currentFactor = Math.min(
        (cursorX - this.rightThreshold) / config.horizontalScrollThreshold,
        1,
      );
      this.startAutoScroll(Direction.RIGHT);
    } else if (cursorX <= this.leftThreshold) {
      if (this.store.state.timeline.horizontalViewportOffset == 0) return;
      this.currentFactor = Math.min(
        (this.leftThreshold - cursorX) / config.horizontalScrollThreshold,
        1,
      );
      this.startAutoScroll(Direction.LEFT);
    } else if (this.isScrolling) {
      this.stopAutoScroll();
    }
  }
  private scrollViewportVertical(cursorY: number): void {
    if (cursorY <= this.topThreshold) {
      this.currentFactor = Math.min(
        (this.topThreshold - cursorY) / config.verticalScrollThreshold,
        1,
      );
      this.startAutoScroll(Direction.TOP);
    } else if (cursorY >= this.bottomThreshold) {
      this.currentFactor = Math.min(
        (cursorY - this.bottomThreshold) / config.verticalScrollThreshold,
        1,
      );
      this.startAutoScroll(Direction.BOTTOM);
    }
  }
  private calculateVirtualViewportLength(): void {
    this.store.dispatch(TimelineActionTypes.SORT_TACTONS);
    this.store.dispatch(TimelineActionTypes.GET_LAST_BLOCK_POSITION);
    let lastBlockPosition: number =
      this.store.state.timeline.lastBlockPositionX;
    lastBlockPosition -= config.leftPadding;
    lastBlockPosition += this.store.state.timeline.horizontalViewportOffset;
    lastBlockPosition /= this.store.state.timeline.zoomLevel;

    // calculate rightOverflow
    const viewport: number =
      (this.store.state.timeline.canvasWidth -
        config.leftPadding +
        this.store.state.timeline.horizontalViewportOffset) /
      this.store.state.timeline.zoomLevel;
    const ro: number = Math.max(0, lastBlockPosition - viewport);
    if (ro == 0) {
      const whitespace: number = viewport - lastBlockPosition;
      this.store.dispatch(
        TimelineActionTypes.UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH,
        lastBlockPosition + whitespace,
      );
    } else {
      this.store.dispatch(
        TimelineActionTypes.UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH,
        lastBlockPosition + config.pixelsPerSecond,
      );
    }
  }

  //******* collision-detection for moving blocks *******
  private createBorders(): void {
    this.selectedTracks = [];
    // calculate border to check
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.unselectedBorders[trackId] = [];
        this.selectedBorders[trackId] = [];
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO): void => {
            if (
              !this.store.state.timeline.selectedBlocks.some(
                (selection: BlockSelection): boolean =>
                  selection.uid == block.rect.uid,
              )
            ) {
              // block is unselected
              this.unselectedBorders[block.trackId].push(block.rect.x);
              this.unselectedBorders[block.trackId].push(
                block.rect.x + block.rect.width,
              );
            } else {
              // block is selected
              this.selectedBorders[block.trackId].push(block.rect.x);
              this.selectedBorders[block.trackId].push(
                block.rect.x + block.rect.width,
              );

              const isAdded: boolean = this.selectedTracks.some(
                (track: number): boolean => {
                  return track == block.trackId;
                },
              );

              if (!isAdded) this.selectedTracks.push(block.trackId);
            }
          },
        );
      },
    );

    this.calculateStickyOffsets();
  }
  private createBordersForCopies(): void {
    this.selectedTracks = [];
    // calculate border to check
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.unselectedBorders[trackId] = [];
        this.selectedBorders[trackId] = [];
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO): void => {
            // block is unselected
            this.unselectedBorders[block.trackId].push(block.rect.x);
            this.unselectedBorders[block.trackId].push(
              block.rect.x + block.rect.width,
            );
          },
        );
      },
    );

    this.copiedBlocks.forEach((block: CopiedBlockDTO): void => {
      // if block is copied, add to selectedBlocks
      this.selectedBorders[block.trackId].push(block.rect.x);
      this.selectedBorders[block.trackId].push(block.rect.x + block.rect.width);

      const isAdded: boolean = this.selectedTracks.some(
        (track: number): boolean => {
          return track == block.trackId;
        },
      );

      if (!isAdded) this.selectedTracks.push(block.trackId);
    });

    this.calculateStickyOffsets();
  }
  private adjustOffset(offset: number, trackOffset: number): number {
    const possibleSnaps: { x: number; dist: number }[] = [];
    const maxAttempts: number = 10;
    let attemptCount: number = 0;
    let validOffset: number = offset;
    let hasCollision: boolean = true;
    let isSticking: boolean = false;

    // calculate offsetDifference to adjust borders
    const horizontalOffsetDifference: number =
      this.store.state.timeline.horizontalViewportOffset -
      this.lastViewportOffset;

    // if track was changes lastValidOffset is invalid -> needs to be updated
    if (this.lastTrackOffset != trackOffset) {
      this.lastValidOffset = this.getValidStickyOffset(
        offset,
        trackOffset,
        horizontalOffsetDifference,
      );
    }

    while (hasCollision && attemptCount < maxAttempts) {
      hasCollision = false;
      attemptCount++;
      for (
        let trackId: number = 0;
        trackId <
        Math.min(this.unselectedBorders.length, this.selectedBorders.length);
        trackId++
      ) {
        // calculate correct trackId
        const adjustedTrack: number = trackId + trackOffset;

        if (
          adjustedTrack < 0 ||
          adjustedTrack >= this.unselectedBorders.length
        ) {
          // skip invalid trackId
          continue;
        }

        // collision-detection
        for (let i = 0; i < this.selectedBorders[trackId].length; i += 2) {
          const start2: number = this.selectedBorders[trackId][i] + validOffset;
          const end2: number =
            this.selectedBorders[trackId][i + 1] + validOffset;
          if (
            start2 + this.store.state.timeline.horizontalViewportOffset <
            config.leftPadding
          ) {
            validOffset = this.getValidStickyOffset(
              offset,
              trackOffset,
              horizontalOffsetDifference,
            );
            isSticking = true;
            break;
          }

          for (
            let j = 0;
            j < this.unselectedBorders[adjustedTrack].length;
            j += 2
          ) {
            const start1: number =
              this.unselectedBorders[adjustedTrack][j] -
              horizontalOffsetDifference;
            const end1: number =
              this.unselectedBorders[adjustedTrack][j + 1] -
              horizontalOffsetDifference;

            if (end2 > start1 && start2 < end1) {
              // collision detected
              hasCollision = true;

              // calculate distance of mouse to start and end of colliding block
              const cursorX: number = this.initialX + offset;
              const distToStart2: number = Math.abs(cursorX - start1);
              const distToEnd2: number = Math.abs(cursorX - end1);
              // choose side to stick to
              if (distToStart2 > distToEnd2) {
                validOffset = end1 - this.selectedBorders[trackId][i];
              } else {
                // if block is at start of timeline, use lastValidOffset
                if (start1 == config.leftPadding) {
                  validOffset = this.lastValidOffset;
                } else {
                  validOffset = start1 - this.selectedBorders[trackId][i + 1];
                }
              }

              isSticking = true;
              break;
            }
          }

          // TODO add unselectedBorder for relative snapping
          if (!isSticking && this.store.state.timeline.isSnappingActive) {
            for (const lineX of this.store.state.timeline.gridLines) {
              // left
              if (Math.abs(start2 - lineX) <= config.moveSnappingRadius) {
                possibleSnaps.push({
                  x: lineX - this.selectedBorders[trackId][i],
                  dist: start2 - lineX,
                });
              }
              // right
              if (Math.abs(end2 - lineX) <= config.moveSnappingRadius) {
                possibleSnaps.push({
                  x: lineX - this.selectedBorders[trackId][i + 1],
                  dist: end2 - lineX,
                });
              }
            }
          }
        }
      }
    }

    // no collision, choose gridLine for snapping
    if (!isSticking && possibleSnaps.length >= 1) {
      validOffset = possibleSnaps.reduce((prev, curr) =>
        curr.dist < prev.dist ? curr : prev,
      ).x;
    }

    if (attemptCount >= maxAttempts) {
      validOffset = this.getValidStickyOffset(
        offset,
        trackOffset,
        horizontalOffsetDifference,
      );
    }

    this.lastValidOffset = validOffset;
    this.lastTrackOffset = trackOffset;
    return validOffset;
  }
  private getValidTrackOffsets(): number[] {
    const minTrack: number = Math.min(...this.selectedTracks);
    const maxTrack: number = Math.max(...this.selectedTracks);
    const possibleTrackOffsets: number[] = [0];

    const maxTrackToTop: number = minTrack;
    if (maxTrackToTop > 0) {
      for (let i = 1; i <= maxTrackToTop; i++) {
        possibleTrackOffsets.push(-i);
      }
    }

    const maxTrackToBottom: number =
      this.store.state.timeline.trackCount - maxTrack;
    if (maxTrackToBottom > 0) {
      for (let i = 1; i <= maxTrackToBottom; i++) {
        possibleTrackOffsets.push(i);
      }
    }
    return possibleTrackOffsets;
  }
  private checkPossibleOffsetPerTrack(
    possibleOffsetPerTrackOffset: number[][],
  ): void {
    this.stickyOffsetsPerTrackOffset.clear();
    this.validTrackOffsets = this.getValidTrackOffsets();
    // iterate over possible trackOffsets e.g. [-1, 0, 1, 2]
    this.validTrackOffsets.forEach((trackOffset: number): void => {
      const validOffsetsPerTrackOffset: number[] = [];
      // iterate over possible offsets e.g. [71, -248, ...]
      for (const possibleOffset of possibleOffsetPerTrackOffset[trackOffset]) {
        let isValid: boolean = true;
        // iterate over selected tracks
        for (const trackAsString of Object.keys(this.selectedBorders)) {
          const trackId: number = parseInt(trackAsString);
          const selectedBorders: number[] = this.selectedBorders[trackId];
          const unselectedBorders: number[] =
            this.unselectedBorders[trackId + trackOffset];

          // skip empty tracks
          if (!selectedBorders || selectedBorders.length === 0) continue;
          if (!unselectedBorders) continue;

          // add offset to border
          // check if any of unselectedBorders is overlapping with adjusted border
          for (let i = 0; i < selectedBorders.length; i += 2) {
            const start2: number = selectedBorders[i] + possibleOffset;
            const end2: number = selectedBorders[i + 1] + possibleOffset;

            if (start2 < config.leftPadding) {
              isValid = false;
              break;
            }

            for (let j = 0; j < unselectedBorders.length; j += 2) {
              const start1: number = unselectedBorders[j];
              const end1: number = unselectedBorders[j + 1];

              const variance: number = 0.01;
              if (end2 > start1 && start2 + variance < end1) {
                isValid = false;
                break;
              }
            }

            if (!isValid) break;
          }

          if (!isValid) break;
        }

        if (isValid) {
          validOffsetsPerTrackOffset.push(possibleOffset);
        }
      }

      this.stickyOffsetsPerTrackOffset.set(
        trackOffset,
        validOffsetsPerTrackOffset,
      );
    });
  }
  private calculateStickyOffsets(): void {
    const trackOffsets: number[] = this.getValidTrackOffsets();
    const possibleOffsetPerTrackOffset: number[][] = [];
    for (
      let trackId = 0;
      trackId <
      Math.min(this.unselectedBorders.length, this.selectedBorders.length);
      trackId++
    ) {
      // loop over selectedBorders
      for (let i = 0; i < this.selectedBorders[trackId].length; i += 2) {
        // loop over unselected border tracks
        trackOffsets.forEach((trackOffset: number) => {
          const track = trackId + trackOffset;
          if (possibleOffsetPerTrackOffset[trackOffset] == undefined) {
            possibleOffsetPerTrackOffset[trackOffset] = [];
            possibleOffsetPerTrackOffset[trackOffset].push(
              config.leftPadding - this.selectedBorders[trackId][0],
            );
          }
          // loop over every unselected border block in this track
          for (let k = 0; k < this.unselectedBorders[track].length; k += 2) {
            const start2: number = this.unselectedBorders[track][k];
            const end2: number = this.unselectedBorders[track][k + 1];

            // calculate possible offsets
            const offsetToStart: number =
              end2 - this.selectedBorders[trackId][i];
            const offsetToEnd: number =
              start2 - this.selectedBorders[trackId][i + 1];

            possibleOffsetPerTrackOffset[trackOffset].push(offsetToStart);
            possibleOffsetPerTrackOffset[trackOffset].push(offsetToEnd);
          }
        });
      }
    }
    this.checkPossibleOffsetPerTrack(possibleOffsetPerTrackOffset);
  }
  private getValidStickyOffset(
    offset: number,
    trackOffset: number,
    horizontalOffsetDifference: number,
  ): number {
    const possibleOffsets: number[] =
      this.stickyOffsetsPerTrackOffset.get(trackOffset) || [];
    let bestOffset: number = offset;
    let minDistance: number = Infinity;

    for (const fallbackOffset of possibleOffsets) {
      const adjustedFallbackOffset: number =
        fallbackOffset - horizontalOffsetDifference;
      const distance: number = Math.abs(adjustedFallbackOffset - offset);
      if (distance < minDistance) {
        minDistance = distance;
        bestOffset = adjustedFallbackOffset;
      }
    }
    return bestOffset;
  }

  //******* multi-selection *******
  private drawSelectionBox(): void {
    const selectionBox =
      document.getElementById("selection-box") || this.createSelectionBox();
    const { x, y, width, height } = this.getBoundingBox();
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  }
  private createSelectionBox(): HTMLElement {
    const box = document.createElement("div");
    box.id = "selection-box";
    box.style.position = "absolute";
    box.style.border = "1px solid";
    box.style.borderColor = config.colors.boundingBoxBorderColor;
    box.style.background = config.colors.boundingBoxColor;
    box.style.pointerEvents = "none";
    box.style.userSelect = "none";
    document.body.appendChild(box);
    return box;
  }
  private removeSelectionBox(): void {
    const box: HTMLElement | null = document.getElementById("selection-box");
    if (box) box.remove();
  }
  private selectRectanglesWithin(): void {
    const selectedBlocks: BlockSelection[] = [];
    const { x: initialX, y: initialY, width, height } = this.getBoundingBox();
    let x: number = initialX;
    let y: number = initialY;

    // need to adjust coordinates, to be in canvas
    x -= this.store.state.timeline.wrapperXOffset;
    y -= this.store.state.timeline.wrapperYOffset;

    // adjust for scrolling
    y -= getDynamicContainer().y;

    // calculate tracks to check --> only check tracks that could contain selection
    const startTrack: number = Math.floor(y / config.trackHeight);
    const endTrack: number = Math.floor((y + height) / config.trackHeight);
    for (let trackId = startTrack; trackId <= endTrack; trackId++) {
      const blocks: BlockDTO[] = this.store.state.timeline.blocks[trackId];
      if (!blocks) continue;
      blocks.forEach((block: BlockDTO, index: number): void => {
        if (
          block.rect.x + block.rect.width >= x &&
          block.rect.x <= x + width &&
          block.rect.y <= y + height &&
          block.rect.y + block.rect.height >= y
        ) {
          const selection: BlockSelection = {
            trackId: trackId,
            index: index,
            uid: block.rect.uid,
          };
          selectedBlocks.push(selection);
        }
      });
    }
    this.handleSelection(selectedBlocks);
  }
  private getBoundingBox() {
    const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const width = Math.abs(this.selectionStart.x - this.selectionEnd.x);
    const height = Math.abs(this.selectionStart.y - this.selectionEnd.y);
    return { x, y, width, height };
  }

  //******* edit-mode *******
  private handleEditMode(): void {
    if (!this.store.state.timeline.isEditable) {
      // disable handles, if selected, remove selection
      this.forEachBlock((block: BlockDTO): void => {
        this.updateHandleInteractivity(block, false);
        if (this.isBlockSelected(block)) {
          this.updateIndicatorVisibility(block, false);
          block.strokedRect.visible = false;
        }
        block.rect.interactive = false;
      });

      this.renderedGroupBorders.forEach(
        (borderData: GroupBorderData, groupId: number): void => {
          this.clearGroupBorder(groupId);
        },
      );
      this.clearSelectionBorder();
      this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
      this.strgDown = false;
    } else {
      // enable handles
      this.forEachBlock((block: BlockDTO): void => {
        this.updateHandleInteractivity(block, true);
        block.rect.interactive = true;
      });
    }
  }

  //******* event-listener *******
  private onCanvasMouseDown(event: MouseEvent): void {
    if (!this.store.state.timeline.isInteracting) {
      this.pasteSelection();
    }

    if (this.isSelecting) return;
    if (event.button === 0 && !this.store.state.timeline.isInteracting) {
      this.isMouseDragging = true;
      this.selectionStart = { x: event.clientX, y: event.clientY };
      this.selectionEnd = { ...this.selectionStart };
      this.drawSelectionBox();
    }
  }
  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isMouseDragging) return;
    this.selectionEnd = { x: event.clientX, y: event.clientY };
    this.drawSelectionBox();
  }
  private onCanvasMouseUp(event: MouseEvent): void {
    if (event.button !== 0 || !this.isMouseDragging) return;
    this.isMouseDragging = false;
    this.removeSelectionBox();
    this.selectRectanglesWithin();
  }
  public installEventListeners(): void {
    const pixiApp: Application = getPixiApp();
    // remove existing Event-Listeners
    pixiApp.canvas.removeEventListener(
      "mousedown",
      this.onCanvasMouseDown.bind(this),
    );
    pixiApp.canvas.removeEventListener(
      "mousemove",
      this.onCanvasMouseMove.bind(this),
    );
    pixiApp.canvas.removeEventListener(
      "mouseup",
      this.onCanvasMouseUp.bind(this),
    );

    pixiApp.canvas.addEventListener(
      "mousedown",
      this.onCanvasMouseDown.bind(this),
    );
    pixiApp.canvas.addEventListener(
      "mousemove",
      this.onCanvasMouseMove.bind(this),
    );
    pixiApp.canvas.addEventListener("mouseup", this.onCanvasMouseUp.bind(this));
  }
}
