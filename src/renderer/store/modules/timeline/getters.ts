import { GetterTree } from "vuex";
import { RootState } from "@/renderer/store/store";
import { BlockManager } from "@/renderer/helpers/timeline/blockManager";
import { BlockDTO, BlockSelection } from "@/renderer/helpers/timeline/types";
import { State } from "@/renderer/store/modules/timeline/state";

export type Getters = {
  blockManager(state: State): BlockManager | null;
  zoomLevel(state: State): number;
  initialZoomLevel(state: State): number;
  horizontalViewportOffset(state: State): number;
  verticalViewportOffset(state: State): number;
  gridLines(state: State): number[];
  trackCount(state: State): number;
  scrollableHeight(state: State): number;
  blocks(state: State): Record<number, BlockDTO[]>;
  initialVirtualViewportWidth(state: State): number;
  currentVirtualViewportWidth(state: State): number;
  sorted(state: State): Record<number, boolean>;
  selectedBlocks(state: State): BlockSelection[];
  isInteracting(state: State): boolean;
  isPressingShift(state: State): boolean;
  currentCursorPosition(state: State): { x: number; y: number };
  isSnappingActive(state: State): boolean;
  isEditable(state: State): boolean;
  canvasTopOffset(state: State): number;
  wrapperXOffset(state: State): number;
  wrapperYOffset(state: State): number;
};
export const getters: GetterTree<State, RootState> & Getters = {
  blockManager: (state: State): BlockManager | null => state.blockManager,
  zoomLevel: (state: State): number => state.zoomLevel,
  initialZoomLevel: (state: State): number => state.initialZoomLevel,
  horizontalViewportOffset: (state: State): number =>
    state.horizontalViewportOffset,
  verticalViewportOffset: (state: State): number =>
    state.verticalViewportOffset,
  gridLines: (state: State): number[] => state.gridLines,
  trackCount: (state: State): number => state.trackCount,
  scrollableHeight: (state: State): number => state.scrollableHeight,
  blocks: (state: State): Record<number, BlockDTO[]> => state.blocks,
  initialVirtualViewportWidth: (state: State): number =>
    state.initialVirtualViewportWidth,
  currentVirtualViewportWidth: (state: State): number =>
    state.currentVirtualViewportWidth,
  sorted: (state: State): Record<number, boolean> => state.sorted,
  selectedBlocks: (state: State): BlockSelection[] => state.selectedBlocks,
  isInteracting: (state: State): boolean => state.isInteracting,
  isPressingShift: (state: State): boolean => state.isPressingShift,
  currentCursorPosition: (state: State): { x: number; y: number } =>
    state.currentCursorPosition,
  isSnappingActive: (state: State): boolean => state.isSnappingActive,
  isEditable: (state: State): boolean => state.isEditable,
  canvasTopOffset: (state: State): number => state.canvasTopOffset,
  wrapperXOffset: (state: State): number => state.wrapperXOffset,
  wrapperYOffset: (state: State): number => state.wrapperYOffset,
};
