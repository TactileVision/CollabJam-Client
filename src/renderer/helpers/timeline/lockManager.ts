import { Store, useStore } from "@/renderer/store/store";
import config from "@/renderer/helpers/timeline/config";
import { WebSocketAPI } from "@/main/WebSocketManager";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import { SnackbarTexts } from "@/renderer/helpers/timeline/types";

const store: Store = useStore();
let lockTimer: number | null = null;
export const resetLockTimer = (): void => {
  stopLockTimer();
  lockTimer = window.setTimeout(() => clearLocks(true), config.maxLockTimeMs);
};

export const stopLockTimer = (): void => {
  if (lockTimer !== null) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
};

export const clearLocks = (
  displaySnackbar: boolean = false,
  clearMemberEditing: boolean = true,
): void => {
  stopLockTimer();
  WebSocketAPI.requestEditingForUuids(
    store.state.roomSettings.id || "",
    store.state.roomSettings.user.id,
    [],
  );
  store.dispatch(TimelineActionTypes.CLEAR_SELECTION);
  store.state.timeline.blockManager?.renderSelection();

  if (clearMemberEditing) {
    store.state.timeline.blockManager?.clearMemberEditing();
  }

  if (displaySnackbar) {
    store.dispatch(
      TimelineActionTypes.UPDATE_SNACKBAR_TEXT,
      SnackbarTexts.SELECTION_EXPIRED(),
    );
  }
};
