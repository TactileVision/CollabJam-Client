import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";
import { WebSocketAPI } from "@/main/WebSocketManager";
import { UpdateRoomMode } from "@sharedTypes/websocketTypes";
import { Store } from "@/renderer/store/store";

// export const changeRecordMode = function (roomId: string, currentMode: InteractionMode, change: InteractionModeChange) {
export const changeRecordMode = function (
  store: Store,
  change: InteractionModeChange,
) {
  console.log("CHANGING RECORD MODE");

  const currentMode = store.state.roomSettings.mode;
  const payload: UpdateRoomMode = {
    roomId: store.state.roomSettings.id || "",
    newMode: InteractionMode.Jamming,
    tactonId: undefined,
  };

  if (change == InteractionModeChange.toggleRecording) {
    if (currentMode == InteractionMode.Recording) {
      payload.newMode = InteractionMode.Jamming;
    } else if (currentMode == InteractionMode.Jamming) {
      payload.newMode = InteractionMode.Recording;
    }
  } else {
    //InteractionModeChange.togglePlayback
    if (
      currentMode == InteractionMode.Jamming &&
      store.state.tactonPlayback.currentTacton != null
    ) {
      payload.newMode = InteractionMode.Playback;
      payload.tactonId = store.state.tactonPlayback.currentTacton.uuid;
    } else if (currentMode == InteractionMode.Playback) {
      payload.newMode = InteractionMode.Jamming;
    }
  }
  WebSocketAPI.updateRoomMode(payload);
};
