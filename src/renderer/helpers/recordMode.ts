import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";
import { WebSocketAPI } from "@/main/WebSocketManager";
import { UpdateRoomMode } from "@sharedTypes/websocketTypes";
import { Store } from "@/renderer/store/store";
import { TactileTask } from "@/shared/types/tactonTypes";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { TactonMutations } from "../store/modules/collaboration/tactonSettings/tactonSettings";
import { TactonPlaybackActionTypes } from "../store/modules/collaboration/tactonPlayback/tactonPlayback";
import { RoomMutations } from "../store/modules/collaboration/roomSettings/roomSettings";

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
  } else if (change == InteractionModeChange.toggleOverdubbing) {
    if (currentMode == InteractionMode.Overdubbing) {
      payload.newMode = InteractionMode.Jamming;
    } else if (
      currentMode == InteractionMode.Jamming &&
      store.state.tactonPlayback.currentTacton != null
    ) {
      payload.newMode = InteractionMode.Overdubbing;
      payload.tactonId = store.state.tactonPlayback.currentTacton.uuid;
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
  console.log("REQUESTING CHANGE IN INTERACTION MODE");
  console.log(payload);
  WebSocketAPI.updateRoomMode(payload);
};

export const updateInteractionMode = (store: Store, res: UpdateRoomMode) => {
  switch (res.newMode) {
    case InteractionMode.Jamming:
      console.log("Jamming");
      if (
        store.state.roomSettings.mode == InteractionMode.Playback ||
        store.state.roomSettings.mode == InteractionMode.Overdubbing
      ) {
        // Set all outputs to 0
        // store.state.generalSettings.deviceList.forEach((device) => {
        const tt: TactileTask = {
          channels: [...Array(16).keys()],
          intensity: 0,
        };
        window.api.send(IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers, {
          taskList: [tt],
        });
        // });
      }
      store.commit(TactonMutations.TRACK_STATE_CHANGES, false);
      break;
    case InteractionMode.Recording:
      console.log("Recording");
      store.commit(TactonMutations.TRACK_STATE_CHANGES, true);
      break;
    case InteractionMode.Overdubbing:
      console.log("Overdubbing");
      store.commit(TactonMutations.TRACK_STATE_CHANGES, true);
      if (res.tactonId != undefined) {
        store.dispatch(TactonPlaybackActionTypes.selectTacton, res.tactonId);
      }
      break;

    case InteractionMode.Playback:
      console.log("Playback");
      if (res.tactonId != undefined) {
        store.dispatch(TactonPlaybackActionTypes.selectTacton, res.tactonId);
      }
      store.commit(TactonMutations.TRACK_STATE_CHANGES, false);
      break;

    default:
      break;
  }
  store.commit(RoomMutations.UPDATE_RECORD_MODE, res.newMode);
};
