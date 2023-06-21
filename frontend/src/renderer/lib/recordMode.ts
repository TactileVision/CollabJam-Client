import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";
import { sendSocketMessage } from "../CommunicationManager/WebSocketManager";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import { Store } from "../store/store";
import { playbackRecordedTacton } from "@/electron/DeviceManager/TactonPlayer";

// export const changeRecordMode = function (roomId: string, currentMode: InteractionMode, change: InteractionModeChange) {
export const changeRecordMode = function (store: Store, change: InteractionModeChange) {
	console.log("CHANGING RECORD MODE")

	const currentMode = store.state.roomSettings.mode
	if (change == InteractionModeChange.toggleRecording) {
		if (currentMode == InteractionMode.Recording) {
			sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
				roomId: store.state.roomSettings.id,
				newMode: InteractionMode.Jamming
			});
		} else if (currentMode == InteractionMode.Jamming) {
			sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
				roomId: store.state.roomSettings.id,
				newMode: InteractionMode.Recording
			});
		}
	} else {
		if (currentMode == InteractionMode.Jamming && store.state.tactonPlayback.currentTacton != null) {
			sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
				roomId: store.state.roomSettings.id,
				newMode: InteractionMode.Playback
			});
			playbackRecordedTacton(store.state.tactonPlayback.currentTacton.instructions)
		}
	}
}

