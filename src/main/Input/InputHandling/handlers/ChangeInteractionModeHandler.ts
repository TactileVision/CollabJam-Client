// interface TriggerActuatorAction extends TactileAction {
// 	type: "trigger_actuator";
// 	channel: number;
// 	intensity: number;
//   }

import { TactileAction } from "@sharedTypes/InputDetection/InputBindings";
import { InputHandler } from "@/main/Input/InputHandling/InputHandlerManager";
import {
  /* InteractionMode, */ InteractionModeChange,
} from "@sharedTypes/roomTypes";
// import { sendSocketMessage } from "@/main/WebSocketManager";
// import { useStore } from "vuex";
// import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import { store } from "@/renderer/store/store";
import { changeRecordMode } from "@/renderer/helpers/recordMode";
interface TriggerActuatorAction extends TactileAction {
  type: "change_interaction_mode";
  change: InteractionModeChange;
}

const isChangeInteractionMode = (
  action: TactileAction,
): action is TriggerActuatorAction => {
  return action.type === "change_interaction_mode";
};

const ChangeInteractionModeHandler = (): InputHandler => {
  return {
    // eslint-disable-line no-unused-vars
    onInput({ binding, wasActive }) {
      const actions = binding.actions.filter(isChangeInteractionMode);
      if (binding.activeTriggers > 0) {
        if (!wasActive) {
          actions.forEach((action) => {
            const a = action as TriggerActuatorAction;
            // const s = useStore()
            // console.log(a)
            // console.log(store)
            if (
              store == undefined ||
              store.state.roomSettings.id == undefined
            ) {
              return;
            }
            changeRecordMode(store, a.change);
          });
        }
      }
      return [];
    },
  };
};

export default ChangeInteractionModeHandler;
