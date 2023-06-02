import { TactileAction } from "@/types/InputBindings";
import { InputHandler, Instruction } from "../InputHandlerManager";

interface ActuatorConfig {
  channels: number[];
  minValue: number;
  maxValue: number;
}

interface DynamicActuatorAction extends TactileAction {
  type: "dynamic_actuator_action",
  actuators: ActuatorConfig[]
}

const isDynamicActuatorAction = (action: TactileAction): action is DynamicActuatorAction => {
  return action.type == "dynamic_actuator_action";
}

const DynamicActuatorHandler = (): InputHandler => {
  const activeChannels = new Set<number>();
  return {
    onInput: ({ binding, value, globalIntensity }) => {
      const instructions: Instruction[] = [];

      binding.actions.filter(isDynamicActuatorAction).forEach(action => {
        const active = action.actuators.filter(config => config.minValue < value && config.maxValue >= value).flatMap(config => config.channels);
        const inactive = [...activeChannels].filter(channel => !active.includes(channel));

        const newActive = active.filter(channel => !activeChannels.has(channel));
        if(newActive.length > 0) {
          newActive.forEach(channel => activeChannels.add(channel));
          instructions.push({ channels: newActive, intensity: globalIntensity });
        }

        if(inactive.length > 0) {
          inactive.forEach(channel => activeChannels.delete(channel));
          instructions.push({ channels: inactive, intensity: 0 })
        }
      })

      return instructions;
    }
  }
}

export default DynamicActuatorHandler;