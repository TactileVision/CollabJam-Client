import { InteractionMode, Room, TactonRecording, User } from "../types";
import { WS_MSG_TYPE } from "../webSocket/ws_types";
import RoomModule from "./RoomModule";
import TactonModule from "./TactonModule";
import UserModule from "./UserModule";

/**
 * Generel Module to handle different abstract operations with the 3 modules
 */

const createSession = (room: Room): Room => {
    console.log("createSession")
    const roomId = RoomModule.createRoom(room);
    UserModule.createRoomRef(roomId)
    TactonModule.createRoomRef(roomId)
    return RoomModule.getRoomInfo(roomId)!;
}

const updateSession = (roomAttributes: { id: string, name: string, description: string }, user: User, startTimeStamp: number) => {
    //update room information and participants list, return true if something is updated
    const needRoomUpdate = RoomModule.updateRoomInformation(roomAttributes.id, roomAttributes.name, roomAttributes.description)
    const needUserUpdate = UserModule.updateUser(roomAttributes.id, user);

    if (!needRoomUpdate && !needUserUpdate) return false;

    return true;
}

/**
 * method what one user enter a room initial
 * notify all users about new participant
 */
const enterSession = (ws: WebSocket, userID: string, userName: string, roomInfo: Room, startTimeStamp: number) => {
    const userData = UserModule.enterUserInRoom(ws, userID, userName, roomInfo.id);
    //its about entering should never return at this point
    if (userData == undefined) return;

    const participantList = UserModule.getParticipants(roomInfo.id)

    //send the new user all data of the room, participants and his own userId
    ws.send(JSON.stringify({
        type: WS_MSG_TYPE.ENTER_UPDATE_ROOM_CLI,
        payload: { room: roomInfo, userId: userID, participants: participantList },
        startTimeStamp: startTimeStamp
    }))

    //update all user about the new person
    broadCastMessage(roomInfo.id,
        WS_MSG_TYPE.UPDATE_ROOM_CLI,
        { room: roomInfo, participants: participantList },
        startTimeStamp)
}

/**
 * method to remove one person of the room
 * if there are still participants --> notify the other users
 * if the room is now empty --> close the room
 */
const removeUserOfSession = (roomId: string, user: User, startTimeStamp: number) => {
    const userInRoom = UserModule.removeParticipant(roomId, user.id);
    if (userInRoom !== undefined) {
        if (userInRoom == 0) {
            RoomModule.removeRoom(roomId);
            UserModule.removeRoomRef(roomId)
            TactonModule.removeRoomRef(roomId)
        } else {
            const participants = UserModule.getParticipants(roomId);
            broadCastMessage(roomId, WS_MSG_TYPE.UPDATE_USER_ACCOUNT_CLI, participants, startTimeStamp);
        }
    }

}

const changeRoomMode = (roomId: string, newMode: InteractionMode, startTimeStamp: number) => {

    // const isValidModeChange  = RoomModule.
    // if(newMode == InteractionMode.Jamming)
    const r = RoomModule.getRoomInfo(roomId)
    if (r == undefined) return
    const rm = r.mode
    if (RoomModule.updateRoomMode(roomId, newMode)) {
        console.log(`Changing interaction mode to ${newMode}`)
        const s = TactonModule.sessions.get(roomId)
        if (s == undefined) return

        if (newMode == InteractionMode.Recording) { //Old Mode was Jamming
            // Start new Recording 
            s.recording = new TactonRecording()
            //TODO Broadcast information about recording to clients


        }
        else if (newMode == InteractionMode.Playback) {
            //Old Mode was Jamming
        }
        else {
            //Old Mode was reccording or playback, Store tacton in history and send item to client
            //TODO Extract to own method
            if (rm == InteractionMode.Recording) {
                const t = s.recording.getTacton()
                const prefix = s.history.filter(e => {
                    return e.name.startsWith(r.recordingNamePrefix + "-") == true
                })
                let len = prefix.length.toString()
                t.name = r.recordingNamePrefix + "-" + len
                s.history.push(t)
            } else { // Playback
            }
        }

        broadCastMessage(roomId, WS_MSG_TYPE.UPDATE_ROOM_MODE_CLI, newMode, startTimeStamp)
    }

}

const changeRecordMode = (roomId: string, shouldRecord: boolean, startTimeStamp: number) => {
    // const needUpdate = RoomModule.updateRecordMode(roomId, shouldRecord)
    // if (needUpdate == true) {
    //     if (shouldRecord == true){
    //         console.log("Starting to record now")
    //         TactonModule.deleteTactonInstructions(roomId);
    //     } else {
    //         console.log("Stopping the recording now")
    //     }

    //     broadCastMessage(roomId, WS_MSG_TYPE.UPDATE_RECORD_MODE_CLI, shouldRecord, startTimeStamp)
    // }

}

const changeDuration = (roomId: string, maxDuration: number, startTimeStamp: number) => {
    const needUpdate = RoomModule.updateMaxDuration(roomId, maxDuration)

    if (needUpdate == true)
        broadCastMessage(roomId, WS_MSG_TYPE.CHANGE_DURATION_CLI, maxDuration, startTimeStamp)
}

/**
 * generell method to notify all users of one specific room
 * @param roomId adress of the room, where the users shoud get the notification
 * @param type  message type
 * @param payload content of the message
 * @param startTimeStamp initial timestamp of the original request
 * @returns void
 */
const broadCastMessage = (roomId: string, type: WS_MSG_TYPE, payload: any, startTimeStamp: number) => {
    const wsList = UserModule.getWsRoomList(roomId);
    if (wsList.length == 0) return;

    for (let i = 0; i < wsList.length; i++) {
        wsList[i].send(JSON.stringify({
            type: type,
            payload: payload,
            startTimeStamp: startTimeStamp
        }))
    };
}

/**
 * method to start the calculation of needed operations and distribute them
 * also to store the tacton in vtproto format
 */
const processInstructionsFromClient = (roomId: string, clienId: string, instructions: [{ keyId: string, channels: number[], intensity: number }], startTimeStamp: number) => {
    const newInstructions = RoomModule.getInstructionsFromClientInput(clienId, roomId, instructions)
    if (newInstructions == undefined || newInstructions.length == 0) return;
    // console.log(newInstructions)

    broadCastMessage(roomId, WS_MSG_TYPE.SEND_INSTRUCTION_CLI, newInstructions, startTimeStamp);

    const room = RoomModule.getRoomInfo(roomId);
    if (room == undefined) return;
    if (room.mode == InteractionMode.Recording) {
        TactonModule.addInstructionsToTactonRecording(roomId, newInstructions)
    }
}

export default {
    createSession,
    broadCastMessage,
    enterSession,
    updateSession,
    removeUserOfSession,
    changeRecordMode,
    changeRoomMode,
    changeDuration,
    processInstructionsFromClient
}