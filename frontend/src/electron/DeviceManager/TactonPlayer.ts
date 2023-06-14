import { sendSocketMessage } from "@/renderer/CommunicationManager/WebSocketManager";
import { WS_MSG_TYPE } from "@/renderer/CommunicationManager/WebSocketManager/ws_types";
import { isInstructionWait, isInstructionSetParameter } from "@/types/TactonTypes";
import { store } from "@/renderer/store/store";
import { InteractionMode } from "@/types/GeneralType";
import { TactonInstruction, InstructionWait, InstructionSetParameter } from "@/types/TactonTypes";
import { useStore } from "@/renderer/store/store";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/tactonPlayback/tactonPlayback";


const updateTimeInterval = 10
// Store current playback time in the client store to move the cursor when playing back and stop playback after 20s
let cursorTimer: NodeJS.Timeout | null = null

//TODO Define a type that will allow to differentiate between wait and execute instructions
export const playbackRecordedTacton = (tacton: TactonInstruction[]) => {
	executeInstruction(tacton, 0)
	cursorTimer = setInterval(() => {
		const s = useStore()
		s.dispatch(TactonPlaybackActionTypes.updateTime, s.state.tactonPlayback.playbackTime + updateTimeInterval)
	}, updateTimeInterval)
}

export const executeInstruction = (tacton: TactonInstruction[], index: number) => {

	if (index == tacton.length) {
		console.log("[TactonPlayer] Done")
		if (cursorTimer != null) {
			clearInterval(cursorTimer as NodeJS.Timeout)
		}
		const s = useStore()
		s.dispatch(TactonPlaybackActionTypes.updateTime, 0)
		sendSocketMessage(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, {
			roomId: store.state.roomSettings.id,
			newMode: InteractionMode.Jamming
		})
		return
	}

	const f = () => {
		executeInstruction(tacton, index + 1)
	}

	if (isInstructionWait(tacton[index])) {
		const x = tacton[index] as InstructionWait
		setTimeout(f, x.wait.miliseconds)
	}
	else
		if (isInstructionSetParameter(tacton[index])) {
			const x = tacton[index] as InstructionSetParameter
			const c: number[] = x.setParameter.channelIds
			// c.push(x.setParameter.channelId)

			sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
				roomId: store.state.roomSettings.id,
				instructions: [{ keyId: "REC", channels: c, intensity: x.setParameter.intensity }]
			});
			// sendSocketMessage(WS_MSG_TYPE.LOG_OUT, {})
			// console.log( store.state.roomSettings.id)

			executeInstruction(tacton, index + 1)
		}
}