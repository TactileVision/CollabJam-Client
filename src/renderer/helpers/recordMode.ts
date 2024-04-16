import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";
import { sendSocketMessage } from "@/main/WebSocketManager";
import { UpdateRoomMode, WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import { Store } from "@/renderer/store/store";

// export const changeRecordMode = function (roomId: string, currentMode: InteractionMode, change: InteractionModeChange) {
export const changeRecordMode = function (
  store: Store,
  change: InteractionModeChange,
) {
  console.log("CHANGING RECORD MODE");

  const currentMode = store.state.roomSettings.mode;
  if (change == InteractionModeChange.toggleRecording) {
    if (currentMode == InteractionMode.Recording) {
      sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
        roomId: store.state.roomSettings.id,
        newMode: InteractionMode.Jamming,
      } as UpdateRoomMode);
    } else if (currentMode == InteractionMode.Jamming) {
      sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
        roomId: store.state.roomSettings.id,
        newMode: InteractionMode.Recording,
      } as UpdateRoomMode);
    }
  } else {
    if (
      currentMode == InteractionMode.Jamming &&
      store.state.tactonPlayback.currentTacton != null
    ) {
      sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
        roomId: store.state.roomSettings.id,
        newMode: InteractionMode.Playback,
        tactonId: store.state.tactonPlayback.currentTacton.uuid,
      } as UpdateRoomMode);
      // playbackRecordedTacton(store.state.tactonPlayback.currentTacton.instructions)
    } else if (currentMode == InteractionMode.Playback) {
      sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
        roomId: store.state.roomSettings.id,
        newMode: InteractionMode.Jamming,
        tactonId: undefined,
      } as UpdateRoomMode);
    }
  }
};
