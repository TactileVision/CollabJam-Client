import {
  playbackRecordedTacton,
  stopPlayback,
} from "@/renderer/helpers/TactonPlayer";
import {
  RoomMutations,
  RoomSettingsActionTypes,
  RoomState,
} from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { Store } from "@/renderer/store/store";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { WebSocketAPI } from "@/main/WebSocketManager/index";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import {
  TactonMutations,
  TactonSettingsActionTypes,
} from "@/renderer/store/modules/collaboration/tactonSettings/tactonSettings";
import { InteractionMode } from "@sharedTypes/roomTypes";
import { InstructionToClient, TactileTask } from "@sharedTypes/tactonTypes";
import { SocketMessage, WS_MSG_TYPE } from "@sharedTypes/websocketTypes";
import { Instruction } from "../Input/InputHandling/InputHandlerManager";
import { debouncedHandling } from "../Input/InputHandling/Debouincing";
import { toRaw } from "vue";

// export interface SocketMessage {
//   type: WS_MSG_TYPE;
//   payload: any;
// }

export const handleMessage = (store: Store, msg: SocketMessage) => {
  // const router = useRouter()
  /**
   * every message containing:
   * msg.type:string ==> Reson for the call
   * msg.payload:any ==> custom data
   * msg.startTimeStamp:number ==> initial timestamp, when one user send the request to the server
   */
  switch (msg.type) {
    /**
     * receives an array of all available rooms in server
     * payload: Room[]
     */
    case WS_MSG_TYPE.GET_AVAILABLE_ROOMS_CLI: {
      store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
        rooms: msg.payload,
      });
      break;
    }
    /**
         * method to enter the setup view and display the metadata of the room
         * * recieve {
                *    existRoom:boolean, 
                *    roomInfo:{
                *       id: string,
                        description: string,
                        name: string,
                        participants: User[]
                        }
                *   } as payload
         */
    case WS_MSG_TYPE.ROOM_INFO_CLI: {
      console.log("ROOM_INFO_CLI");
      console.log(msg.payload);
      // if (store.state.generalSettings.currentView == RouterNames.ROOM) {
      let roomState = RoomState.Create;
      if (msg.payload.existRoom == true) roomState = RoomState.Enter;
      console.log("Changing rooms");
      store.commit(RoomMutations.CHANGE_ROOM, {
        roomState: roomState,
        roomInfo: {
          ...msg.payload.roomInfo,
          participants: msg.payload.participants,
        },
      });
      // router.push("/setup");
      // }
      break;
    }
    /**
     * method to enter the playground view, if you are currently in the setup view
     * only get called if you are currently not part of the room
     * update and set all metadata
     * * recieve {
     *    room: Room,
     *    userId: string ==> userId of own user
     *    participants: User[] ==> all users in the room, also own profile
     *   } as payload
     */
    case WS_MSG_TYPE.ENTER_ROOM_CLI: {
      console.log("ENTER_ROOM_CLI");
      store.dispatch(RoomSettingsActionTypes.enterRoom, msg.payload);
      //TODO Add action to set the list of tactons for a specific room id!
      store.dispatch(
        TactonPlaybackActionTypes.setTactonList,
        msg.payload.recordings,
      );
      // if (store.state.generalSettings.currentView == RouterNames.SETUP) {
      //TODO Move to inside vue framework
      // router.push("/playGround");
      //TODO Start periodic sending of input data
      if (store.state.roomSettings.id != undefined) {
        //MARK: Start the debouncing of inputs
        setInterval(() => {
          const muted = store.state.roomSettings.mutedParticipants.has(
            store.state.roomSettings.user.id,
          );
          const instructionsToSend: Instruction[] = debouncedHandling(
            store.state.tactonSettings.debounceInstructionsBuffer,
          );

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
      // }
      break;
    }
    /**
     * get called if some metadata of the room has to be changed
     * update and set all metadata
     * * recieve {
     *    room: Room,
     *    participants: User[] ==> all users in the room, also own profile
     *   } as payload
     */
    case WS_MSG_TYPE.UPDATE_ROOM_CLI: {
      console.log("UPDATE_ROOM_CLI");
      console.log(msg.payload);
      store.dispatch(RoomSettingsActionTypes.updateRoom, msg.payload);
      break;
    }
    // /**
    //    * method to enter the playground view, if you are currently in the setup view
    //    * only get called if you are still part of the room
    //    * contain no payload
    //    *
    //    */
    // case WS_MSG_TYPE.ENTER_ROOM_CLI: {
    //     // console.log("NO_CHANGE_ROOM_CLI")
    //     // store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, { rooms: msg.payload })
    //     // if (store.state.generalSettings.currentView == RouterNames.SETUP)
    //     //     router.push("/playGround");
    //     break;
    // }
    /**
     * get called if the userlist get changed, in cause of someone change the username inside of the playground or left the room
     * * recieve {
     *    participants: User[] ==> all users in the room, also own profile
     *   } as payload
     */
    case WS_MSG_TYPE.UPDATE_USER_ACCOUNT_CLI: {
      // console.log("UPDATE_USER_ACCOUNT_CLI");
      // console.log(msg.payload);
      store.dispatch(RoomSettingsActionTypes.updateParticipantList, {
        participants: msg.payload,
      });
      break;
    }
    /**
     * get called if one user controll his vibrotactile device
     * IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers --> only called if you want to feel the vibration
     * * recieve {
     *    channels: OutputChannelState[] ==> all instructions in custom format
     *   } as payload
     */
    case WS_MSG_TYPE.SEND_INSTRUCTION_CLI: {
      console.log("SEND_INSTRUCTION_CLI");
      console.log(msg.payload);
      const instructions = msg.payload as InstructionToClient[];

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
      break;
    }
    /**
     * get called if record mode is changed
     * * recieve {
     *    shouldRecord: boolean
     *   } as payload
     */
    case WS_MSG_TYPE.UPDATE_ROOM_MODE_CLI: {
      //TODO Change tacton state based on received update!
      const update = msg.payload;
      const rm = update.newMode;
      switch (rm) {
        case InteractionMode.Jamming:
          console.log("Jamming");
          if (store.state.roomSettings.mode == InteractionMode.Playback) {
            stopPlayback();
            // Set all outputs to 0
            // store.state.generalSettings.deviceList.forEach((device) => {
            const tt: TactileTask = {
              channels: [...Array(16).keys()],
              intensity: 0,
            };
            window.api.send(
              IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers,
              { taskList: [tt] },
            );
            // });
          }
          store.commit(TactonMutations.TRACK_STATE_CHANGES, false);
          break;
        case InteractionMode.Recording:
          console.log("Recording");
          store.commit(TactonMutations.TRACK_STATE_CHANGES, true);
          break;
        case InteractionMode.Playback:
          console.log("Playback");
          if (update.tactonId != undefined) {
            store.dispatch(
              TactonPlaybackActionTypes.selectTacton,
              update.tactonId,
            );
            if (store.state.tactonPlayback.currentTacton != undefined) {
              playbackRecordedTacton(
                store.state.tactonPlayback.currentTacton.instructions,
              );
            }
          }
          store.commit(TactonMutations.TRACK_STATE_CHANGES, false);
          break;

        default:
          break;
      }
      store.commit(RoomMutations.UPDATE_RECORD_MODE, rm);
      break;
    }

    /**
     * get called if max duration of time profile is changed
     * * recieve {
     *    maxDuration: number ==> time in ms
     *   } as payload
     */
    case WS_MSG_TYPE.CHANGE_DURATION_CLI: {
      //console.log("CHANGE_DURATION_CLI")
      store.commit(RoomMutations.UPDATE_MAX_DURATION_TACTON, msg.payload);
      break;
    }
    /**
     * get called if you request the full tacton to save it
     * * recieve {
     *    Instruction: Json in vtproto format
     *   } as payload
     */
    case WS_MSG_TYPE.GET_TACTON_CLI: {
      console.log(msg.payload);
      // if (msg.payload.length == 0) {
      //   store.dispatch(GeneralSettingsActionTypes.tactonLengthChanged);
      // } else {
      // const t: Tacton = msg.payload as Tacton;
      store.dispatch(TactonPlaybackActionTypes.addTacton, msg.payload);
      store.dispatch(TactonPlaybackActionTypes.selectTacton, msg.payload.uuid);
      // }
      break;
    }
    case WS_MSG_TYPE.CHANGE_TACTON_METADATA_CLI: {
      const d = msg.payload;
      const t = store.state.tactonPlayback.tactons.find(
        (e) => e.uuid === d.tactonId,
      );
      if (t != undefined) {
        store.dispatch(TactonPlaybackActionTypes.updateMetadata, {
          tactonUuid: d.tactonId,
          metadata: d.metadata,
        });
      }
      break;
    }
    case WS_MSG_TYPE.UPDATE_TACTON_CLI: {
      store.dispatch(
        TactonPlaybackActionTypes.updateTacton,
        msg.payload.tacton,
      );
      break;
    }
  }
};
