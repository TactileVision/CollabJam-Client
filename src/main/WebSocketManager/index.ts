import { Store } from "@/renderer/store/store";
import { LoggingLevel } from "@/main/FileManager/LoggingLevel";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { GeneralMutations } from "@/renderer/store/modules/generalSettings/generalSettings";
import { handleMessage } from "./messageHandler";
import { Instruction } from "@/main/Input/InputHandling/InputHandlerManager";
import { debouncedHandling } from "@/main/Input/InputHandling/Debouincing";
// import { router } from "@/renderer/router";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";

let clientWs = null as WebSocket | null;

/**
 * method to calculate the latency to the server every 30second
 * result get logged
 */
function heartbeat(store: Store) {
  if (!store.state.generalSettings.socketConnectionStatus) return;

  //for(let i=0; i<5;i++){
  clientWs?.send(
    JSON.stringify({
      type: WS_MSG_TYPE.PING,
      startTimeStamp: new Date().getTime(),
    }),
  );
  //}
  setTimeout(() => heartbeat(store), 30000);
  //setInterval(heartbeat(store),1000*5)
}

export const bufferedSending = (
  roomId: string,
  instructions: Instruction[],
) => {
  if (instructions.length > 0) {
    const instructionsToSend = debouncedHandling(instructions);
    if (instructionsToSend.length > 0) {
      sendSocketMessage(WS_MSG_TYPE.SEND_INSTRUCTION_SERV, {
        roomId: roomId,
        instructions: instructionsToSend,
      });
    }
  }
};

/**
 * method to initiate the websocket connection
 * in onmessage Function all custom messages are handled
 */
export const initWebsocket = (store: Store) => {
  //     //add this token to establish a connection
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  // clientWs = new WebSocket("wss://itactjam.informatik.htw-dresden.de/whws/path?token="+token)
  clientWs = new WebSocket("ws://localhost:3333/path?token=" + token);

  if (clientWs !== null) {
    clientWs.onopen = function (event: Event) {
      store.commit(GeneralMutations.UPDATE_SOCKET_CONNECTION, true);
      heartbeat(store);
      console.log("Opened websocket  connection " + event);
    };
    clientWs.onclose = function (event: Event) {
      store.commit(GeneralMutations.UPDATE_SOCKET_CONNECTION, false);
      // router.push("/")
      console.log("Closed websocket  connection " + event);
    };
    clientWs.onerror = function (event: Event) {
      store.commit(GeneralMutations.UPDATE_SOCKET_CONNECTION, false);
      console.log("Error websocket  connection " + event);
    };
    clientWs.onmessage = function (event: MessageEvent) {
      console.log("Message websocket  connection ");
      console.log(JSON.parse(event.data));
      try {
        const data = JSON.parse(event.data);
        handleMessage(store, data);
        window.api.send(IPC_CHANNELS.main.logMessageInfos, {
          level: LoggingLevel.INFO,
          type: data.type,
          startTimeStamp: data.startTimeStamp,
          endTimeStamp: new Date().getTime(),
        });
      } catch (err) {
        console.log("error Past");
        console.log(`Error occured ${err}`);
      }
    };
  }
};

export const sendSocketMessage = (msgType: WS_MSG_TYPE, payload: object) => {
  if (clientWs?.readyState == 1) {
    clientWs?.send(
      JSON.stringify({
        type: msgType,
        startTimeStamp: new Date().getTime(),
        payload: payload,
      }),
    );
  }
};
