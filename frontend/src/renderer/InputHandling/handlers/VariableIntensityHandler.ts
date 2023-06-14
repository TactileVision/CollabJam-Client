import { TactileAction } from "@/types/InputBindings";
import { InputHandler, Instruction } from "../InputHandlerManager";

interface SetIntensityAction extends TactileAction {
  type: "set_intensity_action";
  name: string;
}

const isSetIntensityAction = (action: TactileAction): action is SetIntensityAction => {
  return action.type === "set_intensity_action";
}

interface TriggerActuatorWithVariableIntensityAction extends TactileAction {
  type: "trigger_actuator_with_variable_intensity_action";
  channel: number;
  name: string;
}

const isTriggerAction = (action: TactileAction): action is TriggerActuatorWithVariableIntensityAction => {
  return action.type === "trigger_actuator_with_variable_intensity_action";
}

const VariableIntensityHandler = (): InputHandler => {
  const intensities: { [key: string]: number } = {};
  const lastIntensity: Map<string, Map<number, number>> = new Map<string, Map<number, number>>();
  const sendThreshold = 1.0 / 24

  const handler: InputHandler = {
    onInput: ({ binding, value, globalIntensity }) => {
      const instructions: Instruction[] = [];

      binding.actions.filter(isSetIntensityAction).forEach(action => {
        intensities[action.name] = Math.abs(value);
      });

      const triggerActions = binding.actions.filter(isTriggerAction);
      if (triggerActions.length > 0) {
        const groupedActions: { [key: string]: number[] } = {}
        triggerActions.forEach(action => {
          if (groupedActions[action.name] === undefined) {
            groupedActions[action.name] = [action.channel];
          } else {
            groupedActions[action.name].push(action.channel);
          }
        })

        Object.entries(groupedActions).forEach(([name, channels]) => {
          const li = lastIntensity.get(name) || new Map<number, number>()

          //only update channels that have differing intensities in comparison to last iteration
          const changedVibratingChannels: number[] = []
          const changedDeactivatedChannels: number[] = []
          channels.forEach(c => {
            let int = li.get(c)
            if (int == undefined) {
              int = binding.activeTriggers == 0 ? 0 : intensities[name];
              li.set(c, int);
            }
            if (binding.activeTriggers == 0 && li.get(c) != 0) {
              changedDeactivatedChannels.push(c)
              li.set(c, 0)
            } else if (((int > intensities[name] + sendThreshold) || (int < intensities[name] - sendThreshold))) {
              changedVibratingChannels.push(c)
              li.set(c, intensities[name])
            }
            lastIntensity.set(name, li)
          })

          if (changedVibratingChannels.length > 0) {
            instructions.push({
              channels: changedVibratingChannels,
              intensity: (intensities[name] || 0) * globalIntensity,
            })
          }
          if (changedDeactivatedChannels.length > 0) {
            instructions.push({
              channels: changedDeactivatedChannels,
              intensity: 0,
            })
          }
        })
      }

      return instructions;
    }
  }

  return Object.freeze(handler);
}

export default VariableIntensityHandler;