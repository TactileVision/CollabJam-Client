import { Store } from "@/renderer/store/store";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import {
  /* WebSocketAPI, */ WebSocketAPI,
  socket,
} from "@/main/WebSocketManager/index";
// import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { TactonSettingsActionTypes } from "@/renderer/store/modules/collaboration/tactonSettings/tactonSettings";
import { InteractionMode, Room, User } from "@sharedTypes/roomTypes";
import { InstructionToClient, Tacton } from "@sharedTypes/tactonTypes";
import {
  ChangeTactonMetadata,
  TactonDeletion,
  UpdateAvailableTags,
  UpdateRoomMode,
  UpdateTacton,
  WS_MSG_TYPE,
} from "@sharedTypes/websocketTypes";
import {
  RoomMutations,
  RoomSettingsActionTypes,
  RoomState,
} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { Instruction } from "../Input/InputHandling/InputHandlerManager";
import { debouncedHandling } from "../Input/InputHandling/Debouincing";
import { toRaw } from "vue";
import { updateInteractionMode } from "@/renderer/helpers/recordMode";

export const handleMessage = (store: Store) => {
  console.log("Regstering message handler");
  console.log("on connect");
  if (socket == null) return;

  socket.on(WS_MSG_TYPE.ENTER_ROOM_CLI, (res) => {
    console.log("ENTER_ROOM_CLI");
    console.log(res);
    store.dispatch(RoomSettingsActionTypes.enterRoom, res);
    store.dispatch(TactonPlaybackActionTypes.setTactonList, res.recordings);
    if (store.state.roomSettings.id != undefined) {
      //MARK: Start the debouncing of inputs
      setInterval(() => {
        const muted = store.state.roomSettings.mutedParticipants.has(
          store.state.roomSettings.user.id,
        );
        const instructionsToSend: Instruction[] = debouncedHandling(
          store.state.tactonSettings.debounceInstructionsBuffer,
        );

        // console.log(instructionsToSend);
        store.dispatch(TactonSettingsActionTypes.clearDebounceBuffer);

        if (instructionsToSend.length > 0) {
          if (muted) {
            // TODO: Wouldnt it make more sense to send InstructionToClient to the server as well because they are translating it anyway?
            const clientInstructions: InstructionToClient[] =
              instructionsToSend.map((instruction) => ({
                ...instruction,
                keyId: undefined,
                author: toRaw(store.state.roomSettings.user),
              }));
            store.dispatch(
              TactonSettingsActionTypes.modifySpecificChannel,
              clientInstructions,
            );

            window.api.send(
              IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer,
              clientInstructions,
            );
          } else {
            WebSocketAPI.sendInstruction({
              roomId: store.state.roomSettings.id || "",
              instructions: instructionsToSend.map((instruction) => ({
                ...instruction,
                keyId: undefined,
                author: toRaw(store.state.roomSettings.user),
              })),
            });
          }
        }
      }, 20);
    }
    updateInteractionMode(store, {
      newMode: res.room.mode,
      roomId: res.room.id,
      tactonId: undefined,
    });
  });

  socket.on(WS_MSG_TYPE.SEND_INSTRUCTION_CLI, (res: InstructionToClient[]) => {
    const instructions = res as InstructionToClient[];

    if (store.state.roomSettings.mode != InteractionMode.Playback) {
      store.dispatch(
        TactonSettingsActionTypes.modifySpecificChannel,
        instructions,
      );
    }
    const mutedParticipants = store.state.roomSettings.mutedParticipants;
    // For playback we want to play all instructions because the "author" is always the user that started the playback
    // which makes muting pretty unintuitive
    const instructionsToExecute = instructions.filter(
      (instruction) =>
        !instruction.author ||
        store.state.roomSettings.mode == InteractionMode.Playback ||
        !mutedParticipants.has(instruction.author.id),
    );

    if (
      // store.state.generalSettings.currentView == RouterNames.PLAY_GROUND &&
      !store.state.playGround.inEditMode
    ) {
      window.api.send(IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers, {
        taskList: instructionsToExecute,
      });
    }
  });

  socket.on(WS_MSG_TYPE.UPDATE_USER_ACCOUNT_CLI, (res: User[]) => {
    console.log("UPDATING USER ACCOUNT");
    console.log(res);
    store.dispatch(RoomSettingsActionTypes.updateParticipantList, {
      participants: res,
    });
  });

  socket.on(WS_MSG_TYPE.UPDATE_ROOM_MODE_CLI, (res: UpdateRoomMode) => {
    updateInteractionMode(store, res);
  });

  socket.on(WS_MSG_TYPE.GET_TACTON_CLI, (res: Tacton) => {
    console.log("new tacton added!");
    store.dispatch(TactonPlaybackActionTypes.addTacton, res);
    store.dispatch(TactonPlaybackActionTypes.selectTacton, res.uuid);
  });

  socket.on(
    WS_MSG_TYPE.CHANGE_TACTON_METADATA_CLI,
    (res: ChangeTactonMetadata) => {
      console.log("Tacton Metadata updated!");
      store.dispatch(TactonPlaybackActionTypes.updateMetadata, {
        tactonUuid: res.tactonId,
        metadata: res.metadata,
      });
    },
  );

  socket.on(WS_MSG_TYPE.UPDATE_TACTON_CLI, (res: UpdateTacton) => {
    store.dispatch(TactonPlaybackActionTypes.updateTacton, res.tacton);
  });

  socket.on(WS_MSG_TYPE.ROOM_INFO_CLI, (room: Room) => {
    store.commit(RoomMutations.CHANGE_ROOM, {
      roomState: RoomState.Enter,
      roomInfo: {
        id: room.id,
        name: room.name,
        description: room.description,
        participants: room.participants,
        // isRecording: room.isRecording,
        maxDurationRecord: room.maxDurationRecord,
        recordingNamePrefix: room.recordingNamePrefix,
        mode: room.mode,
        currentRecordingTime: 0,
      },
    });
  });

  socket.on(WS_MSG_TYPE.DELETE_TACTON_CLI, (res: TactonDeletion) => {
    if (res.delted) {
      store.dispatch(
        TactonPlaybackActionTypes.deleteTacton,
        res.tacton.tactonId,
      );
      if (
        res.tacton.tactonId == store.state.tactonPlayback.currentTacton?.uuid
      ) {
        store.dispatch(TactonPlaybackActionTypes.deselectTacton);
      }
    }
  });

  socket.on(
    WS_MSG_TYPE.UPDATE_AVAILABLE_TAGS_CLI,
    (res: UpdateAvailableTags) => {
      // console.log("NEW TAGS!");
      // console.log(res);
      store.commit(RoomMutations.SET_AVAILABLE_CUSTOM_TAGS, res.customTags);
      if (res.bodyTags != undefined) {
        store.commit(RoomMutations.SET_AVAILABLE_BODY_TAGS, res.bodyTags);
      }
    },
  );

  // const router = useRouter()
  /**
   * every message containing:
   * msg.type:string ==> Reson for the call
   * msg.payload:any ==> custom data
   * msg.startTimeStamp:number ==> initial timestamp, when one user send the request to the server
   */
};
