import { InstructionToClient, Tacton, TactonInstruction, TactonRecordingSession, impl } from "../types"


let sessions: Map<string, TactonRecordingSession> = new Map<string, TactonRecordingSession>()


const createRoomRef = (roomId: string) => {
    sessions.set(roomId, new TactonRecordingSession())
    console.log(sessions)
}

const removeRoomRef = (roomId: string) => {
    sessions.delete(roomId)
}

const addInstructionsToTactonRecording = (roomId: string, clientInstrution: InstructionToClient[]) => {
    //Get current session
    const s = sessions.get(roomId)
    if (s == undefined) return
    const instructions = s.recording.instructions

    // Because there already is a instruction inside the array, we have to account for the time between instructions
    if (instructions.length > 0) {
        const timeDiff = new Date().getTime() - s.lastModified
        const parameter = {
            wait: {
                miliseconds: timeDiff
            }
        }
        instructions.push(parameter)
    }

    clientInstrution.forEach(clInstruct => {
        const parameter = {
                setParameter: {
                    channelId: clInstruct.channelIds,
                    intensity: clInstruct.intensity
                }
        }
        instructions.push(parameter)
    });

    s.recording.instructions = instructions
    s.lastModified = new Date().getTime()
}

const getTacton = (roomId: string, tactonUuid: string): Tacton | null => {
    const s: TactonRecordingSession | undefined = sessions.get(roomId)
    if (s == undefined) {
        return null
    } else {
        const t: Tacton = s.finishRecording()
        console.log(t)
        return t
    }
    // const tactonInstruction = tactonInstructionList.get(roomId)
    // if (tactonInstruction == undefined) return
    // return tactonInstruction.tacton
}

// const getTacton = (roomId: string) => {
//     const tactonInstruction = tactonInstructionList.get(roomId)
//     if (tactonInstruction == undefined) return
//     return tactonInstruction.tacton
// }

export default {
    createRoomRef,
    removeRoomRef,
    addInstructionsToTactonRecording,
    getTacton,
    sessions
}