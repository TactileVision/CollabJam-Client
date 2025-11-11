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
  getLine,
  getLockContainer,
  getPixiApp,
} from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import {
  BlockChanges,
  BlockData,
  BlockDTO,
  BlockSelection,
  Direction,
  SnackbarTexts,
  TimelineEvents,
} from "@/renderer/helpers/timeline/types";
import { DUMMY_GROUP_UUID, DUMMY_UUID } from "@sharedTypes/tactonTypes";
import { User } from "@sharedTypes/roomTypes";
import {
  Border,
  BoundingData,
  getBoundingData,
} from "@/renderer/helpers/timeline/borderManager";

interface GroupBounds {
  startX: number;
  endX: number;
  lowestTrack: number;
  highestTrack: number;
  maxHeightLowest: number;
  maxHeightHighest: number;
  y: number;
}
class CopiedBlockDTO {
  rect: Graphics;
  initX: number;
  initY: number;
  initWidth: number;
  container: Container;
  trackId: number;
  initTrackId: number;
  groupUuid: string | null;
  constructor(
    rect: Graphics,
    container: Container,
    trackId: number,
    groupUuid: string | null,
  ) {
    this.rect = rect;
    this.initX = rect.x;
    this.initY = rect.y;
    this.initWidth = rect.width;
    this.container = container;
    this.trackId = trackId;
    this.initTrackId = trackId;
    this.groupUuid = groupUuid;
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
  private selectionBorder: Border | undefined = undefined;
  private lastUuidsCollisionLeft: string[] = [];
  private lastUuidsCollisionRight: string[] = [];

  // collision-detection vars
  private unselectedBorders: number[][] = [];
  private selectedBorders: number[][] = [];
  private selectedTracks: number[] = [];
  private lastValidOffset: number = 0;
  private lastTrackOffset: number = 0;
  private lastViewportOffset: number = 0;
  private stickyOffsetsPerTrackOffset: Map<number, number[]> = new Map();
  private unselectedBorderList: number[] = [];

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
  private selectedBlockUuids: string[] = [];
  private copiedBlocks: CopiedBlockDTO[] = [];
  private lastCursorX: number = 0;
  private initYTrackId: number = 0;

  // multi selection
  private isSelecting: boolean = false;
  private isMouseDragging: boolean = false;
  private selectionStart = { x: 0, y: 0 };
  private selectionEnd = { x: 0, y: 0 };

  // groups
  private renderedGroupBorders: Map<string, Border> = new Map<string, Border>();

  // member editing
  private editedGroupMemberUuid: string | null = null;
  private editedGroupUuid: string | null = null;
  private isDoubleClick: boolean = false;
  private doubleTimeout: ReturnType<typeof setTimeout> | undefined;
  private stashedSelection: Map<string, BlockSelection> = new Map();

  // interaction-mode
  private isInteractionBlocked: boolean = false;

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
      () => this.store.state.timeline.canvasWidth,
      (): void => {
        this.calculateVirtualViewportLength();
        this.generateThresholds();
      },
    );

    this.generateThresholds();
    this.installEventListeners();
  }
  createBlocksFromData(blockData: BlockData[]): void {
    // clear stored blocks
    this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS);

    // init tracks
    this.store.dispatch(TimelineActionTypes.INIT_TRACKS);

    // create, render and save block in store
    blockData.forEach((blockData: BlockData): void => {
      const block: BlockDTO = this.createBlock(blockData);
      // update blocks, handles and strokes
      this.updateBlock(block);
      this.updateHandles(block);
      this.updateStroke(block);
      this.updateIndicators(block);
    });

    // detect groups and blocks with dist == 0 and create group
    const groups: Map<string, BlockSelection[]> = new Map();

    // store correct selectionData, in case of mismatch
    const correctSelectionData: Map<
      string,
      { trackId: number; index: number }
    > = new Map<string, { trackId: number; index: number }>();

    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO, index: number): void => {
            // check for groups
            if (block.groupUuid) {
              if (!groups.has(block.groupUuid)) {
                groups.set(block.groupUuid, []);
              }
              groups.get(block.groupUuid)!.push({
                trackId: block.trackId,
                index: index,
                uuid: block.uuid,
              });
            }

            // save selectionData
            correctSelectionData.set(block.uuid, {
              trackId: block.trackId,
              index: index,
            });
          },
        );
      },
    );
    groups.forEach((selection: BlockSelection[], groupUuid: string) => {
      this.store.dispatch(TimelineActionTypes.ADD_GROUP, {
        groupUuid: groupUuid,
        selection: selection,
      });
    });

    this.store.dispatch(TimelineActionTypes.GET_LAST_BLOCK_POSITION);

    let toHighlight: BlockDTO | null = null;
    // update selectionData
    for (const selection of this.store.state.timeline.selectedBlocks) {
      const block: BlockDTO =
        this.store.state.timeline.blocks[selection.trackId][selection.index];
      if (block == undefined || block.uuid != selection.uuid) {
        // mismatch
        const correctData = correctSelectionData.get(selection.uuid);
        if (correctData != undefined) {
          selection.trackId = correctData.trackId;
          selection.index = correctData.index;
        }
      }
      if (block.uuid === this.editedGroupMemberUuid) {
        toHighlight = block;
      }
    }

    if (toHighlight) {
      this.highlightCurrentMember(toHighlight);
    } else {
      this.renderSelection();
    }

    this.updateLocks();
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
      block.uuid,
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

    dto.groupUuid = block.groupUuid;
    dto.addListeners({
      onHorizontalResize: this.onHorizontalResize.bind(this),
      onChangeAmplitude: this.onVerticalResize.bind(this),
      onMoveBlock: this.onMoveBlock.bind(this),
    });

    this.store.dispatch(TimelineActionTypes.ADD_BLOCK, {
      trackId: block.trackId,
      block: dto,
    });
    getDynamicContainer().addChildAt(blockContainer, 0);
    return dto;
  }
  private createCopiedBLock(block: BlockData): CopiedBlockDTO {
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
      block.groupUuid,
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
  ): BlockData[] {
    const blockData: BlockData[] = [];
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

      // if copying groupMember, reject groupUuid -> only one block ist copied
      const groupUuid: string | null =
        this.editedGroupMemberUuid == null ? block.groupUuid : null;

      blockData.push({
        trackId: block.trackId,
        startTime: startTime,
        endTime: endTime,
        intensity: intensity,
        groupUuid: groupUuid,
        uuid: DUMMY_UUID,
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
  }

  //*************** Update-Methods ***************

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
  private updateLocks(oldLocks?: Record<string, string[]>): void {
    // clear all borders
    getLockContainer().removeChildren();
    const newLocks: Record<string, string[]> =
      this.store.state.timeline.userLocks;
    if (oldLocks) {
      for (const userId of Object.keys(oldLocks)) {
        if (userId === this.store.state.roomSettings.user.id) continue;

        const oldUuids: string[] = oldLocks[userId] ?? [];
        const newUuids: string[] = newLocks[userId] ?? [];

        const releasedUuids: string[] = oldUuids.filter(
          (uuid) => !newUuids.includes(uuid),
        );
        const releasedBlocks: BlockDTO[] =
          this.findBlocksByUuids(releasedUuids);

        releasedBlocks.forEach((block: BlockDTO): void => {
          this.updateHandleInteractivity(block, true);
          block.rect.interactive = true;
        });
      }
    }

    for (const userId of Object.keys(newLocks)) {
      // skip own selection
      if (userId == this.store.state.roomSettings.user.id) {
        continue;
      }

      // skip if no selection
      const uuids: string[] = this.store.state.timeline.userLocks[userId] ?? [];
      if (uuids.length == 0) {
        continue;
      }

      // visualize
      let color: string | undefined =
        this.store.state.roomSettings.participants.find(
          (user: User): boolean => user.id == userId,
        )?.color;
      if (color == undefined) {
        color = config.colors.lockColor;
      }
      // disable interactivity
      const blocks: BlockDTO[] = this.findBlocksByUuids(uuids);
      blocks.forEach((block: BlockDTO): void => {
        if (block.groupUuid) {
          this.clearGroupBorder(block.groupUuid);
        }
        this.updateHandleInteractivity(block, false);
        this.updateIndicatorVisibility(block, false);
        block.rect.interactive = false;
        block.strokedRect.visible = false;
      });

      // draw lock-border
      const bounds: GroupBounds = this.computeGroupBounds(blocks);
      getLockContainer().addChild(
        this.createBoundingRectangle(bounds, config.lockBorderWidth, color),
      );
    }

    // TODO needs to be changed, after recent implementations
    // some blocks are now selected again (e.g. lock expired)
    this.forEachSelectedBlock((block: BlockDTO): void => {
      if (this.store.state.timeline.lockedBlocks.has(block.uuid)) return;
      block.strokedRect.visible = true;

      if (block.groupUuid != null) {
        // already rendered
        if (this.renderedGroupBorders.has(block.groupUuid)) return;

        const groupData: BlockSelection[] | undefined =
          this.store.state.timeline.groups.get(block.groupUuid);
        if (groupData == undefined) {
          console.error(`No Groupdata found for groupUuid: ${block.groupUuid}`);
          return;
        }
        this.createGroupBorder(block.groupUuid, groupData);
      } else {
        // check for groups
        this.updateHandleInteractivity(block, true);
        this.updateIndicatorVisibility(block, true);
        block.rect.interactive = true;
        block.strokedRect.visible = true;
      }
    });
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
                  selection.uuid == block.uuid,
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
    this.updateBorder(undefined, true);
    this.renderedGroupBorders.forEach(
      (groupBorder: Border, groupId: string): void => {
        this.updateBorder(groupId, true);
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
      this.updateBorder(undefined, true);
      this.renderedGroupBorders.forEach(
        (groupBorder: Border, groupId: string): void => {
          this.updateBorder(groupId, true);
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
    // notify user on click about edit-state
    if (this.isInteractionBlocked) {
      this.store.dispatch(
        TimelineActionTypes.UPDATE_SNACKBAR_TEXT,
        SnackbarTexts.TACTON_IS_READONLY(),
      );
      return;
    }

    // get uuids
    const uuids = Array.isArray(toSelect)
      ? toSelect.map((s: BlockSelection) => s.uuid) // array (multi-selection)
      : [toSelect.uuid]; // one element only
    // check, if uuid is already blocked
    let canEdit: boolean = true;
    for (const uuid of uuids) {
      if (this.store.state.timeline.lockedBlocks.has(uuid)) {
        const editorId: string | undefined =
          this.store.state.timeline.lockedBlocks.get(uuid);
        const editor: User | undefined =
          this.store.state.roomSettings.participants.find(
            (user: User): boolean => user.id == editorId,
          );
        if (editorId != this.store.state.roomSettings.user.id) {
          console.log("currently edited by ", editor);
          canEdit = false;
          break;
        }
      }
    }

    if (!canEdit) {
      return;
    }

    /*    // TODO old logic for per tacton blocking
    if (this.isInteractionBlocked) {
      // notify user on click about edit-state
      if (this.store.state.timeline.isEditable) {
        if (!this.store.getters.canEditTacton) {
          this.store.dispatch(
            TimelineActionTypes.UPDATE_SNACKBAR_TEXT,
            SnackbarTexts.TACTON_IS_EDITABLE_BUT_EDITED(),
          );
        }
      } else {
        this.store.dispatch(
          TimelineActionTypes.UPDATE_SNACKBAR_TEXT,
          SnackbarTexts.TACTON_IS_READONLY(),
        );
      }
      return;
    }*/

    this.updateSelection(toSelect);
    this.renderSelection();
    this.editedGroupMemberUuid = null;
    this.editedGroupUuid = null;

    // dispatch event
    this.eventBus.dispatchEvent(
      new Event(TimelineEvents.TACTON_BLOCK_SELECTED),
    );
  }
  private copySelection(): void {
    this.clearCopiedBlocks();
    const selectedBlocks: BlockDTO[] = [];

    this.store.state.timeline.selectedBlocks.forEach(
      (selection: BlockSelection): void => {
        selectedBlocks.push(
          this.store.state.timeline.blocks[selection.trackId][selection.index],
        );
        this.selectedBlockUuids.push(selection.uuid);
      },
    );

    let maxTrackId: number = -Infinity;
    let minTrackId: number = Infinity;
    // copy blocks
    if (selectedBlocks.length > 0) {
      const copiedBlockData: BlockData[] =
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
      this.clearSelectionBorder();
      this.clearGroupBorder();
    }
  }
  private pasteSelection(): void {
    if (this.copiedBlocks.length == 0) return;
    const copiedBlockData: BlockData[] = this.createBlockDataFromBlocks(
      this.copiedBlocks,
    );
    const addedBlockUuids: string[] = [];
    let groupCounter: number = 0;

    // separate by groupId
    const groupedCopiedBlockData: Map<string | null, BlockData[]> = new Map<
      string | null,
      BlockData[]
    >();

    for (const block of copiedBlockData) {
      const key: string | null = block.groupUuid;

      if (!groupedCopiedBlockData.has(key)) {
        groupedCopiedBlockData.set(key, []);
      }
      groupedCopiedBlockData.get(key)!.push(block);
    }

    groupedCopiedBlockData.forEach(
      (copiedBlockData: BlockData[], oldGroupId: string | null): void => {
        if (oldGroupId == null) {
          // blocks were not grouped
          copiedBlockData.forEach((blockData: BlockData): void => {
            const block: BlockDTO = this.createBlock(blockData);
            addedBlockUuids.push(block.uuid);
          });
        } else {
          // blocks were grouped
          const dummyGroupUuid: string = `${DUMMY_GROUP_UUID}${groupCounter++}`;
          let groupUuid: string | null = null;
          const groupSelectionData: BlockSelection[] = [];

          // create new blocks
          copiedBlockData.forEach((blockData: BlockData): void => {
            // create block
            const block: BlockDTO = this.createBlock(blockData);

            if (groupUuid == null) {
              groupUuid = block.uuid;
            }
            block.groupUuid = dummyGroupUuid;

            addedBlockUuids.push(block.uuid);
            // 0 is used as dummy index, after adding all copied blocks, the stored data is sorted, thus updating the indices to the correct values
            groupSelectionData.push({
              trackId: block.trackId,
              index: 0,
              uuid: block.uuid,
            });
          });

          if (groupUuid == null) {
            console.error("GroupId is undefined");
            return;
          }

          // create group
          this.store.dispatch(TimelineActionTypes.ADD_GROUP, {
            groupUuid: groupUuid,
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
              addedBlockUuids.some(
                (uuid: string): boolean => uuid == block.uuid,
              )
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
        this.selectedBlockUuids.some(
          (uuid: string): boolean => uuid == block.uuid,
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
    this.editedGroupMemberUuid = null;
    this.editedGroupUuid = null;
    this.clearGroupBorder();
    this.store.dispatch(TimelineActionTypes.DELETE_SELECTED_BLOCKS);
    this.calculateVirtualViewportLength();
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }
  private onMoveBlock(event: FederatedPointerEvent, block: BlockDTO): void {
    const isSelected = this.isBlockSelected(block);

    if (block.groupUuid && isSelected && this.isDoubleClick) {
      this.toggleMemberEdit(block);
    } else {
      if (this.editedGroupMemberUuid == null) {
        this.handleSelection(block);
      } else {
        // block is not from this group -> normal selection
        const isDifferentGroup: boolean =
          this.editedGroupUuid !== block.groupUuid;
        if (isDifferentGroup) {
          this.handleSelection(block);
        } else {
          // switching group-member
          if (this.editedGroupMemberUuid !== block.uuid) {
            this.switchMember(block);
          }
        }
      }
    }
    this.isDoubleClick = false;
    clearTimeout(this.doubleTimeout);

    // early exit if user is pressing shift --> multi-selection
    if (this.store.state.timeline.isPressingShift) {
      this.isSelecting = true;
      this.pointerUpHandler = () => this.onSelectingEnd();
      window.addEventListener("pointerup", this.pointerUpHandler);
      return;
    }

    // init vars
    this.initialX = event.globalX;
    this.initialY = event.globalY;
    this.initialBlockX = block.rect.x;
    this.initialBlockWidth = block.rect.width;
    this.currentTacton = block;
    this.currentYAdjustment = 0;
    this.lastViewportOffset =
      this.store.state.timeline.horizontalViewportOffset;
    this.lastTrackOffset = 0;

    // set interactionState to block multiSelection
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);

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
        this.updateBorder(undefined, true);
      }

      this.renderedGroupBorders.forEach(
        (borderData: Border, groupId: string): void => {
          this.updateBorder(groupId, true);
        },
      );
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
    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;

    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);

    this.lastVerticalOffset = this.store.state.timeline.verticalViewportOffset;

    this.store.dispatch(
      TimelineActionTypes.CHANGE_BLOCK_TRACK,
      this.lastTrackOffset,
    );
    this.lastTrackOffset = 0;

    this.calculateVirtualViewportLength();
    this.currentTacton = null;
    if (this.moved) {
      this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
    }
    this.moved = false;
    getLine().visible = false;

    this.isDoubleClick = true;
    this.doubleTimeout = setTimeout((): void => {
      this.isDoubleClick = false;
    }, 100);
  }
  private onSelectingEnd(): void {
    if (this.pointerUpHandler == null) return;
    this.isSelecting = false;
    window.removeEventListener("pointerup", this.pointerUpHandler);
  }
  private onAbsoluteResizeStart(
    event: FederatedPointerEvent,
    block: BlockDTO,
    direction: Direction,
  ): void {
    this.resizeDirection = direction;
    this.initialX = event.globalX;
    this.initialBlockWidth = block.rect.width;
    this.initialBlockX = block.rect.x;
    this.isCollidingOnResize = false;
    this.lastTrackOffset = 0;

    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
    if (this.editedGroupMemberUuid == null) {
      this.handleSelection(block);
    }

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

    if (this.resizeDirection === Direction.RIGHT) {
      // calculate new tacton width
      newWidth = Math.max(this.initialBlockWidth + deltaX, minBlockWidth);

      // check for minTactonWidth
      if (newWidth == minBlockWidth) return;

      // calculate x coordinate of right border
      const newRightX: number = this.initialBlockX + newWidth;

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

    // update borders
    if (this.selectionBorder != null) {
      this.updateBorder(undefined, true);
    }
    this.renderedGroupBorders.forEach(
      (borderData: Border, groupId: string): void => {
        this.updateBorder(groupId, true);
      },
    );
  }
  private onProportionalResizeStart(
    event: FederatedPointerEvent,
    direction: Direction,
    groupId?: string,
  ): void {
    let borderData: Border | undefined = this.selectionBorder;
    if (borderData == undefined && groupId != null) {
      borderData = this.renderedGroupBorders.get(groupId)!;
    }
    if (borderData == undefined) {
      return;
    }

    // need to update initData of groupBorder
    borderData.initStartX = borderData.lastStartX;
    borderData.initWidth = borderData.lastWidth;

    this.resizeDirection = direction;
    this.initialX = event.globalX;

    this.pointerMoveHandler = (event: PointerEvent) =>
      this.onProportionalResize(event, groupId);
    this.pointerUpHandler = () => this.onResizeEnd();
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
  }
  private onProportionalResize(event: PointerEvent, groupId?: string): void {
    let borderData: Border | undefined = this.selectionBorder;
    if (borderData == undefined && groupId != null) {
      borderData = this.renderedGroupBorders.get(groupId);
    }
    if (borderData == undefined) {
      return;
    }

    const deltaX: number =
      event.clientX - this.initialX - this.store.state.timeline.wrapperXOffset;
    const initWidth: number = borderData.initWidth;
    const initStartX: number = borderData.initStartX;
    const collisionsLeft: number = this.lastUuidsCollisionLeft.length;
    const collisionsRight: number = this.lastUuidsCollisionRight.length;

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
        this.lastUuidsCollisionLeft[0] != borderData.firstBlock.uuid
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
        this.lastUuidsCollisionRight[0] != borderData.lastBlock.uuid
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
    const uuidsCollisionLeft: string[] = [];
    const uuidsCollisionRight: string[] = [];

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
          uuidsCollisionLeft.push(selection.uuid);

          // calculate diff and new group parameters
          const diff: number = otherRightX - newX;
          newGroupStartX += diff;
          newGroupWidth -= diff;
        }

        if (other.rect.x <= newRightX && other.rect.x > newX) {
          // collision right
          uuidsCollisionRight.push(selection.uuid);

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

        this.store.state.timeline.sorted[block.trackId] = false;
      });

      // update groups
      this.renderedGroupBorders.forEach(
        (borderData: Border, groupId: string): void => {
          this.updateBorder(groupId, true);
        },
      );
      this.updateBorder(undefined, true);

      this.lastValidDeltaX = deltaX;
      this.lastUuidsCollisionRight = uuidsCollisionRight;
      this.lastUuidsCollisionLeft = uuidsCollisionLeft;
    }
  }
  private onResizeEnd(): void {
    if (this.pointerMoveHandler == null) return;
    if (this.pointerUpHandler == null) return;
    this.resizeDirection = null;
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);
    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;

    // only set InteractionState if groupBorder is not active
    if (this.selectionBorder == undefined) {
      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    }

    this.forEachSelectedBlock((block: BlockDTO): void => {
      this.updateHandles(block);
      block.initWidth = block.rect.width / this.store.state.timeline.zoomLevel;
      this.updateBlockInitData(block);
    });
    this.calculateVirtualViewportLength();
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }

  // change amplitude for groups
  private onChangeGroupAmplitude(
    event: FederatedPointerEvent,
    direction: Direction,
    members: BlockSelection[],
    border: Border,
  ): void {
    // save initial values
    this.initialY = event.globalY;

    // calculate possible offset based on members
    let minChange: number = Infinity;
    let maxChange: number = Infinity;
    members.forEach((selection: BlockSelection) => {
      const block: BlockDTO =
        this.store.state.timeline.blocks[selection.trackId][selection.index];
      const deltaToMin: number = config.minBlockHeight - block.rect.height;
      const deltaToMax: number = config.maxBlockHeight - block.rect.height;
      if (
        deltaToMin > -Infinity &&
        Math.abs(deltaToMin) < Math.abs(minChange)
      ) {
        minChange = deltaToMin;
      }
      if (deltaToMax > 0 && deltaToMax < maxChange) {
        maxChange = deltaToMax;
      }
    });
    if (minChange === Infinity) minChange = 0;
    if (maxChange === Infinity) maxChange = 0;

    this.pointerMoveHandler = (event: PointerEvent) =>
      this.changeGroupAmplitude(event, direction, border, minChange, maxChange);
    this.pointerUpHandler = () => this.onChangeGroupAmplitudeEnd(border);
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
  }
  private changeGroupAmplitude(
    event: PointerEvent,
    direction: Direction,
    border: Border,
    minChange: number,
    maxChange: number,
  ): void {
    let deltaY: number = 0;
    if (direction == Direction.TOP) {
      deltaY = this.initialY - event.clientY;
      deltaY += this.store.state.timeline.wrapperYOffset;
    } else if (direction == Direction.BOTTOM) {
      deltaY = event.clientY - this.initialY;
      deltaY -= this.store.state.timeline.wrapperYOffset;
    }

    if (deltaY <= maxChange && deltaY >= minChange) {
      const prevHeight: number = border.border.height;
      const newHeight: number = border.initHeight + deltaY;
      const heightChange: number = newHeight - prevHeight;
      const changes: BlockChanges = new BlockChanges();
      changes.height = heightChange;
      this.applyChanges(changes);

      this.renderedGroupBorders.forEach(
        (borderData: Border, groupId: string): void => {
          this.updateBorder(groupId, true);
        },
      );
      this.updateBorder(undefined, true);
    }
  }

  private onChangeGroupAmplitudeEnd(border: Border): void {
    // update data
    border.initHeight = border.border.height;
    this.forEachSelectedBlock((block: BlockDTO): void => {
      this.updateBlockInitData(block);
    });

    // remove eventListener
    if (this.pointerMoveHandler == null) return;
    if (this.pointerUpHandler == null) return;
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);
    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;

    // update instructions
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
  }
  private onChangeAmplitude(
    event: FederatedPointerEvent,
    block: BlockDTO,
    direction: Direction,
  ): void {
    this.initialY = event.globalY;
    this.initialBlockHeight = block.rect.height;
    this.currentTacton = block;
    this.lastTrackOffset = 0;

    if (this.editedGroupMemberUuid == null) {
      this.handleSelection(block);
    }
    this.pointerMoveHandler = (event: PointerEvent) =>
      this.changeAmplitude(event, block, direction);
    this.pointerUpHandler = () => this.onChangeAmplitudeEnd();
    window.addEventListener("pointermove", this.pointerMoveHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
  }
  private changeAmplitude(
    event: PointerEvent,
    block: BlockDTO,
    direction: Direction,
  ): void {
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

    // update borders
    if (this.selectionBorder != null) {
      this.updateBorder(undefined, true);
    }
    this.renderedGroupBorders.forEach(
      (borderData: Border, groupId: string): void => {
        this.updateBorder(groupId, true);
      },
    );
  }
  private onChangeAmplitudeEnd(): void {
    if (this.pointerMoveHandler == null) return;
    if (this.pointerUpHandler == null) return;
    window.removeEventListener("pointermove", this.pointerMoveHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);
    this.pointerMoveHandler = null;
    this.pointerUpHandler = null;

    this.forEachSelectedBlock((block: BlockDTO): void => {
      this.updateHandles(block);
      this.updateBlockInitData(block);
    });
    this.currentTacton = null;
    this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
  }
  private groupSelectedBlocks(): void {
    if (this.store.state.timeline.selectedBlocks.length <= 1) return;
    let groupUuid: string;
    let hasNewBlocks: boolean = true;
    const foundGroupIds: string[] = [];

    if (this.store.state.timeline.groups.size > 0) {
      hasNewBlocks = false;

      // get all groupIds of selection
      this.forEachSelectedBlock((block: BlockDTO): void => {
        if (block.groupUuid) {
          if (
            !foundGroupIds.some(
              (groupId: string): boolean => groupId == block.groupUuid,
            )
          ) {
            foundGroupIds.push(block.groupUuid);
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

      // get groupUuid
      const groupUuid: string = foundGroupIds[0];

      // remove groupUuid from blocks
      this.forEachSelectedBlock((block: BlockDTO): void => {
        block.groupUuid = null;
      });

      // clear border
      this.clearGroupBorder(groupUuid);

      // remove group from store
      this.store.state.timeline.groups.delete(groupUuid);

      // create selection border
      this.drawSelectionBorder();

      return;
    } else {
      // create new group

      // remove existing groups from store and clear border
      foundGroupIds.forEach((groupId: string): void => {
        this.clearGroupBorder(groupId);
        this.store.state.timeline.groups.delete(groupId);
      });

      groupUuid = this.store.state.timeline.selectedBlocks[0].uuid;
      const blocksOfGroup: BlockSelection[] = [];

      this.store.state.timeline.selectedBlocks.forEach(
        (selection: BlockSelection): void => {
          const block =
            this.store.state.timeline.blocks[selection.trackId][
              selection.index
            ];
          block.groupUuid = groupUuid;
          blocksOfGroup.push(selection);
        },
      );

      this.store.dispatch(TimelineActionTypes.ADD_GROUP, {
        groupUuid: groupUuid,
        selection: blocksOfGroup,
      });
      this.clearSelectionBorder();
      this.createGroupBorder(
        groupUuid,
        this.store.state.timeline.selectedBlocks,
      );
    }
  }

  //*************** Helper ***************
  private toggleMemberEdit(block: BlockDTO) {
    if (!(this.editedGroupMemberUuid === block.uuid)) {
      this.enterMemberEdit(block);
    } else {
      this.leaveMemberEdit();
    }
  }
  private highlightCurrentMember(block: BlockDTO): void {
    this.forEachBlock((block: BlockDTO): void => {
      const isActive = block.uuid === this.editedGroupMemberUuid;
      block.strokedRect.visible = isActive;
      this.updateHandleInteractivity(block, isActive);
      this.updateIndicatorVisibility(block, isActive);

      if (block.groupUuid !== this.editedGroupUuid) {
        block.rect.alpha = 0.5;
      }
    });

    if (block.groupUuid == null) return;

    // clear other borders
    this.clearSelectionBorder();
    this.renderedGroupBorders.forEach((border: Border) => {
      if (border.groupUuid !== block.groupUuid) {
        this.clearGroupBorder(border.groupUuid);
      }
    });

    // hide handles of own border
    this.toggleBorderHandles(block.groupUuid, false);
  }
  private enterMemberEdit(block: BlockDTO): void {
    this.editedGroupMemberUuid = block.uuid;
    this.editedGroupUuid = block.groupUuid;

    this.highlightCurrentMember(block);
    const members: BlockSelection[] | undefined =
      this.store.state.timeline.groups.get(block.groupUuid!);
    if (members == undefined) return;

    members.forEach((sel) => this.stashedSelection.set(sel.uuid, sel));
    this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
    this.store.dispatch(
      TimelineActionTypes.SELECT_BLOCK,
      this.stashedSelection.get(block.uuid),
    );
  }
  private switchMember(block: BlockDTO): void {
    this.editedGroupMemberUuid = block.uuid;
    this.highlightCurrentMember(block);
    this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
    this.store.dispatch(
      TimelineActionTypes.SELECT_BLOCK,
      this.stashedSelection.get(block.uuid),
    );
  }
  private leaveMemberEdit(): void {
    this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
    this.stashedSelection.forEach((sel) =>
      this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, sel),
    );
    this.stashedSelection.clear();

    this.forEachUnselectedBlock((b): void => {
      b.rect.alpha = 1;
    });

    this.forEachSelectedBlock((b): void => {
      b.strokedRect.visible = true;
      this.updateHandleInteractivity(b, false);
      this.updateIndicatorVisibility(b, false);
    });

    if (this.editedGroupUuid != null) {
      this.toggleBorderHandles(this.editedGroupUuid, true);
    }

    this.editedGroupMemberUuid = null;
    this.editedGroupUuid = null;
  }
  private toggleBorderHandles(
    groupId: string | undefined,
    isVisible: boolean,
  ): void {
    let border: Border | undefined;
    if (groupId) {
      border = this.renderedGroupBorders.get(groupId);
    } else {
      border = this.selectionBorder;
    }
    if (border == undefined) return;
    this.updateBorder(groupId, isVisible);
    border.rightHandle.visible = isVisible;
    border.rightIndicator.visible = isVisible;
    border.leftHandle.visible = isVisible;
    border.leftIndicator.visible = isVisible;
    border.topHandle.visible = isVisible;
    border.topIndicator.visible = isVisible;
    border.bottomHandle.visible = isVisible;
    border.bottomIndicator.visible = isVisible;
  }
  private updateSelection(toSelect: BlockSelection[] | BlockDTO): void {
    if (Array.isArray(toSelect)) {
      if (
        !this.store.state.timeline.isPressingShift ||
        this.editedGroupMemberUuid != null
      ) {
        this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
      }

      // detect groups
      const foundGroupIds: string[] = [];
      toSelect.forEach((selection: BlockSelection): void => {
        const block: BlockDTO =
          this.store.state.timeline.blocks[selection.trackId][selection.index];
        if (block.groupUuid) {
          // save groupId
          if (
            !foundGroupIds.some(
              (groupId: string): boolean => groupId == block.groupUuid,
            )
          ) {
            foundGroupIds.push(block.groupUuid);
          }
        } else {
          // select, if not grouped
          this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, selection);
        }
      });

      foundGroupIds.forEach((groupId: string): void => {
        this.store.state.timeline.groups
          .get(groupId)!
          .forEach((selection: BlockSelection): void => {
            this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, selection);
          });
      });
    } else {
      // check if selected or not
      const index: number = this.store.state.timeline.blocks[
        toSelect.trackId
      ].findIndex((other: BlockDTO): boolean => other.uuid === toSelect.uuid);
      if (index !== -1) {
        const selectionIndex: number =
          this.store.state.timeline.selectedBlocks.findIndex(
            (selection: BlockSelection): boolean =>
              selection.uuid === toSelect.uuid,
          );
        const selection: BlockSelection = {
          trackId: toSelect.trackId,
          index: index,
          uuid: toSelect.uuid,
        };
        if (selectionIndex == -1) {
          // block is not selected
          if (!this.store.state.timeline.isPressingShift) {
            // clear selection
            this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
          }

          if (this.editedGroupUuid != null) {
            this.clearGroupBorder(this.editedGroupUuid);
            this.store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
          }

          // check for group
          if (toSelect.groupUuid == null) {
            this.store.dispatch(TimelineActionTypes.SELECT_BLOCK, selection);
          } else {
            this.store.state.timeline.groups
              .get(toSelect.groupUuid)!
              .forEach((selection: BlockSelection): void => {
                this.store.dispatch(
                  TimelineActionTypes.SELECT_BLOCK,
                  selection,
                );
              });
          }
        } else {
          // block already selected
          if (this.store.state.timeline.isPressingShift) {
            if (toSelect.groupUuid != null) {
              // remove from store
              this.store.state.timeline.groups
                .get(toSelect.groupUuid)!
                .forEach((selection: BlockSelection): void => {
                  const selectionIndex: number =
                    this.store.state.timeline.selectedBlocks.findIndex(
                      (other: BlockSelection): boolean =>
                        other.uuid === selection.uuid,
                    );
                  this.store.dispatch(
                    TimelineActionTypes.UNSELECT_BLOCK,
                    selectionIndex,
                  );
                });
              // remove groupBorder
              this.clearGroupBorder(toSelect.groupUuid);
            } else {
              // remove block from selection
              this.store.dispatch(
                TimelineActionTypes.UNSELECT_BLOCK,
                selectionIndex,
              );
            }
          }
        }
      }
    }
  }
  private renderSelection(): void {
    this.forEachUnselectedBlock((block) => {
      block.strokedRect.visible = false;
      block.rect.alpha = 1;
      this.updateIndicatorVisibility(block, false);
      this.updateHandleInteractivity(block, true);
      if (block.groupUuid) {
        this.clearGroupBorder(block.groupUuid);
      }
    });

    if (this.store.state.timeline.selectedBlocks.length > 1) {
      const groups: string[] = [];

      // single blocks
      this.forEachSelectedBlock((block: BlockDTO): void => {
        block.strokedRect.visible = true;
        block.rect.alpha = 1;
        this.updateHandleInteractivity(block, false);
        if (block.groupUuid) {
          if (!groups.some((uuid) => uuid == block.groupUuid)) {
            groups.push(block.groupUuid);
          }
        }
      });

      // groups
      groups.forEach((uuid) => {
        const members: BlockSelection[] | undefined =
          this.store.state.timeline.groups.get(uuid);
        if (members) {
          if (!this.renderedGroupBorders.has(uuid)) {
            this.createGroupBorder(uuid, members);
          }
        }
      });
      this.drawSelectionBorder();
    } else {
      this.clearSelectionBorder();
      this.forEachSelectedBlock((block: BlockDTO): void => {
        block.strokedRect.visible = true;
        block.rect.alpha = 1;
        this.updateIndicatorVisibility(block, true);
        this.updateHandleInteractivity(block, true);
      });
    }
  }
  private createBoundingRectangle(
    bounds: GroupBounds,
    width: number,
    color: string,
  ): Graphics {
    const groupWidth = bounds.endX - bounds.startX;
    const groupHeight =
      (bounds.highestTrack - bounds.lowestTrack) * config.trackHeight +
      Math.min(bounds.maxHeightLowest, bounds.maxHeightHighest) +
      Math.abs(bounds.maxHeightLowest - bounds.maxHeightHighest) / 2;

    const rect = new Graphics();
    rect.rect(bounds.startX, bounds.y, groupWidth, groupHeight);
    rect.fill("rgb(0, 0, 0, 0)");
    rect.stroke({ width: width, color: color });

    return rect;
  }
  private computeGroupBounds(blocks: BlockDTO[]): GroupBounds {
    let startX: number = Infinity;
    let endX: number = -Infinity;
    let lowestTrack: number = Infinity;
    let highestTrack: number = 0;
    let maxHeightLowest: number = config.minBlockHeight;
    let maxHeightHighest: number = config.minBlockHeight;
    let y: number = 0;

    for (const block of blocks) {
      const blockStart: number = block.rect.x;
      const blockEnd: number = blockStart + block.rect.width;
      const trackId: number = block.trackId;
      const height: number = block.rect.height;

      if (blockStart < startX) {
        startX = blockStart;
      }
      if (blockEnd > endX) {
        endX = blockEnd;
      }

      if (
        trackId < lowestTrack ||
        (trackId === lowestTrack && height > maxHeightLowest)
      ) {
        lowestTrack = trackId;
        maxHeightLowest = height;
        y = block.rect.y;
      }

      if (trackId > highestTrack) {
        highestTrack = trackId;
        maxHeightHighest = height;
      } else if (trackId === highestTrack) {
        maxHeightHighest = Math.max(maxHeightHighest, height);
      }
    }

    return {
      startX,
      endX,
      lowestTrack,
      highestTrack,
      maxHeightLowest,
      maxHeightHighest,
      y,
    };
  }
  private findBlocksByUuids(uuids: string[]): BlockDTO[] {
    const result: BlockDTO[] = [];
    for (const uuid of uuids) {
      for (const trackBlocks of Object.values(
        this.store.state.timeline.blocks,
      )) {
        const found = trackBlocks.find((b) => b.uuid === uuid);
        if (found) {
          result.push(found);
          break;
        }
      }
    }
    return result;
  }

  // wrapper for horizontal block resizing (left, right)
  // decides, what implementation to use
  private onHorizontalResize(
    event: FederatedPointerEvent,
    direction: Direction,
    block: BlockDTO,
  ): void {
    if (this.editedGroupMemberUuid == null && block.groupUuid != null) {
      this.onHorizontalGroupResize(event, direction, block.groupUuid);
    } else {
      this.onAbsoluteResizeStart(event, block, direction);
    }
  }

  // wrapper for vertical block resizing (amplitude)
  // decides, what implementation to use
  private onVerticalResize(
    event: FederatedPointerEvent,
    direction: Direction,
    block: BlockDTO,
  ): void {
    if (this.editedGroupMemberUuid == null && block.groupUuid != null) {
      this.onVerticalGroupResize(event, direction, block.groupUuid);
    } else {
      this.onChangeAmplitude(event, block, direction);
    }
  }
  private onHorizontalGroupResize(
    event: FederatedPointerEvent,
    direction: Direction,
    groupUuid?: string,
  ): void {
    if (this.editedGroupMemberUuid == null && groupUuid) {
      const members: BlockSelection[] | undefined =
        this.store.state.timeline.groups.get(groupUuid);
      if (members == undefined) return;
      this.handleSelection(members);
    }
    this.onProportionalResizeStart(event, direction, groupUuid);
  }
  private onVerticalGroupResize(
    event: FederatedPointerEvent,
    direction: Direction,
    groupUuid?: string,
  ): void {
    let border: Border | undefined;
    let members: BlockSelection[] | undefined;
    // get group
    if (groupUuid) {
      border = this.renderedGroupBorders.get(groupUuid);
      members = this.store.state.timeline.groups.get(groupUuid);
    }
    // get multiselection
    if (border == undefined) {
      border = this.selectionBorder;
      members = this.store.state.timeline.selectedBlocks;
    }
    // exit
    if (border == undefined || members == undefined) {
      return;
    }

    // select first -> user clicked on handle, without selecting first
    if (this.editedGroupMemberUuid == null && groupUuid) {
      this.handleSelection(members);
    }
    this.onChangeGroupAmplitude(event, direction, members, border);
  }
  private isBlockSelected(block: BlockDTO): boolean {
    return this.store.state.timeline.selectedBlocks.some(
      (selection: BlockSelection): boolean => selection.uuid == block.uuid,
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
    let borderData: Border | undefined = this.selectionBorder;

    if (borderData == undefined && block.groupUuid != null) {
      borderData = this.renderedGroupBorders.get(block.groupUuid);
    }

    if (borderData == undefined) {
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
  private drawBorderForBlocks(
    blocks: BlockSelection[],
    groupId?: string,
  ): Border {
    // calculate bounds
    const {
      startX,
      groupWidth,
      groupY,
      groupHeight,
      firstBlock,
      lastBlock,
      topBlock,
      bottomBlock,
    }: BoundingData = getBoundingData(blocks, null);

    // create container
    const container = new Container();
    const border = new Graphics()
      .rect(startX, groupY, groupWidth, groupHeight)
      .fill("rgb(0, 0, 0, 0)")
      .stroke({ width: 2, color: config.colors.groupHandleColor });

    // create handles
    const makeHandle = (
      x: number,
      y: number,
      w: number,
      h: number,
      cursor: string,
    ) => {
      const hdl = new Graphics();
      hdl.rect(x, y, w, h);
      hdl.fill(config.colors.handleColor);
      hdl.interactive = true;
      hdl.cursor = cursor;
      return hdl;
    };

    const makeIndicator = (x: number, y: number) => {
      const ind = new Graphics();
      ind.circle(x, y, config.groupHandleRadius);
      ind.fill(config.colors.groupHandleColor);
      return ind;
    };

    const rightHandle = makeHandle(
      startX + groupWidth - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
      "ew-resize",
    );
    const leftHandle = makeHandle(
      startX - config.resizingHandleWidth / 2,
      groupY,
      config.resizingHandleWidth,
      groupHeight,
      "ew-resize",
    );
    const topHandle = makeHandle(
      startX,
      groupY - config.resizingHandleWidth / 2,
      groupWidth,
      config.resizingHandleWidth,
      "ns-resize",
    );
    const bottomHandle = makeHandle(
      startX,
      groupY + groupHeight - config.resizingHandleWidth / 2,
      groupWidth,
      config.resizingHandleWidth,
      "ns-resize",
    );

    const rightIndicator = makeIndicator(
      startX + groupWidth,
      groupY + groupHeight / 2,
    );
    const leftIndicator = makeIndicator(startX, groupY + groupHeight / 2);
    const topIndicator = makeIndicator(startX + groupWidth / 2, groupY);
    const bottomIndicator = makeIndicator(
      startX + groupWidth / 2,
      groupY + groupHeight,
    );

    // build dto
    [
      border,
      rightHandle,
      rightIndicator,
      leftHandle,
      leftIndicator,
      topHandle,
      topIndicator,
      bottomHandle,
      bottomIndicator,
    ].forEach((el) => container.addChild(el));

    const newBorderData: Border = new Border(
      container,
      border,
      leftHandle,
      leftIndicator,
      rightHandle,
      rightIndicator,
      topHandle,
      topIndicator,
      bottomHandle,
      bottomIndicator,
      firstBlock!,
      lastBlock!,
      topBlock!,
      bottomBlock!,
      startX,
      startX,
      groupWidth,
      groupWidth,
      groupY,
      groupY,
      groupHeight,
    );
    newBorderData.groupUuid = groupId;

    newBorderData.addListeners({
      onHorizontalResize: this.onHorizontalGroupResize.bind(this),
      onVerticalResize: this.onVerticalGroupResize.bind(this),
    });

    getDynamicContainer().addChild(container);
    return newBorderData;
  }
  private drawSelectionBorder(): void {
    this.clearSelectionBorder();
    if (this.store.state.timeline.selectedBlocks.length <= 1) return;

    if (this.renderedGroupBorders.size == 1) {
      // there is only one group active, check if only members of this group are selected
      const iterator: IterableIterator<string> =
        this.renderedGroupBorders.keys();
      const groupId: string = iterator.next().value;

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

    this.renderedGroupBorders.forEach((borderData, groupId) =>
      this.toggleBorderHandles(groupId, false),
    );
    this.forEachSelectedBlock((block) => {
      this.updateHandleInteractivity(block, false);
      this.updateIndicatorVisibility(block, false);
    });
    this.selectionBorder = this.drawBorderForBlocks(
      this.store.state.timeline.selectedBlocks,
    );
  }
  private clearSelectionBorder(): void {
    if (this.selectionBorder != null) {
      this.selectionBorder.removeListeners();
      getDynamicContainer().removeChild(this.selectionBorder.container);
      this.selectionBorder.container.destroy({ children: true });
      this.selectionBorder = undefined;
      this.renderedGroupBorders.forEach((borderData, groupId) =>
        this.toggleBorderHandles(groupId, true),
      );
      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    }
  }
  private createGroupBorder(
    groupId: string,
    selection: BlockSelection[],
  ): Border {
    const groupBorder: Border = this.drawBorderForBlocks(selection, groupId);
    this.renderedGroupBorders.set(groupId, groupBorder);
    return groupBorder;
  }

  private reuseOldBoundingData(border: Border): BoundingData {
    const firstBlock: BlockDTO =
      this.store.state.timeline.blocks[border.firstBlock.trackId][
        border.firstBlock.index
      ];
    const lastBlock: BlockDTO =
      this.store.state.timeline.blocks[border.lastBlock.trackId][
        border.lastBlock.index
      ];
    const topBlock: BlockDTO =
      this.store.state.timeline.blocks[border.topBlock.trackId][
        border.topBlock.index
      ];
    const bottomBlock: BlockDTO =
      this.store.state.timeline.blocks[border.bottomBlock.trackId][
        border.bottomBlock.index
      ];
    const startX: number = firstBlock.rect.x;
    const endX: number = lastBlock.rect.x + lastBlock.rect.width;
    const groupWidth: number = endX - startX;
    const groupY: number = topBlock.rect.y;
    const highestTrack: number = bottomBlock.trackId;
    const lowestTrack: number = topBlock.trackId;
    const maxHeightOfHighestTrack: number = bottomBlock.rect.height;
    const maxHeightOfLowestTrack: number = topBlock.rect.height;
    const groupHeight: number =
      (highestTrack - lowestTrack) * config.trackHeight +
      Math.min(maxHeightOfLowestTrack, maxHeightOfHighestTrack) +
      Math.abs(maxHeightOfLowestTrack - maxHeightOfHighestTrack) / 2;

    return {
      startX,
      groupWidth,
      groupY,
      groupHeight,
    };
  }
  // TODO be consequent, if no groupId, clear selection -> why not directly pass border as parameter
  private clearGroupBorder(groupId?: string): void {
    if (groupId != undefined) {
      const border: Border | undefined = this.renderedGroupBorders.get(groupId);
      if (border == undefined) return;
      border.removeListeners();
      getDynamicContainer().removeChild(border.container);
      border.container.destroy({ children: true });
      this.renderedGroupBorders.delete(groupId);
    } else {
      // clear all
      this.renderedGroupBorders.forEach(
        (border: Border, groupId: string): void => {
          border.removeListeners();
          getDynamicContainer().removeChild(border.container);
          border.container.destroy({ children: true });

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
  private updateBorder(groupId?: string, updateHandles: boolean = false) {
    let borderData: Border;
    if (groupId) {
      borderData = this.renderedGroupBorders.get(groupId)!;
    } else {
      if (this.selectionBorder == undefined) return;
      borderData = this.selectionBorder;
    }

    let members: BlockSelection[] | undefined;
    if (borderData.groupUuid != undefined) {
      members = this.store.state.timeline.groups.get(borderData.groupUuid);
    } else {
      members = this.store.state.timeline.selectedBlocks;
    }
    if (members == undefined) return;
    const {
      startX,
      groupWidth,
      groupY,
      groupHeight,
      firstBlock,
      lastBlock,
      topBlock,
      bottomBlock,
    }: BoundingData =
      this.editedGroupMemberUuid != null
        ? getBoundingData(
            members,
            this.editedGroupMemberUuid,
            this.lastTrackOffset,
          )
        : this.reuseOldBoundingData(borderData);

    if (this.editedGroupMemberUuid) {
      borderData.topBlock = topBlock!;
      borderData.bottomBlock = bottomBlock!;
      borderData.firstBlock = firstBlock!;
      borderData.lastBlock = lastBlock!;
    }

    borderData.border.clear();
    borderData.border.rect(startX, groupY, groupWidth, groupHeight);
    borderData.border.fill("rgb(0, 0, 0, 0)");
    borderData.border.stroke({
      width: 2,
      color: config.colors.groupHandleColor,
    });

    if (updateHandles) {
      borderData.rightHandle.clear();
      borderData.rightHandle.rect(
        startX + groupWidth - config.resizingHandleWidth / 2,
        groupY,
        config.resizingHandleWidth,
        groupHeight,
      );
      borderData.rightHandle.fill(config.colors.handleColor);

      borderData.rightIndicator.clear();
      borderData.rightIndicator.circle(
        startX + groupWidth,
        groupY + groupHeight / 2,
        config.groupHandleRadius,
      );
      borderData.rightIndicator.fill(config.colors.groupHandleColor);

      borderData.leftHandle.clear();
      borderData.leftHandle.rect(
        startX - config.resizingHandleWidth / 2,
        groupY,
        config.resizingHandleWidth,
        groupHeight,
      );
      borderData.leftHandle.fill(config.colors.handleColor);

      borderData.leftIndicator.clear();
      borderData.leftIndicator.circle(
        startX,
        groupY + groupHeight / 2,
        config.groupHandleRadius,
      );
      borderData.leftIndicator.fill(config.colors.groupHandleColor);

      borderData.topHandle!.clear();
      borderData.topHandle!.rect(
        startX,
        groupY - config.resizingHandleWidth / 2,
        groupWidth,
        config.resizingHandleWidth,
      );
      borderData.topHandle!.fill(config.colors.handleColor);

      borderData.topIndicator!.clear();
      borderData.topIndicator!.circle(
        startX + groupWidth / 2,
        groupY,
        config.groupHandleRadius,
      );
      borderData.topIndicator!.fill(config.colors.groupHandleColor);

      borderData.bottomHandle!.clear();
      borderData.bottomHandle!.rect(
        startX,
        groupY + groupHeight - config.resizingHandleWidth / 2,
        groupWidth,
        config.resizingHandleWidth,
      );
      borderData.bottomHandle!.fill(config.colors.handleColor);

      borderData.bottomIndicator!.clear();
      borderData.bottomIndicator!.circle(
        startX + groupWidth / 2,
        groupY + groupHeight,
        config.groupHandleRadius,
      );
      borderData.bottomIndicator!.fill(config.colors.groupHandleColor);
    }

    borderData.lastStartX = startX;
    borderData.lastWidth = groupWidth;
    borderData.lastY = groupY;
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

      this.renderedGroupBorders.forEach(
        (borderData: Border, groupId: string): void => {
          this.updateBorder(groupId, true);
        },
      );
      this.updateBorder(undefined, true);
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
    this.unselectedBorderList = [];
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
                  selection.uuid == block.uuid,
              )
            ) {
              // block is unselected
              this.unselectedBorders[block.trackId].push(block.rect.x);
              this.unselectedBorders[block.trackId].push(
                block.rect.x + block.rect.width,
              );
              this.unselectedBorderList.push(block.rect.x);
              this.unselectedBorderList.push(block.rect.x + block.rect.width);
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
    const maxAttempts: number = 10;
    let attemptCount: number = 0;
    let validOffset: number = offset;
    let hasCollision: boolean = true;
    let isSticking: boolean = false;
    let snapped: {
      offset: number | null;
      dist: number;
      lineX: number;
      snappedToEnd: boolean;
    } = { offset: null, dist: Infinity, lineX: 0, snappedToEnd: false };

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

          if (!isSticking) {
            if (this.store.state.timeline.isSnappingActive) {
              for (const lineX of this.store.state.timeline.gridLines) {
                // left
                if (Math.abs(start2 - lineX) <= config.moveSnappingRadius) {
                  const dist = start2 - lineX;
                  const offset = lineX - this.selectedBorders[trackId][i];
                  if (dist < snapped.dist) {
                    snapped = {
                      offset: offset,
                      dist: dist,
                      lineX: lineX,
                      snappedToEnd: false,
                    };
                  }
                }
                // right
                if (Math.abs(end2 - lineX) <= config.moveSnappingRadius) {
                  const dist = end2 - lineX;
                  const offset = lineX - this.selectedBorders[trackId][i + 1];
                  if (dist < snapped.dist) {
                    snapped = {
                      offset: offset,
                      dist: dist,
                      lineX: lineX,
                      snappedToEnd: true,
                    };
                  }
                }
              }
            }
            if (this.store.state.timeline.isSnappingRelativeActive) {
              for (const lineX of this.unselectedBorderList) {
                // left relative
                if (Math.abs(start2 - lineX) <= config.moveSnappingRadius) {
                  const dist = start2 - lineX;
                  const offset = lineX - this.selectedBorders[trackId][i];
                  if (dist < snapped.dist) {
                    snapped = {
                      offset: offset,
                      dist: dist,
                      lineX: lineX,
                      snappedToEnd: false,
                    };
                  }
                }
                // right relative
                if (Math.abs(end2 - lineX) <= config.moveSnappingRadius) {
                  const dist = end2 - lineX;
                  const offset = lineX - this.selectedBorders[trackId][i + 1];
                  if (dist < snapped.dist) {
                    snapped = {
                      offset: offset,
                      dist: dist,
                      lineX: lineX,
                      snappedToEnd: true,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    const line: Graphics = getLine();
    // no collision, choose gridLine for snapping
    if (!isSticking && snapped.offset != null) {
      validOffset = snapped.offset;
      if (snapped.snappedToEnd) {
        line.x = snapped.lineX;
      } else {
        line.x = snapped.lineX;
      }
      line.visible = true;
    } else {
      line.visible = false;
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
          if (this.unselectedBorders[track] != undefined) {
            if (this.unselectedBorders[track].length != 1) {
              for (
                let k = 0;
                k < this.unselectedBorders[track].length;
                k += 2
              ) {
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
            }
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
            uuid: block.uuid,
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

  //******* event-listener *******
  private onCanvasMouseDown = (event: MouseEvent): void => {
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
  };
  private onCanvasMouseMove = (event: MouseEvent): void => {
    if (!this.isMouseDragging) return;
    this.selectionEnd = { x: event.clientX, y: event.clientY };
    this.drawSelectionBox();
  };
  private onCanvasMouseUp = (event: MouseEvent): void => {
    if (event.button !== 0 || !this.isMouseDragging) return;
    this.isMouseDragging = false;
    this.removeSelectionBox();
    this.selectRectanglesWithin();
  };

  //******* public helpers *******
  public clearData(): void {
    this.clearCopiedBlocks();
    this.clearGroupBorder();
    this.clearSelectionBorder();
    getLockContainer().removeChildren();
  }
  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.store.state.timeline.isEditable) return;
    // detect STRG or Meta
    if (event.code == "ControlLeft" && !this.isMacOS) {
      if (!this.strgDown) {
        this.strgDown = true;
      }
    } else if (event.code == "MetaLeft") {
      if (!this.strgDown) {
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
      this.eventBus.dispatchEvent(new Event(TimelineEvents.TACTON_WAS_EDITED));
    }
    if (this.strgDown && event.code == "KeyS" && !event.shiftKey) {
      event.preventDefault();
      this.store.dispatch(TimelineActionTypes.TOGGLE_SNAPPING_STATE);
    }
    if (this.strgDown && event.code === "KeyS" && event.shiftKey) {
      event.preventDefault();
      this.store.dispatch(TimelineActionTypes.TOGGLE_RELATIVE_SNAPPING);
    }
    if (event.code == "Escape") this.clearCopiedBlocks();
    if (event.code == "Delete") this.deleteBlock();

    // detect shift
    if (event.key == "Shift" && !this.store.state.timeline.isPressingShift) {
      this.store.dispatch(TimelineActionTypes.TOGGLE_SHIFT_VALUE);
    }
  };
  private handleKeyUp = (event: KeyboardEvent) => {
    if (!this.store.state.timeline.isEditable) return;
    if (
      (event.code == "ControlLeft" && !this.isMacOS) ||
      event.code == "MetaLeft"
    ) {
      this.strgDown = false;
    }

    if (event.key == "Shift" && this.store.state.timeline.isPressingShift) {
      this.store.dispatch(TimelineActionTypes.TOGGLE_SHIFT_VALUE);
    }
  };
  private installEventListeners(): void {
    const pixiApp: Application = getPixiApp();
    pixiApp.canvas.addEventListener("mousedown", this.onCanvasMouseDown);
    pixiApp.canvas.addEventListener("mousemove", this.onCanvasMouseMove);
    pixiApp.canvas.addEventListener("mouseup", this.onCanvasMouseUp);

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);

    this.eventBus.addEventListener(
      TimelineEvents.UPDATED_USER_LOCKS,
      this.handleUpdatedUserLocks,
    );
  }
  private handleUpdatedUserLocks = (e: Event): void => {
    const eventData = e as CustomEvent<{ oldLocks: Record<string, string[]> }>;
    this.updateLocks(eventData.detail.oldLocks);
  };
  public toggleBlockVisibility(isVisible: boolean): void {
    this.clearSelectionBorder();
    this.clearGroupBorder();
    this.store.state.timeline.selectedBlocks = [];
    this.forEachBlock((block: BlockDTO): void => {
      // reset selected blocks
      this.updateIndicatorVisibility(block, false);
      block.strokedRect.visible = false;
      block.container.visible = isVisible;
    });
  }
  public blockInteraction(blockInteraction: boolean): void {
    this.isInteractionBlocked = blockInteraction;

    if (this.isInteractionBlocked) {
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
        (borderData: Border, groupId: string): void => {
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
  destroy(): void {
    this.clearCopiedBlocks();
    this.clearGroupBorder();
    this.clearSelectionBorder();
    this.store.state.timeline.selectedBlocks = [];
    this.store.state.timeline.userLocks = {};
    this.store.state.timeline.lockedBlocks.clear();

    const pixiApp: Application = getPixiApp();
    // remove existing Event-Listeners
    pixiApp.canvas.removeEventListener("mousedown", this.onCanvasMouseDown);
    pixiApp.canvas.removeEventListener("mousemove", this.onCanvasMouseMove);
    pixiApp.canvas.removeEventListener("mouseup", this.onCanvasMouseUp);

    this.eventBus.removeEventListener(
      TimelineEvents.UPDATED_USER_LOCKS,
      this.handleUpdatedUserLocks,
    );

    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }
}
