import { WS_MSG_TYPE } from "./ws_types";
import StorageManager from "../store/StoreManager"
interface SocketMessage {
    type: WS_MSG_TYPE;
    data: any;
}
export const onMessage = (ws: WebSocket, data: any, client: string) => {
    console.log(`Received message ${data} from user ${client}`);
    console.log(data)
    //StorageManager.temp()
    try {
        let msg: SocketMessage = JSON.parse(data);
        switch (msg.type) {
            case WS_MSG_TYPE.ENTER_ROOM: {
                break;
            }
            case WS_MSG_TYPE.GET_ROOM_INFO: {
                const roomInfo = StorageManager.getRoomInfo(msg.data);
                console.log(roomInfo)
                ws.send(JSON.stringify({
                    type: WS_MSG_TYPE.SEND_ROOM_INFO,
                    payload: roomInfo,
                }))
                break;
            }
        }
    } catch (err) {
        console.log("Error occured: " + err);
        ws.send("Error occured: " + err)
    }
}

export const onClose = (client: string) => {
    console.log(`Received close message  from user ${client}`);
}