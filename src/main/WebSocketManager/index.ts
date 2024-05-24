import { Store } from "@/renderer/store/store";
import { Instruction } from "@/main/Input/InputHandling/InputHandlerManager";
import { debouncedHandling } from "@/main/Input/InputHandling/Debouincing";
// import { router } from "@/renderer/router";
import {
  ChangeTactonMetadata,
  RequestEnterRoom,
  RequestSendTactileInstruction,
  RequestUpdateRoom,
  RequestUpdateUser,
  UpdateRoomMode,
  UpdateTacton,
  WS_MSG_TYPE,
} from "@sharedTypes/websocketTypes";
import { Socket, io } from "socket.io-client";
import { RoomSettingsActionTypes } from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import { handleMessage } from "./messageHandler";

let currentUrl = "";
export let socket = null as Socket | null;
// export const socket = io("ws://localhost:4444");

export const bufferedSending = (
  roomId: string,
  instructions: Instruction[],
) => {
  if (instructions.length > 0) {
    const instructionsToSend = debouncedHandling(instructions);
    if (instructionsToSend.length > 0) {
      WebSocketAPI.sendInstruction({
        roomId: roomId,
        instructions: instructionsToSend.map((i) => ({
          ...i,
          keyId: undefined,
          author: undefined,
        })),
      });
    }
  }
};

/**
 * method to initiate the websocket connection
 * in onmessage Function all custom messages are handled
 */
export const initWebsocket = (store: Store, url: string) => {
  if (socket !== null && currentUrl !== url) {
    console.log("Closing socket");
    socket.close();
    currentUrl = url;
  }
  socket = io("ws://localhost:4444");
  socket.on("connect", () => {
    console.log("SOCKET IS CONNECTED!!!!"); // x8WIv7-mJelg7on_ALbx
    handleMessage(store);
    console.log(socket?.id); // x8WIv7-mJelg7on_ALbx
    socket?.emit(WS_MSG_TYPE.GET_AVAILABLE_ROOMS_SERV, {});
  }); //     //add this token to establish a connection

  socket.on(WS_MSG_TYPE.GET_AVAILABLE_ROOMS_CLI, (rooms) => {
    store.dispatch(RoomSettingsActionTypes.setAvailableRoomList, {
      rooms: rooms,
    });
  });
};

export const WebSocketAPI = {
  sendInstruction: (payload: RequestSendTactileInstruction) => {
    socket?.emit(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, payload);
  },
  requestAvailableRooms: () => {
    console.log("get rooms");
    socket?.emit(WS_MSG_TYPE.GET_AVAILABLE_ROOMS_SERV, {});
  },
  logOut: (payload: RequestUpdateUser) => {
    socket?.emit(WS_MSG_TYPE.LOG_OUT, payload);
  },
  updateTacton: (payload: UpdateTacton) => {
    socket?.emit(WS_MSG_TYPE.UPDATE_TACTON_SERV, payload);
  },
  updateTactonDuration: (payload: { roomId: string; duration: number }) => {
    socket?.emit(WS_MSG_TYPE.CHANGE_DURATION_SERV, payload);
  },
  updateTactonFilenamePrefix: (payload: { roomId: string; prefix: string }) => {
    socket?.emit(WS_MSG_TYPE.CHANGE_ROOMINFO_TACTON_PREFIX_SERV, payload);
  },
  updateRoomMode: (payload: UpdateRoomMode) => {
    socket?.emit(WS_MSG_TYPE.UPDATE_ROOM_MODE_SERV, payload);
  },
  changeTactonMetadata: (payload: ChangeTactonMetadata) => {
    socket?.emit(WS_MSG_TYPE.CHANGE_TACTON_METADATA_SERV, payload);
  },
  getRoomInfos: (roomId: string) => {
    socket?.emit(WS_MSG_TYPE.ROOM_INFO_SERV, roomId);
  },
  updateRoom: (payload: RequestUpdateRoom) => {
    socket?.emit(WS_MSG_TYPE.UPDATE_ROOM_SERV, payload);
  },
  enterRoom: (payload: RequestEnterRoom) => {
    socket?.emit(WS_MSG_TYPE.ENTER_ROOM_SERV, payload);
  },
};
