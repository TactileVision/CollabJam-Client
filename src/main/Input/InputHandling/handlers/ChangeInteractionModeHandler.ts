// interface TriggerActuatorAction extends TactileAction {
// 	type: "trigger_actuator";
// 	channel: number;
// 	intensity: number;
//   }

import { TactileAction } from "@/main/Input/InputDetection/InputBindings";
import { InputHandler } from "@/main/Input/InputHandling/InputHandlerManager";
import {
  /* InteractionMode, */ InteractionModeChange,
} from "@sharedTypes/roomTypes";
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
            if (
              store == undefined ||
              store.state.roomSettings.id == undefined
            ) {
              return;
            }
            changeRecordMode(a.change);
          });
        }
      }
      return [];
    },
  };
};

export default ChangeInteractionModeHandler;
