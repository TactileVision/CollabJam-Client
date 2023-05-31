import { sendSocketMessage } from "@/renderer/CommunicationManager/WebSocketManager";
import { WS_MSG_TYPE } from "@/renderer/CommunicationManager/WebSocketManager/ws_types";
import { InstructionSetParameter, InstructionWait, TactonInstruction, isInstructionWait, isInstructionSetParameter } from "@/renderer/store/modules/tactonPlayback/tactonPlayback";
import { store } from "@/renderer/store/store";

//TODO Define a type that will allow to differentiate between wait and execute instructions
export const playbackRecordedTacton = (tacton: TactonInstruction[]) => {
	executeInstruction(tacton, 0)


}

export const executeInstruction = (tacton: TactonInstruction[], index: number) => {

	if (index == tacton.length) {
		console.log("[TactonPlayer] Done")
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
		const c: number[] = []
		c.push(x.setParameter.channelId)

		sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
			roomId: store.state.roomSettings.id,
			instructions: [{ keyId: "REC", channels: c, intensity: x.setParameter.intensity }]
		});
		// sendSocketMessage(WS_MSG_TYPE.LOG_OUT, {})
		// console.log( store.state.roomSettings.id)

		executeInstruction(tacton, index + 1)
	}
}