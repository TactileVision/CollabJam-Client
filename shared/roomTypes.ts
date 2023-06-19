
export const enum InteractionMode {
    Jamming = 1,
    Recording,
    Playback
}

export interface User {
    id: string,
    name: string,
    color: string
}

export interface RoomMetaData {
    id: string,
    name: string,
    description: string,
    recordingNamePrefix: string,
    participants: User[]
}

export interface Room extends RoomMetaData {
    mode: InteractionMode,
    maxDurationRecord: number,
    currentRecordingTime: number
}