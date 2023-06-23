import { v4 as uuidv4 } from "uuid";
import keyboardImage from "@/renderer/assets/keyboard.svg";
import mappingAImage from "@/renderer/assets/mappingA.svg";
import mappingBImage from "@/renderer/assets/mappingB.svg";
import mappingCImage from "@/renderer/assets/mappingC.svg";
import { DeviceType, InputProfile, TactileAction } from "@/types/InputBindings";
import {
  GamepadAxisInput,
  GamepadButtonInput,
  KeyInput,
  UserInputType,
} from "@/types/InputDetection";
import { StateProfile } from "./playGround";
import { InteractionMode, InteractionModeChange } from "@sharedTypes/roomTypes";

const mappingBTriggerActuators = [
  {
    channels: [0],
    intensity: "gamepad_b_int",
    minValue: 0,
    maxValue: 0.25
  },
  {
    channels: [1],
    intensity: "gamepad_b_int",
    minValue: 0.25,
    maxValue: 0.5
  },
  {
    channels: [2],
    intensity: "gamepad_b_int",
    minValue: 0.5,
    maxValue: 0.75
  },
  {
    channels: [3],
    intensity: "gamepad_b_int",
    minValue: 0.75,
    maxValue: 1.0
  },
]

// const mappingBStickActuators = [
//   {
//     channels: [0],
//     intensity: "gamepad_b_int",
//     minValue: -1.1,
//     maxValue: -0.5
//   },
//   {
//     channels: [1],
//     intensity: "gamepad_b_int",
//     minValue: -0.5,
//     maxValue: -0.01
//   },
//   {
//     channels: [2],
//     intensity: "gamepad_b_int",
//     minValue: 0.01,
//     maxValue: 0.5
//   },
//   {
//     channels: [3],
//     intensity: "gamepad_b_int",
//     minValue: 0.5,
//     maxValue: 1.0
//   },
// ]


const mappingBStickActuatorsDirectional = [
  {
    channels: [3],
    intensity: "gamepad_b_int",
    minValue: -1.1,
    maxValue: -0.75
  },
  {
    channels: [2],
    intensity: "gamepad_b_int",
    minValue: -0.75,
    maxValue: -0.5
  },
  {
    channels: [1],
    intensity: "gamepad_b_int",
    minValue: -0.5,
    maxValue: -0.25
  },
  {
    channels: [0],
    intensity: "gamepad_b_int",
    minValue: -0.25,
    maxValue: -0.01
  },
  {
    channels: [3],
    intensity: "gamepad_b_int",
    minValue: 0.01,
    maxValue: 0.25
  },
  {
    channels: [2],
    intensity: "gamepad_b_int",
    minValue: 0.25,
    maxValue: 0.5
  },
  {
    channels: [1],
    intensity: "gamepad_b_int",
    minValue: 0.5,
    maxValue: 0.75
  },
  {
    channels: [0],
    intensity: "gamepad_b_int",
    minValue: 0.75,
    maxValue: 1
  },
]

const profiles: StateProfile[] = [
  {
    uid: uuidv4(),
    name: "Mapping A",
    imagePath: mappingAImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
      //MARK: Function Buttons
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 8 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_Select",
        actions: [
          {
            type: "change_interaction_mode",
            change: InteractionModeChange.toggleRecording
          } as TactileAction,
        ],
        //grid properties
        name: "Change interaction Mode",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 9 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_Start",
        actions: [
          {
            type: "change_interaction_mode",
            change: InteractionModeChange.togglePlayback
          } as TactileAction,
        ],
        //grid properties
        name: "Change interaction Mode",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: Face buttons
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_A",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 3 with face button A",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 1 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_B",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 2 with face button B",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 2 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_X",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1 with face button X",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 3 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_Y",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1 with face button Y",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: DPAD
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 12 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_DUp",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1 with D-Pad Up",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 13,
          } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_DDown",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 3 with D-Pad Down",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 14 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_DLeft",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 2 with D-Pad Left",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 15 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_A_DRight",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 4 with with D-Pad Right",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },


    ],
  },
  {
    uid: uuidv4(),
    name: "Mapping B",
    imagePath: mappingBImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
      //MARK: Function Buttons
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 8 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_Select",
        actions: [
          {
            type: "change_interaction_mode",
            change: InteractionModeChange.toggleRecording
          } as TactileAction,
        ],
        //grid properties
        name: "Change interaction Mode",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 9 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_Start",
        actions: [
          {
            type: "change_interaction_mode",
            change: InteractionModeChange.togglePlayback
          } as TactileAction,
        ],
        //grid properties
        name: "Change interaction Mode",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: Face buttons
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_A",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 3 with face button A",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 1 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_B",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 2 with face button B",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 2 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_X",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1 with face button X",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 3 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_Y",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1 with face button Y",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: DPAD
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 12 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_DUp",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1 with D-Pad Up",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 13,
          } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_DDown",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 3 with D-Pad Down",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 14 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_DLeft",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 2 with D-Pad Left",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 15 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_DRight",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 4 with with D-Pad Right",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: Bumpers
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 4,
          } as GamepadButtonInput
        ],
        activeTriggers: 0,
        uid: "Mapping_B_LB",
        actions: [
          {
            type: "lock_intensity_action",
            name: "gamepad_b_int",
          } as TactileAction
        ],
        //grid properties
        position: { x: 3, y: 5, w: 1, h: 1 },
        name: "Lock Intensity",
        color: "#00ffff",
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 5 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_B_RB",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger all actuators",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: Triggers
      {
        inputs: [{ type: UserInputType.GamepadButton, index: 6 } as GamepadButtonInput],
        activeTriggers: 0,
        uid: "Mapping_B_LT",
        actions: [{ type: "set_intensity_action", name: "gamepad_b_int" } as TactileAction],
        //grid properties
        position: { x: 1, y: 1, w: 1, h: 1 },
        name: "Set Intensity for face trigger actuator",
        color: "#00ffff",
      },
      {
        inputs: [{ type: UserInputType.GamepadButton, index: 7 } as GamepadButtonInput],
        activeTriggers: 0,
        uid: "Mapping_B_RT",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic_actuator",
            actuators: mappingBTriggerActuators
          } as TactileAction
        ],
        //grid properties
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "Actuator 1-5",
        color: "#7CFC00",

      },

      //MARK: Sticks
      {
        inputs: [{ type: UserInputType.GamepadAxis, index: 0 } as GamepadAxisInput],
        activeTriggers: 0,
        uid: "Mapping_B_LS_X",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic_actuator_stick",
            actuators: mappingBStickActuatorsDirectional
          } as TactileAction
        ],
        //grid properties
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "Actuator 1-5",
        color: "#7CFC00",

      },
      {
        inputs: [{ type: UserInputType.GamepadAxis, index: 3 } as GamepadAxisInput],
        activeTriggers: 0,
        uid: "Mapping_B_RS_Y",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic_actuator_stick",
            actuators: mappingBStickActuatorsDirectional
          } as TactileAction
        ],
        //grid properties
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "Actuator 1-5",
        color: "#7CFC00",

      }
    ],
  },
  {
    uid: uuidv4(),
    name: "Mapping C",
    imagePath: mappingCImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [

      //MARK: Function Buttons
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 8 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_Select",
        actions: [
          {
            type: "change_interaction_mode",
            change: InteractionModeChange.toggleRecording
          } as TactileAction,
        ],
        //grid properties
        name: "Change interaction Mode",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 9 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_Start",
        actions: [
          {
            type: "change_interaction_mode",
            change: InteractionModeChange.togglePlayback
          } as TactileAction,
        ],
        //grid properties
        name: "Change interaction Mode",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: Face buttons
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_A",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 3,4 with face button A",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 1 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_B",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 2,3 with face button B",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 2 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_X",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1,4 with face button X",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 3 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_Y",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1,2 with face button Y",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: DPAD
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 12 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_DUp",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 1,2 with D-Pad Up",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 13,
          } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_DDown",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 3,4 with D-Pad Down",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 14 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_DLeft",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 2,3 with D-Pad Left",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 15 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_DRight",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger Actuator 4,1 with with D-Pad Right",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },
      //MARK: Bumpers
      {
        inputs: [
          {
            type: UserInputType.GamepadButton,
            index: 4,
          } as GamepadButtonInput
        ],
        activeTriggers: 0,
        uid: "Mapping_C_LB",
        actions: [
          {
            type: "lock_intensity_action",
            name: "gamepad_b_int",
          } as TactileAction
        ],
        //grid properties
        position: { x: 3, y: 5, w: 1, h: 1 },
        name: "Lock Intensity",
        color: "#00ffff",
      },
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 5 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "Mapping_C_RB",
        actions: [
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 0,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 1,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 2,
            name: "gamepad_b_int",
          } as TactileAction,
          {
            type: "trigger_actuator_with_variable_intensity_action",
            channel: 3,
            name: "gamepad_b_int",
          } as TactileAction,
        ],
        //grid properties
        name: "Trigger all actuators",
        color: "#ff0000",
        position: { x: 5, y: 5, w: 1, h: 1 },
      },

      //MARK: Triggers
      {
        inputs: [{ type: UserInputType.GamepadButton, index: 6 } as GamepadButtonInput],
        activeTriggers: 0,
        uid: "Mapping_C_LT",
        actions: [{ type: "set_intensity_action", name: "gamepad_b_int" } as TactileAction],
        //grid properties
        position: { x: 1, y: 1, w: 1, h: 1 },
        name: "Set Intensity for face trigger actuator",
        color: "#00ffff",
      },
      {
        inputs: [{ type: UserInputType.GamepadButton, index: 7 } as GamepadButtonInput],
        activeTriggers: 0,
        uid: "Mapping_C_RT",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic_actuator",
            actuators: mappingBTriggerActuators
          } as TactileAction
        ],
        //grid properties
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "Actuator 1-4",
        color: "#7CFC00",

      },

      //MARK: Sticks
      {
        inputs: [{ type: UserInputType.GamepadAxis, index: 0 } as GamepadAxisInput],
        activeTriggers: 0,
        uid: "Mapping_C_LS_X",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic_actuator_stick",
            actuators: mappingBStickActuatorsDirectional
          } as TactileAction
        ],
        //grid properties
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "Actuator 1-4",
        color: "#7CFC00",

      },
      {
        inputs: [{ type: UserInputType.GamepadAxis, index: 3 } as GamepadAxisInput],
        activeTriggers: 0,
        uid: "Mapping_C_RS_Y",
        actions: [
          {
            type: "dynamic_actuator_action",
            name: "dynamic_actuator_stick",
            actuators: mappingBStickActuatorsDirectional
          } as TactileAction
        ],
        //grid properties
        position: { x: 7, y: 4, w: 1, h: 1 },
        name: "Actuator 1-4",
        color: "#7CFC00",

      }

    ],
  },
  {
    uid: uuidv4(),
    name: "QWERTY Keyboard",
    imagePath: keyboardImage,
    deviceType: DeviceType.Keyboard,
    bindings: [
      //MARK: Row 1
      {
        inputs: [{ type: UserInputType.Key, key: "1" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_1",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1 - 100%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "2" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_2",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "3" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_3",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3 - 100%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "4" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_4",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4 - 100%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "7" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_7",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1,2 - 100%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "8" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_8",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2,3 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "9" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_9",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 1.0,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3,4 - 100%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "0" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_0",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4,1 - 100%",
        color: "#ff0000",
      },
      //MARK: Row 2
      {
        inputs: [{ type: UserInputType.Key, key: "Q" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_Q",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1 - 80%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "W" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_W",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "E" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_E",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3 - 80%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "R" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_R",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4 - 80%",
        color: "#ff0000",
      },

      {
        inputs: [{ type: UserInputType.Key, key: "U" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_U",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1,2 - 80%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "I" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_I",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2,3 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "O" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_P",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3,4 - 80%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "P" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_P",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4,1 - 80%",
        color: "#ff0000",
      },
      //MARK: Row 3
      {
        inputs: [{ type: UserInputType.Key, key: "A" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_A",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1 - 60%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "S" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_S",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "D" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_D",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3 - 60%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "F" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_F",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4 - 60%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "J" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_J",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1,2 - 60%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "K" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_K",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2,3 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "L" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_L",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3,4 - 60%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: ";" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_;",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4,1 - 60%",
        color: "#ff0000",
      },
      //MARK: Row 4
      {
        inputs: [{ type: UserInputType.Key, key: "Z" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_Z",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1 - 40%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "X" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_X",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "C" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_C",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3 - 40%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "V" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_V",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4 - 40%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "M" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_M",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 1,2 - 40%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "," } as KeyInput],
        activeTriggers: 0,
        uid: "KB_,",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 2,3 - 100 %",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "." } as KeyInput],
        activeTriggers: 0,
        uid: "KB_.",
        actions: [
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 3,4 - 40%",
        color: "#ff0000",
      },
      {
        inputs: [{ type: UserInputType.Key, key: "/" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_/",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "Channel 4,1 - 40%",
        color: "#ff0000",
      },
      //100 % Column
      {
        inputs: [{ type: UserInputType.Key, key: "6" } as KeyInput],
        activeTriggers: 0,
        uid: "KB_6",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 1,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "All Channels - 100%",
        color: "#ff0000",
      },
      {
        inputs: [
          {
            type: UserInputType.Key, key: "Y"
          } as KeyInput],
        activeTriggers: 0,
        uid: "KB_Y",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.8,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.8,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "All Channels - 80%",
        color: "#ff0000",
      }, {
        inputs: [
          {
            type: UserInputType.Key, key: "H"
          } as KeyInput],
        activeTriggers: 0,
        uid: "KB_H",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.6,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.6,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "All Channels - 60%",
        color: "#ff0000",
      },
      {
        inputs: [
          {
            type: UserInputType.Key, key: "N"
          } as KeyInput],
        activeTriggers: 0,
        uid: "KB_N",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 2,
            intensity: 0.4,
          } as TactileAction,
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 0.4,
          } as TactileAction,
        ],
        //grid properties
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "All Channels - 40%",
        color: "#ff0000",
      },

    ],
  },
];

export default profiles;
