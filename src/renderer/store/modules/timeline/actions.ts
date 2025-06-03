import { ActionContext, ActionTree, Commit } from "vuex";
import { RootState } from "@/renderer/store/store";
import { State } from "@/renderer/store/modules/timeline/state";
import {
  TimelineMutations,
  Mutations,
} from "@/renderer/store/modules/timeline/mutations";
import { BlockManager } from "@/renderer/helpers/timeline/blockManager";
import { BlockDTO, BlockSelection } from "@/renderer/helpers/timeline/types";
export enum TimelineActionTypes {
  SET_BLOCK_MANAGER = "setBlockManager",
  UPDATE_ZOOM_LEVEL = "setZoomLevel",
  UPDATE_INITIAL_ZOOM_LEVEL = "setInitialZoomLevel",
  UPDATE_HORIZONTAL_VIEWPORT_OFFSET = "setHorizontalViewportOffset",
  UPDATE_VERTICAL_VIEWPORT_OFFSET = "setVerticalViewportOffset",
  UPDATE_GRID_LINES = "setGridLines",
  SET_TRACK_COUNT = "setTrackCount",
  SET_VISIBLE_HEIGHT = "setVisibleHeight",
  CALCULATE_SCROLLABLE_HEIGHT = "calculateScrollableHeight",
  INIT_TRACKS = "initTracks",
  ADD_BLOCK = "addBlock",
  SORT_TACTONS = "sortTactons",
  DELETE_BLOCKS_OF_TRACK = "deleteBlocksOfTrack",
  DELETE_ALL_BLOCKS = "deleteAllBlocks",
  DELETE_SELECTED_BLOCKS = "deleteSelectedBlocks",
  UPDATE_INITIAL_VIRTUAL_VIEWPORT_WIDTH = "setInitialVirtualViewportWidth",
  UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH = "setCurrentVirtualViewportWidth",
  SET_INTERACTION_STATE = "setInteractionState",
  SELECT_BLOCK = "selectBlock",
  UNSELECT_BLOCK = "unselectBlock",
  CLEAR_SELECTION = "clearSelection",
  CHANGE_BLOCK_TRACK = "changeBlockTrack",
  GET_LAST_BLOCK_POSITION = "calculateLastBlockPosition",
  TOGGLE_SHIFT_VALUE = "toggleShiftValue",
  UPDATE_CURRENT_CURSOR_POSITION = "setCurrentCursorPosition",
  ADD_GROUP = "addGroup",
  TOGGLE_SNAPPING_STATE = "toggleSnappingState",
  TOGGLE_EDIT_STATE = "toggleEditState",
  UPDATE_CANVAS_TOP_OFFSET = "updateCanvasTopOffset",
  UPDATE_WRAPPER_X_OFFSET = "updateWrapperXOffset",
  UPDATE_WRAPPER_Y_OFFSET = "updateWrapperYOffset",
}

type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1],
  ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, "commit">;

export interface Actions {
  [TimelineActionTypes.SET_BLOCK_MANAGER](
    { commit }: AugmentedActionContext,
    payload: BlockManager,
  ): void;
  [TimelineActionTypes.UPDATE_ZOOM_LEVEL](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_VERTICAL_VIEWPORT_OFFSET](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_GRID_LINES](
    { commit }: AugmentedActionContext,
    payload: number[],
  ): void;
  [TimelineActionTypes.SET_TRACK_COUNT](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.SET_VISIBLE_HEIGHT](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.CALCULATE_SCROLLABLE_HEIGHT]({
    commit,
  }: AugmentedActionContext): void;
  [TimelineActionTypes.INIT_TRACKS]({ commit }: AugmentedActionContext): void;
  [TimelineActionTypes.ADD_BLOCK](
    { commit }: AugmentedActionContext,
    payload: { trackId: number; block: BlockDTO },
  ): void;
  [TimelineActionTypes.SORT_TACTONS]({ commit }: AugmentedActionContext): void;
  [TimelineActionTypes.DELETE_BLOCKS_OF_TRACK](
    { commit }: AugmentedActionContext,
    trackId: number,
  ): void;
  [TimelineActionTypes.DELETE_ALL_BLOCKS]({
    state,
    commit,
  }: AugmentedActionContext): void;
  [TimelineActionTypes.DELETE_SELECTED_BLOCKS]({
    commit,
  }: AugmentedActionContext): void;
  [TimelineActionTypes.UPDATE_INITIAL_VIRTUAL_VIEWPORT_WIDTH](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.SET_INTERACTION_STATE](
    { commit }: AugmentedActionContext,
    payload: boolean,
  ): void;
  [TimelineActionTypes.SELECT_BLOCK](
    { commit }: AugmentedActionContext,
    payload: BlockSelection,
  ): void;
  [TimelineActionTypes.UNSELECT_BLOCK](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.CLEAR_SELECTION]({
    commit,
  }: AugmentedActionContext): void;
  [TimelineActionTypes.CHANGE_BLOCK_TRACK](
    { state, commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.GET_LAST_BLOCK_POSITION]({
    state,
    commit,
  }: AugmentedActionContext): number;
  [TimelineActionTypes.TOGGLE_SHIFT_VALUE]({
    commit,
  }: AugmentedActionContext): void;
  [TimelineActionTypes.UPDATE_CURRENT_CURSOR_POSITION](
    { commit }: AugmentedActionContext,
    payload: { x: number; y: number },
  ): void;
  [TimelineActionTypes.ADD_GROUP](
    { commit }: AugmentedActionContext,
    payload: { groupId: number; selection: BlockSelection[] },
  ): void;
  [TimelineActionTypes.TOGGLE_SNAPPING_STATE]({
    commit,
  }: AugmentedActionContext): void;
  [TimelineActionTypes.TOGGLE_EDIT_STATE](
    { commit }: AugmentedActionContext,
    payload: boolean,
  ): void;
  [TimelineActionTypes.UPDATE_CANVAS_TOP_OFFSET](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
  [TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET](
    { commit }: AugmentedActionContext,
    payload: number,
  ): void;
}
export const actions: ActionTree<State, RootState> & Actions = {
  [TimelineActionTypes.SET_BLOCK_MANAGER](
    { commit },
    payload: BlockManager,
  ): void {
    commit(TimelineMutations.SET_BLOCK_MANAGER, payload);
  },
  [TimelineActionTypes.UPDATE_ZOOM_LEVEL]({ commit }, payload: number): void {
    commit(TimelineMutations.SET_ZOOM_LEVEL, payload);
  },
  [TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL](
    { commit }: { commit: Commit },
    newInitialZoomLevel: number,
  ): void {
    commit(TimelineMutations.SET_INITIAL_ZOOM_LEVEL, newInitialZoomLevel);
  },
  [TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET](
    { commit }: { commit: Commit },
    newOffset: number,
  ): void {
    commit(TimelineMutations.SET_HORIZONTAL_VIEWPORT_OFFSET, newOffset);
  },
  [TimelineActionTypes.UPDATE_VERTICAL_VIEWPORT_OFFSET](
    { commit }: { commit: Commit },
    newOffset: number,
  ): void {
    commit(TimelineMutations.SET_VERTICAL_VIEWPORT_OFFSET, newOffset);
  },
  [TimelineActionTypes.UPDATE_GRID_LINES](
    { commit }: { commit: Commit },
    newGridLines: number[],
  ): void {
    commit(TimelineMutations.SET_GRID_LINES, newGridLines);
  },
  [TimelineActionTypes.SET_TRACK_COUNT](
    { commit }: { commit: Commit },
    newTrackCount: number,
  ): void {
    commit(TimelineMutations.SET_TRACK_COUNT, newTrackCount);
  },
  [TimelineActionTypes.SET_VISIBLE_HEIGHT](
    { commit }: { commit: Commit },
    newVisibleHeight: number,
  ): void {
    commit(TimelineMutations.SET_VISIBLE_HEIGHT, newVisibleHeight);
  },
  [TimelineActionTypes.CALCULATE_SCROLLABLE_HEIGHT]({
    commit,
  }: {
    commit: Commit;
  }): void {
    commit(TimelineMutations.CALCULATE_SCROLLABLE_HEIGHT);
  },
  [TimelineActionTypes.INIT_TRACKS]({ commit }: { commit: Commit }): void {
    commit(TimelineMutations.INIT_TRACKS);
  },
  [TimelineActionTypes.ADD_BLOCK](
    { commit }: { commit: Commit },
    { trackId, block }: { trackId: number; block: BlockDTO },
  ): void {
    commit(TimelineMutations.ADD_BLOCK, { trackId, block });
  },
  [TimelineActionTypes.SORT_TACTONS]({ commit }: { commit: Commit }): void {
    commit(TimelineMutations.SORT_TACTONS);
  },
  [TimelineActionTypes.DELETE_BLOCKS_OF_TRACK](
    { commit }: { commit: Commit },
    trackId: number,
  ): void {
    commit(TimelineMutations.DELETE_BLOCKS_OF_TRACK, trackId);
  },
  [TimelineActionTypes.DELETE_ALL_BLOCKS]({
    state,
    commit,
  }: {
    state: State;
    commit: Commit;
  }): void {
    if (state.blocks) {
      Object.keys(state.blocks).forEach(
        (trackIdAsString: string, trackId: number): void => {
          commit(TimelineMutations.DELETE_BLOCKS_OF_TRACK, trackId);
        },
      );
    }
  },
  [TimelineActionTypes.DELETE_SELECTED_BLOCKS]({
    commit,
  }: {
    commit: Commit;
  }): void {
    commit(TimelineMutations.DELETE_SELECTED_BLOCKS);
  },
  [TimelineActionTypes.UPDATE_INITIAL_VIRTUAL_VIEWPORT_WIDTH](
    { commit }: { commit: Commit },
    newWidth: number,
  ): void {
    commit(TimelineMutations.SET_INITIAL_VIRTUAL_VIEWPORT_WIDTH, newWidth);
  },
  [TimelineActionTypes.UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH](
    { commit }: { commit: Commit },
    newWidth: number,
  ): void {
    commit(TimelineMutations.SET_CURRENT_VIRTUAL_VIEWPORT_WIDTH, newWidth);
  },
  [TimelineActionTypes.SET_INTERACTION_STATE](
    { commit }: { commit: Commit },
    newState: boolean,
  ): void {
    commit(TimelineMutations.SET_INTERACTION_STATE, newState);
  },
  [TimelineActionTypes.SELECT_BLOCK](
    { commit }: { commit: Commit },
    selection: BlockSelection,
  ): void {
    commit(TimelineMutations.SELECT_BLOCK, selection);
  },
  [TimelineActionTypes.UNSELECT_BLOCK](
    { commit }: { commit: Commit },
    selectionIndex: number,
  ): void {
    commit(TimelineMutations.UNSELECT_BLOCK, selectionIndex);
  },
  [TimelineActionTypes.CLEAR_SELECTION]({ commit }: { commit: Commit }): void {
    commit(TimelineMutations.CLEAR_SELECTION);
  },
  [TimelineActionTypes.CHANGE_BLOCK_TRACK](
    { state, commit }: { state: State; commit: Commit },
    trackChange: number,
  ): void {
    state.selectedBlocks.forEach((block: BlockSelection): void => {
      const targetTrack = block.trackId + trackChange;
      commit(TimelineMutations.CHANGE_BLOCK_TRACK, {
        sourceTrack: block.trackId,
        targetTrack,
        blockIndex: block.index,
      });
    });
  },
  [TimelineActionTypes.GET_LAST_BLOCK_POSITION]({
    state,
    commit,
  }: {
    state: State;
    commit: Commit;
  }) {
    commit(TimelineMutations.CALCULATE_LAST_BLOCK_POSITION);
    return state.lastBlockPositionX;
  },
  [TimelineActionTypes.TOGGLE_SHIFT_VALUE]({
    commit,
  }: {
    commit: Commit;
  }): void {
    commit(TimelineMutations.TOGGLE_SHIFT_VALUE);
  },
  [TimelineActionTypes.UPDATE_CURRENT_CURSOR_POSITION](
    { commit }: { commit: Commit },
    newPosition: { x: number; y: number },
  ): void {
    commit(TimelineMutations.UPDATE_CURRENT_CURSOR_POSITION, newPosition);
  },
  [TimelineActionTypes.ADD_GROUP](
    { commit }: { commit: Commit },
    groupData: { groupId: number; selection: BlockSelection[] },
  ): void {
    commit(TimelineMutations.ADD_GROUP, groupData);
  },
  [TimelineActionTypes.TOGGLE_SNAPPING_STATE]({
    commit,
  }: {
    commit: Commit;
  }): void {
    commit(TimelineMutations.TOGGLE_SNAPPING_STATE);
  },
  [TimelineActionTypes.TOGGLE_EDIT_STATE](
    { commit }: { commit: Commit },
    isEditable: boolean,
  ): void {
    commit(TimelineMutations.TOGGLE_EDIT_STATE, isEditable);
  },
  [TimelineActionTypes.UPDATE_CANVAS_TOP_OFFSET](
    { commit }: { commit: Commit },
    topOffset: number,
  ): void {
    commit(TimelineMutations.SET_CANVAS_TOP_OFFSET, topOffset);
  },
  [TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET](
    { commit }: { commit: Commit },
    xOffset: number,
  ): void {
    commit(TimelineMutations.SET_WRAPPER_X_OFFSET, xOffset);
  },
  [TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET](
    { commit }: { commit: Commit },
    yOffset: number,
  ): void {
    commit(TimelineMutations.SET_WRAPPER_Y_OFFSET, yOffset);
  },
};
