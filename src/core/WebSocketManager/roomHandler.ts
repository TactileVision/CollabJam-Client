import { sendSocketMessage } from "@/core/WebSocketManager";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";

export const getAvailableRooms = () => {
  sendSocketMessage(WS_MSG_TYPE.GET_AVAILABLE_ROOMS_SERV, {});
};
