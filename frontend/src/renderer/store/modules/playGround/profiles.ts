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

const profiles: StateProfile[] = [
  {
    uid: uuidv4(),
    name: "Mapping A",
    imagePath: mappingAImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
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
          { type: UserInputType.GamepadButton, index: 13} as GamepadButtonInput,
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
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput, // A
        ],
        activeTriggers: 0,
        uid: "UNIQUE_1",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator",
            channel: 0,
            intensity: 1.0,
          } as TactileAction,
        ],
      },
    ],
  },
  {
    uid: uuidv4(),
    name: "Mapping C",
    imagePath: mappingCImage,
    deviceType: DeviceType.StandardGamepad,
    bindings: [
      {
        inputs: [
          { type: UserInputType.GamepadButton, index: 0 } as GamepadButtonInput,
        ],
        activeTriggers: 0,
        uid: "UNIQUE_2",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator",
            channel: 1,
            intensity: 1.0,
          } as TactileAction,
        ],
      },
    ],
  },
  {
    uid: uuidv4(),
    name: "Keyboard",
    imagePath: keyboardImage,
    deviceType: DeviceType.Keyboard,
    bindings: [
      {
        inputs: [{ type: UserInputType.Key, key: "A" } as KeyInput],
        activeTriggers: 0,
        uid: "UNIQUE_3",
        position: { x: 5, y: 5, w: 1, h: 1 },
        name: "dynamic",
        color: "#ff0000",
        actions: [
          {
            type: "trigger_actuator",
            channel: 3,
            intensity: 1.0,
          } as TactileAction,
        ],
      },
    ],
  },
];

export default profiles;
