import { MutationTree } from "vuex";
import { BlockManager } from "@/renderer/helpers/timeline/blockManager";
import { BlockDTO, BlockSelection } from "@/renderer/helpers/timeline/types";
import { ContainerChild, Graphics } from "pixi.js";
import { getDynamicContainer } from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { State } from "./state";
export enum TimelineMutations {
  SET_BLOCK_MANAGER = "setBlocKManager",
  SET_ZOOM_LEVEL = "setZoomLevel",
  SET_INITIAL_ZOOM_LEVEL = "setInitialZoomLevel",
  SET_HORIZONTAL_VIEWPORT_OFFSET = "setHorizontalViewportOffset",
  SET_VERTICAL_VIEWPORT_OFFSET = "setVerticalViewportOffset",
  SET_GRID_LINES = "setGridLines",
  SET_TRACK_COUNT = "setTrackCount",
  SET_VISIBLE_HEIGHT = "setVisibleHeight",
  CALCULATE_SCROLLABLE_HEIGHT = "calculateScrollableHeight",
  INIT_TRACKS = "initTracks",
  ADD_BLOCK = "addBlock",
  SORT_TACTONS = "sortTactons",
  DELETE_BLOCKS_OF_TRACK = "deleteBlocksOfTrack",
  DELETE_SELECTED_BLOCKS = "deleteSelectedBlocks",
  SELECT_BLOCK = "selectBlock",
  UNSELECT_BLOCK = "unselectBlock",
  CLEAR_SELECTION = "clearSelection",
  SET_INITIAL_VIRTUAL_VIEWPORT_WIDTH = "setInitialVirtualViewportWidth",
  SET_CURRENT_VIRTUAL_VIEWPORT_WIDTH = "setCurrentVirtualViewportWidth",
  SET_INTERACTION_STATE = "setInteractionState",
  CHANGE_BLOCK_TRACK = "changeBlockTrack",
  CALCULATE_LAST_BLOCK_POSITION = "calculateLastBlockPosition",
  TOGGLE_SHIFT_VALUE = "toggleShiftValue",
  UPDATE_CURRENT_CURSOR_POSITION = "updateCurrentCursorPosition",
  UNGROUP_SELECTED_BLOCKS = "ungroupSelectedBlocks",
  ADD_GROUP = "addGroup",
  TOGGLE_SNAPPING_STATE = "toggleSnappingState",
  TOGGLE_RELATIVE_SNAPPING = "toggleRelativeSnapping",
  TOGGLE_EDIT_STATE = "toggleEditState",
  SET_CANVAS_TOP_OFFSET = "setCanvasTopOffset",
  SET_WRAPPER_X_OFFSET = "setWrapperXOffset",
  SET_WRAPPER_Y_OFFSET = "setWrapperYOffset",
  SET_CANVAS_WIDTH = "setCanvasWidth",
  SET_SNACKBAR_TEXT = "setSnackbarText",
}

export type Mutations<S = State> = {
  [TimelineMutations.SET_BLOCK_MANAGER](
    state: S,
    blockManager: BlockManager,
  ): void;
  [TimelineMutations.SET_ZOOM_LEVEL](state: S, newZoomLevel: number): void;
  [TimelineMutations.SET_INITIAL_ZOOM_LEVEL](
    state: S,
    newInitialZoomLevel: number,
  ): void;
  [TimelineMutations.SET_HORIZONTAL_VIEWPORT_OFFSET](
    state: S,
    viewportOffset: number,
  ): void;
  [TimelineMutations.SET_VERTICAL_VIEWPORT_OFFSET](
    state: S,
    viewportOffset: number,
  ): void;
  [TimelineMutations.SET_GRID_LINES](state: S, gridLines: number[]): void;
  [TimelineMutations.SET_TRACK_COUNT](state: S, newTrackCount: number): void;
  [TimelineMutations.SET_VISIBLE_HEIGHT](state: S, visibleHeight: number): void;
  [TimelineMutations.CALCULATE_SCROLLABLE_HEIGHT](state: S): void;
  [TimelineMutations.INIT_TRACKS](state: S): void;
  [TimelineMutations.ADD_BLOCK](
    state: S,
    payload: { trackId: number; block: BlockDTO },
  ): void;
  [TimelineMutations.SORT_TACTONS](state: S): void;
  [TimelineMutations.DELETE_SELECTED_BLOCKS](state: S): void;
  [TimelineMutations.DELETE_BLOCKS_OF_TRACK](state: S, trackId: number): void;
  [TimelineMutations.SELECT_BLOCK](state: S, block: BlockSelection): void;
  [TimelineMutations.UNSELECT_BLOCK](state: S, selectionIndex: number): void;
  [TimelineMutations.CLEAR_SELECTION](state: S): void;
  [TimelineMutations.SET_INITIAL_VIRTUAL_VIEWPORT_WIDTH](
    state: S,
    newWidth: number,
  ): void;
  [TimelineMutations.SET_CURRENT_VIRTUAL_VIEWPORT_WIDTH](
    state: S,
    newWidth: number,
  ): void;
  [TimelineMutations.SET_INTERACTION_STATE](state: S, newState: boolean): void;
  [TimelineMutations.CHANGE_BLOCK_TRACK](
    state: S,
    payload: { sourceTrack: number; targetTrack: number; blockIndex: number },
  ): void;
  [TimelineMutations.CALCULATE_LAST_BLOCK_POSITION](state: S): void;
  [TimelineMutations.TOGGLE_SHIFT_VALUE](state: S): void;
  [TimelineMutations.UPDATE_CURRENT_CURSOR_POSITION](
    state: S,
    newPosition: { x: number; y: number },
  ): void;
  [TimelineMutations.UNGROUP_SELECTED_BLOCKS](state: S, groupId: number): void;
  [TimelineMutations.ADD_GROUP](
    state: S,
    groupData: { groupId: number; selection: BlockSelection[] },
  ): void;
  [TimelineMutations.TOGGLE_SNAPPING_STATE](state: S): void;
  [TimelineMutations.TOGGLE_EDIT_STATE](state: S, isEditable?: boolean): void;
  [TimelineMutations.SET_CANVAS_TOP_OFFSET](state: S, topOffset: number): void;
  [TimelineMutations.SET_WRAPPER_X_OFFSET](state: S, xOffset: number): void;
  [TimelineMutations.SET_WRAPPER_Y_OFFSET](state: S, yOffset: number): void;
  [TimelineMutations.SET_CANVAS_WIDTH](state: S, width: number): void;
  [TimelineMutations.SET_SNACKBAR_TEXT](state: S, text: string): void;
  [TimelineMutations.TOGGLE_RELATIVE_SNAPPING](state: S): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [TimelineMutations.SET_BLOCK_MANAGER](
    state: State,
    blockManager: BlockManager,
  ): void {
    state.blockManager = blockManager;
  },
  [TimelineMutations.SET_ZOOM_LEVEL](state: State, newZoomLevel: number): void {
    state.zoomLevel = newZoomLevel;
  },
  [TimelineMutations.SET_INITIAL_ZOOM_LEVEL](
    state: State,
    newInitialZoomLevel: number,
  ): void {
    state.initialZoomLevel = newInitialZoomLevel;
  },
  [TimelineMutations.SET_HORIZONTAL_VIEWPORT_OFFSET](
    state: State,
    viewportOffset: number,
  ): void {
    state.horizontalViewportOffset = viewportOffset;
  },
  [TimelineMutations.SET_VERTICAL_VIEWPORT_OFFSET](
    state: State,
    viewportOffset: number,
  ): void {
    state.verticalViewportOffset = viewportOffset;
  },
  [TimelineMutations.SET_GRID_LINES](state: State, gridLines: number[]): void {
    state.gridLines = gridLines;
  },
  [TimelineMutations.SET_TRACK_COUNT](
    state: State,
    newTrackCount: number,
  ): void {
    state.trackCount = newTrackCount;
  },
  [TimelineMutations.SET_VISIBLE_HEIGHT](
    state: State,
    visibleHeight: number,
  ): void {
    state.visibleHeight = visibleHeight;
  },
  [TimelineMutations.CALCULATE_SCROLLABLE_HEIGHT](state: State): void {
    const trackHeight: number = (state.trackCount + 1) * config.trackHeight;
    state.scrollableHeight =
      trackHeight > state.visibleHeight
        ? trackHeight - state.visibleHeight + config.componentPadding
        : 0;
  },
  [TimelineMutations.INIT_TRACKS](state: State): void {
    for (let trackId = 0; trackId <= state.trackCount; trackId++) {
      if (!state.blocks[trackId]) {
        state.blocks[trackId] = [];
      }
    }
  },
  [TimelineMutations.ADD_BLOCK](
    state: State,
    { trackId, block }: { trackId: number; block: BlockDTO },
  ): void {
    if (state.blocks[trackId] == undefined) {
      state.blocks[trackId] = [];
    }
    state.blocks[trackId].push(block);
    state.sorted[trackId] = false;
  },
  [TimelineMutations.SORT_TACTONS](state: State): void {
    const sortedBlocks: Record<number, BlockDTO[]> = {};
    Object.keys(state.blocks).forEach(
      (channel: string, trackId: number): void => {
        if (state.sorted[trackId]) {
          sortedBlocks[trackId] = state.blocks[trackId];
        } else {
          sortedBlocks[trackId] = [...state.blocks[trackId]].sort(
            (a: BlockDTO, b: BlockDTO): number => {
              const rectA: Graphics = a.rect;
              const rectB: Graphics = b.rect;
              if (rectA.x === rectB.x) {
                return rectB.width - rectA.width;
              }
              return rectA.x - b.rect.x;
            },
          );
          state.sorted[trackId] = true;
        }
      },
    );

    // fix selectionData
    state.selectedBlocks.forEach((selection: BlockSelection): void => {
      const block: BlockDTO | undefined =
        sortedBlocks[selection.trackId][selection.index];
      if (block == undefined || block.rect.uid != selection.uid) {
        selection.index = sortedBlocks[selection.trackId].findIndex(
          (b: BlockDTO): boolean => {
            return b.rect.uid == selection.uid;
          },
        );
      }
    });

    // fix groupData
    state.groups.forEach((group: BlockSelection[]): void => {
      group.forEach((selection: BlockSelection): void => {
        const block: BlockDTO | undefined =
          sortedBlocks[selection.trackId][selection.index];
        if (block == undefined || block.rect.uid != selection.uid) {
          selection.index = sortedBlocks[selection.trackId].findIndex(
            (b: BlockDTO): boolean => {
              return b.rect.uid == selection.uid;
            },
          );
        }
      });
    });
    state.blocks = sortedBlocks;
  },
  [TimelineMutations.DELETE_SELECTED_BLOCKS](state: State): void {
    state.selectedBlocks.sort(
      (a: BlockSelection, b: BlockSelection): number => {
        if (a.trackId !== b.trackId) {
          return a.trackId - b.trackId;
        }
        return b.index - a.index;
      },
    );

    state.selectedBlocks.forEach((blockSelection: BlockSelection) => {
      const block = state.blocks[blockSelection.trackId][blockSelection.index];
      getDynamicContainer().removeChild(block.container);
      block.container.children.forEach((child: ContainerChild): void => {
        child.removeAllListeners();
      });
      block.container.removeAllListeners();
      block.container.destroy({ children: true });

      state.blocks[blockSelection.trackId].splice(blockSelection.index, 1);
      state.sorted[blockSelection.trackId] = false;
    });
    state.selectedBlocks = [];
  },
  [TimelineMutations.DELETE_BLOCKS_OF_TRACK](
    state: State,
    trackId: number,
  ): void {
    if (state.blocks[trackId] == undefined) return;
    state.blocks[trackId].forEach((block: BlockDTO): void => {
      getDynamicContainer().removeChild(block.container);
      block.container.children.forEach((child: ContainerChild): void => {
        child.removeAllListeners();
      });
      block.container.removeAllListeners();
      block.container.destroy({ children: true });
    });

    delete state.blocks[trackId];

    // remove from selection
    for (let i: number = state.selectedBlocks.length - 1; i >= 0; i--) {
      if (state.selectedBlocks[i].trackId == trackId) {
        state.selectedBlocks.splice(i, 1);
      }
    }
  },
  [TimelineMutations.SELECT_BLOCK](state: State, block: BlockSelection): void {
    state.selectedBlocks.push(block);
  },
  [TimelineMutations.UNSELECT_BLOCK](
    state: State,
    selectionIndex: number,
  ): void {
    state.selectedBlocks.splice(selectionIndex, 1);
  },
  [TimelineMutations.CLEAR_SELECTION](state: State): void {
    state.selectedBlocks = [];
  },
  [TimelineMutations.SET_INITIAL_VIRTUAL_VIEWPORT_WIDTH](
    state: State,
    newWidth: number,
  ): void {
    state.initialVirtualViewportWidth = newWidth;
  },
  [TimelineMutations.SET_CURRENT_VIRTUAL_VIEWPORT_WIDTH](
    state: State,
    newWidth: number,
  ): void {
    state.currentVirtualViewportWidth = newWidth;
  },
  [TimelineMutations.SET_INTERACTION_STATE](
    state: State,
    newState: boolean,
  ): void {
    state.isInteracting = newState;
  },
  [TimelineMutations.CHANGE_BLOCK_TRACK](
    state: State,
    {
      sourceTrack,
      targetTrack,
      blockIndex,
    }: { sourceTrack: number; targetTrack: number; blockIndex: number },
  ): void {
    if (targetTrack == sourceTrack) {
      return;
    }

    const prevTrackLength: number = state.blocks[sourceTrack].length - 1;
    const [block] = state.blocks[sourceTrack].splice(blockIndex, 1);
    if (!block) {
      console.error("Block not found: ", sourceTrack, " | ", blockIndex);
      return;
    }

    // fix faulty indices if removed block was not last of track
    if (prevTrackLength != blockIndex) {
      const faultySelection = state.selectedBlocks.filter(
        (block: BlockSelection) => {
          return block.trackId == sourceTrack && block.index > blockIndex;
        },
      );
      faultySelection.forEach((block: BlockSelection): void => {
        block.index -= 1;
      });
    }

    block.initY = block.rect.y;

    state.blocks[targetTrack].push(block);
    block.trackId = targetTrack;
    state.sorted[sourceTrack] = false;
    state.sorted[targetTrack] = false;

    // update selectionData
    const selectionIndex: number = state.selectedBlocks.findIndex(
      (selection: BlockSelection): boolean => {
        return selection.uid == block.rect.uid;
      },
    );
    state.selectedBlocks[selectionIndex].trackId = targetTrack;
  },
  [TimelineMutations.CALCULATE_LAST_BLOCK_POSITION](state: State): void {
    const sortedTacton: Record<number, BlockDTO[]> = {};
    Object.keys(state.blocks).forEach(
      (channel: string, trackId: number): void => {
        if (state.sorted[trackId]) {
          sortedTacton[trackId] = state.blocks[trackId];
        } else {
          sortedTacton[trackId] = [...state.blocks[trackId]].sort(
            (a: BlockDTO, b: BlockDTO): number => {
              const rectA: Graphics = a.rect;
              const rectB: Graphics = b.rect;
              if (rectA.x === rectB.x) {
                return rectB.width - rectA.width;
              }
              return rectA.x - b.rect.x;
            },
          );
        }
      },
    );

    let maxPosition: number = 0;

    Object.values(sortedTacton).forEach((channelData: BlockDTO[]): void => {
      if (channelData.length > 0) {
        const lastBlock: BlockDTO = channelData[channelData.length - 1];
        const lastPosition: number = lastBlock.rect.x + lastBlock.rect.width;

        if (lastPosition > maxPosition) {
          maxPosition = lastPosition;
        }
      }
    });

    state.lastBlockPositionX = maxPosition;
  },
  [TimelineMutations.TOGGLE_SHIFT_VALUE](state: State): void {
    state.isPressingShift = !state.isPressingShift;
  },
  [TimelineMutations.UPDATE_CURRENT_CURSOR_POSITION](
    state: State,
    newPosition: { x: number; y: number },
  ): void {
    state.currentCursorPosition = newPosition;
  },
  [TimelineMutations.UNGROUP_SELECTED_BLOCKS](
    state: State,
    groupId: number,
  ): void {
    state.groups.delete(groupId);
  },
  [TimelineMutations.ADD_GROUP](
    state: State,
    groupData: { groupId: number; selection: BlockSelection[] },
  ) {
    state.groups.set(groupData.groupId, groupData.selection);
  },
  [TimelineMutations.TOGGLE_SNAPPING_STATE](state: State): void {
    state.isSnappingActive = !state.isSnappingActive;
  },
  [TimelineMutations.TOGGLE_EDIT_STATE](
    state: State,
    isEditable?: boolean,
  ): void {
    if (isEditable != undefined) {
      state.isEditable = isEditable;
    } else {
      state.isEditable = !state.isEditable;
    }
  },
  [TimelineMutations.SET_CANVAS_TOP_OFFSET](
    state: State,
    topOffset: number,
  ): void {
    state.canvasTopOffset = topOffset;
  },
  [TimelineMutations.SET_WRAPPER_X_OFFSET](
    state: State,
    xOffset: number,
  ): void {
    state.wrapperXOffset = xOffset;
  },
  [TimelineMutations.SET_WRAPPER_Y_OFFSET](
    state: State,
    yOffset: number,
  ): void {
    state.wrapperYOffset = yOffset;
  },
  [TimelineMutations.SET_CANVAS_WIDTH](state: State, width: number): void {
    state.canvasWidth = width;
  },
  [TimelineMutations.SET_SNACKBAR_TEXT](state: State, text: string): void {
    if (state.snackbarText.text == text) {
      state.snackbarText.key++;
    } else {
      state.snackbarText.text = text;
      state.snackbarText.key = 0;
    }
  },
  [TimelineMutations.TOGGLE_RELATIVE_SNAPPING](state: State): void {
    state.isSnappingRelativeActive = !state.isSnappingRelativeActive;
  },
};
