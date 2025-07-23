import { BlockManager } from "@/renderer/helpers/timeline/blockManager";
import { BlockDTO, BlockSelection } from "@/renderer/helpers/timeline/types";

export type State = {
  blockManager: BlockManager | null;
  zoomLevel: number;
  initialZoomLevel: number;
  horizontalViewportOffset: number;
  verticalViewportOffset: number;
  gridLines: number[];
  trackCount: number;
  scrollableHeight: number;
  visibleHeight: number;
  sorted: Record<number, boolean>;
  blocks: Record<number, BlockDTO[]>;
  groups: Map<number, BlockSelection[]>;
  lastBlockPositionX: number;
  selectedBlocks: BlockSelection[];
  initialVirtualViewportWidth: number;
  currentVirtualViewportWidth: number;
  isInteracting: boolean;
  isPressingShift: boolean;
  currentCursorPosition: { x: number; y: number };
  isSnappingActive: boolean;
  isEditable: boolean;
  canvasTopOffset: number;
  wrapperXOffset: number;
  wrapperYOffset: number;
  canvasWidth: number;
  snackbarText: { text: string; key: number };
};
export const state: State = {
  blockManager: null,
  zoomLevel: 1,
  initialZoomLevel: 1,
  horizontalViewportOffset: 0,
  verticalViewportOffset: 0,
  gridLines: [],
  trackCount: 0,
  scrollableHeight: 0,
  visibleHeight: 0,
  sorted: {},
  blocks: {},
  groups: new Map(),
  lastBlockPositionX: 0,
  selectedBlocks: [],
  initialVirtualViewportWidth: 0,
  currentVirtualViewportWidth: 0,
  isInteracting: false,
  isPressingShift: false,
  currentCursorPosition: { x: 0, y: 0 },
  isSnappingActive: false,
  isEditable: false,
  canvasTopOffset: 0,
  wrapperXOffset: 0,
  wrapperYOffset: 0,
  canvasWidth: 0,
  snackbarText: { text: "", key: 0 },
};
