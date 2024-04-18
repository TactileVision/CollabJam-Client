import { WebSocketAPI } from "@/main/WebSocketManager";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { store, useStore } from "@/renderer/store/store";
import { InteractionMode } from "@sharedTypes/roomTypes";
import {
  InstructionSetParameter,
  InstructionWait,
  TactonInstruction,
  isInstructionSetParameter,
  isInstructionWait,
} from "@sharedTypes/tactonTypes";

const updateTimeInterval = 10;
// Store current playback time in the client store to move the cursor when playing back and stop playback after 20s
let cursorTimer: NodeJS.Timeout | null = null;
let instructionTimer: NodeJS.Timeout | null = null;

//TODO Define a type that will allow to differentiate between wait and execute instructions
export const playbackRecordedTacton = (tacton: TactonInstruction[]) => {
  writeAmplitudeBuffer(tacton, 0);
  cursorTimer = setInterval(() => {
    const s = useStore();
    s.dispatch(
      TactonPlaybackActionTypes.updateTime,
      s.state.tactonPlayback.playbackTime + updateTimeInterval,
    );
  }, updateTimeInterval);
};

export function stopPlayback() {
  if (instructionTimer != null) {
    clearTimeout(instructionTimer as NodeJS.Timeout);
    instructionTimer = null;
  }
  if (cursorTimer != null) {
    clearInterval(cursorTimer as NodeJS.Timeout);
    const s = useStore();
    s.dispatch(TactonPlaybackActionTypes.updateTime, 0);
  }
}

export const writeAmplitudeBuffer = (
  tacton: TactonInstruction[],
  index: number,
) => {
  if (index == tacton.length) {
    console.log("[TactonPlayer] Done");
    if (cursorTimer != null) {
      clearInterval(cursorTimer as NodeJS.Timeout);
    }
    instructionTimer = null;
    const s = useStore();
    s.dispatch(TactonPlaybackActionTypes.updateTime, 0);
    WebSocketAPI.updateRoomMode({
      roomId: store.state.roomSettings.id || "",
      newMode: InteractionMode.Jamming,
      tactonId: undefined,
    });
    return;
  }

  const f = () => {
    writeAmplitudeBuffer(tacton, index + 1);
  };

  if (isInstructionWait(tacton[index])) {
    const x = tacton[index] as InstructionWait;
    instructionTimer = setTimeout(f, x.wait.miliseconds);
  } else if (isInstructionSetParameter(tacton[index])) {
    const x = tacton[index] as InstructionSetParameter;
    const c: number[] = x.setParameter.channelIds;

    WebSocketAPI.sendInstruction({
      roomId: store.state.roomSettings.id || "",
      instructions: [
        {
          /* keyId: "REC", */ channels: c,
          intensity: x.setParameter.intensity,
        },
      ],
    });

    writeAmplitudeBuffer(tacton, index + 1);
  }
};
