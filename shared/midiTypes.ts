export interface MidiOutputInfo {
	id: string
	name: string
	channels: number
}

export interface MidiInputInfo {
	id: string
	name: string
	channels: number
}

export interface NoteOn {
	deviceId: string, channels: number | number[], frequency: number, amplitude: number
}