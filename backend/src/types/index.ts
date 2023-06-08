import { v4 as uuidv4 } from "uuid";

/**
 * custom types used in the backend
 */
export interface User {
    id: string,
    name: string,
    color: string
}

export interface RoomMetaData {
    id: string,
    name: string,
    description: string,
    recordingNamePrefix : string
}

export interface Room extends RoomMetaData {
    mode: InteractionMode,
    maxDurationRecord: number,
}

export interface TactileTask {
    channel: number[],
    intensity: number
}

export interface ServerInstruction extends TactileTask {
    keyId: string
}

export interface Intensity {
    keyId: string,
    clientId: string,
    intensity: number
}

export interface Channel {
    id: number,
    intensityList: Intensity[],
}

// interface InstructionSetParameter {
//     setParameter: any
// }
interface InstructionSetParameter {
    setParameter: {
        channelIds: number[];
        intensity: number;
    }
}
interface InstructionWait {
    wait: {
        miliseconds: number
    }
}

export type TactonInstruction = InstructionSetParameter | InstructionWait;

// type Instructions = InstructionSetParameter | InstructionWait;
// export type TactonInstruction = {
//     Instruction: Instructions
// }

export interface InstructionToClient {
    channelIds: number[],
    intensity: number,
    author: User | undefined
}


export interface Tacton {
    uuid: string
    name: string
    favorite: boolean
    recordDate: Date
    instructions: TactonInstruction[]
}

export function impl<I>(i: I) { return i; }

export class TactonRecording {
    uuid: string = uuidv4().toString()
    name: string = ""
    favorite: boolean = false
    // isRecording: boolean = false
    recordDate: Date | undefined = undefined
    instructions: TactonInstruction[] = [] as TactonInstruction[]

    getTacton(): Tacton {

        const i = this.instructions[this.instructions.length -1] 
        console.log(i)

        return impl<Tacton>({
            uuid: this.uuid,
            name: this.name,
            favorite: this.favorite,
            recordDate: this.recordDate == undefined ? new Date() : this.recordDate,
            instructions: this.instructions
        })

    }
}


export class TactonRecordingSession {
    recording: TactonRecording = new TactonRecording()
    history: Tacton[] = [] as Tacton[]
    lastModified: number = new Date().getTime()

    updateModificationDate(): void {
        this.lastModified = new Date().getTime()
    }
    //getTactonByUUID
    //getTactonHistory
    finishRecording(): Tacton {
        const t = this.recording.getTacton()
        this.history.push(t)
        this.recording = new TactonRecording()
        this.updateModificationDate()
        return t
    }
}


export enum InteractionMode {
    Jamming = 1,
    Recording,
    Playback
}

export interface InstructionFromClient {
    keyId: string;
    channels: number[];
    intensity: number;
};