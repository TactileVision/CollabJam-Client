import { Store } from "../../store/store";
import { RoomMutations, RoomSettingsActionTypes, RoomState } from "../../store/modules/roomSettings/roomSettings";
import { WS_MSG_TYPE } from "./ws_types";
import { RouterNames } from "@/types/Routernames";
import router from "@/renderer/router";
import { IPC_CHANNELS } from "@/electron/IPCMainManager/IPCChannels";
import { TactonMutations, TactonSettingsActionTypes } from "@/renderer/store/modules/tactonSettings/tactonSettings";
import { GeneralSettingsActionTypes } from "@/renderer/store/modules/generalSettings/generalSettings";
import { TactonPlaybackActionTypes, createTacton, createTactonInstructionsFromPayload } from "@/renderer/store/modules/tactonPlayback/tactonPlayback";
import { Tacton } from "@/types/TactonTypes";
import { bufferedSending } from "@/renderer/CommunicationManager/WebSocketManager/index"
import { InteractionMode } from "@/types/GeneralType";

export interface SocketMessage {
    type: WS_MSG_TYPE;
    payload: any;
}

export const handleMessage = (store: Store, msg: SocketMessage) => {
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
            store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, { rooms: msg.payload })
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
            console.log("ROOM_INFO_CLI")
            console.log(msg.payload)
            if (store.state.generalSettings.currentView == RouterNames.ROOM) {
                let roomState = RoomState.Create;
                if (msg.payload.existRoom == true)
                    roomState = RoomState.Enter;
                store.commit(RoomMutations.CHANGE_ROOM, { roomState: roomState, roomInfo: { ...msg.payload.roomInfo, participants: msg.payload.participants, } })
                router.push("/setup");
            }

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
            console.log("ENTER_UPDATE_ROOM_CLI")
            store.dispatch(RoomSettingsActionTypes.enterRoom, msg.payload)
            //TODO Add action to set the list of tactons for a specific room id!
            store.dispatch(TactonPlaybackActionTypes.setTactonList, msg.payload.recordings)
            if (store.state.generalSettings.currentView == RouterNames.SETUP) {
                router.push("/playGround");
                //TODO Start periodic sending of input data
                if (store.state.roomSettings.id != undefined) {
                    //MARK: Start the debouncing of inputs
                    setInterval(() => {
                        bufferedSending(store.state.roomSettings.id || "", store.state.tactonSettings.debounceInstructionsBuffer)
                        store.dispatch(TactonSettingsActionTypes.clearDebounceBuffer)
                    }, 20)
                }
            }
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
            console.log("UPDATE_ROOM_CLI")
            console.log(msg.payload)
            store.dispatch(RoomSettingsActionTypes.updateRoom, msg.payload)
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
            //console.log("UPDATE_USER_ACCOUNT_CLI")
            //console.log(msg.payload)
            store.commit(RoomMutations.UPDATE_PARTICIPANTS, msg.payload)
            break;
        }
        /**
        * get called if one user controll his vibrotactile device
        * IPC_CHANNELS.main.executeTask --> only called if you want to feel the vibration
        * * recieve {
            *    channels: OutputChannelState[] ==> all instructions in custom format
            *   } as payload
        */
        case WS_MSG_TYPE.SEND_INSTRUCTION_CLI: {
            //console.log("SEND_INSTRUCTION_CLI")
            //console.log(msg.payload)
            if (store.state.roomSettings.mode != InteractionMode.Playback) {
                store.dispatch(TactonSettingsActionTypes.modifySpecificChannel, msg.payload)
            }
            if (store.state.generalSettings.currentView == RouterNames.PLAY_GROUND && !store.state.playGround.inEditMode) {
                window.api.send(IPC_CHANNELS.main.executeTask, msg.payload);
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
            store.commit(RoomMutations.UPDATE_RECORD_MODE, msg.payload)
            //TODO Change tacton state based on received update!
            const rm = msg.payload as InteractionMode
            switch (rm) {
                case InteractionMode.Jamming:
                    console.log("Jamming")
                    store.commit(TactonMutations.TRACK_STATE_CHANGES, false);
                    break;
                case InteractionMode.Recording:
                    console.log("Recording")
                    store.commit(TactonMutations.TRACK_STATE_CHANGES, true);
                    break;
                case InteractionMode.Playback:
                    console.log("Playback")
                    store.commit(TactonMutations.TRACK_STATE_CHANGES, false);
                    break;

                default:
                    break;
            }
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
            console.log("GET_TACTON_CLI")
            console.log(msg.payload)
            if (msg.payload.length == 0) {
                store.dispatch(GeneralSettingsActionTypes.tactonLengthChanged);
            } else {
                const t: Tacton = msg.payload as Tacton
                store.dispatch(TactonPlaybackActionTypes.addTacton, t)
                store.dispatch(TactonPlaybackActionTypes.selectTacton, t.uuid)
            }
            break;
        }
    }

}