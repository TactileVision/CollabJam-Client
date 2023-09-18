// interface TriggerActuatorAction extends TactileAction {
// 	type: "trigger_actuator";
// 	channel: number;
// 	intensity: number;
//   }

import { TactileAction } from "@/core/Input/InputDetection/types/InputBindings";
import { InputHandler } from "../InputHandlerManager";
import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";
import { sendSocketMessage } from "@/core/WebSocketManager";
import { useStore } from "vuex";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import { store } from "@/app/store/store";
import { changeRecordMode } from "@/feature/collabJamming/recordMode";
interface TriggerActuatorAction extends TactileAction {
	type: "change_interaction_mode";
	change: InteractionModeChange
}


const isChangeInteractionMode = (action: TactileAction): action is TriggerActuatorAction => {
	return action.type === "change_interaction_mode";
}

const ChangeInteractionModeHandler = (): InputHandler => {
	return {
		onInput({ binding, value, wasActive, globalIntensity }) {
			const actions = binding.actions.filter(isChangeInteractionMode);
			if (binding.activeTriggers > 0) {
				if (!wasActive) {
					actions.forEach(action => {
						const a = action as TriggerActuatorAction
						// const s = useStore()
						// console.log(a)
						// console.log(store)
						if (store == undefined || store.state.roomSettings.id == undefined) { return }
						changeRecordMode(store, a.change)
					})
				}
			}
			return []
		},
	}
}

export default ChangeInteractionModeHandler