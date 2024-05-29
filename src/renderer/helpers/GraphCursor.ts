import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { useStore } from "@/renderer/store/store";
const updateTimeInterval = 1000 / 60;
// Store current playback time in the client store to move the cursor when playing back and stop playback after 20s
let cursorTimer: NodeJS.Timeout | null = null;

//TODO Define a type that will allow to differentiate between wait and execute instructions
export const startGraphCursor = () => {
  cursorTimer = setInterval(() => {
    const s = useStore();
    s.dispatch(
      TactonPlaybackActionTypes.updateTime,
      s.state.tactonPlayback.playbackTime + updateTimeInterval,
    );
  }, updateTimeInterval);
};

export function stopGraphCursor() {
  if (cursorTimer != null) {
    clearInterval(cursorTimer as NodeJS.Timeout);
    const s = useStore();
    s.dispatch(TactonPlaybackActionTypes.updateTime, 0);
  }
}
