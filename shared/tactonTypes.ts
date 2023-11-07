import { User } from "./roomTypes"

export interface TactonMetadata {
	name: string
	favorite: boolean
	recordDate: Date
}
export interface Tacton {
	uuid: string
	// name: string
	// favorite: boolean
	// recordDate: Date
	metadata: TactonMetadata
	instructions: TactonInstruction[]
}
export interface InstructionSetParameter {
	setParameter: {
		channelIds: number[];
		intensity: number;
	}
}
export function impl<I>(i: I) { return i; }

export interface InstructionWait {
	wait: {
		miliseconds: number
	}
}
export interface InstructionSetParameter {
	setParameter: {
		channelIds: number[];
		intensity: number;
	}
}
export const isInstructionWait = (instruction: TactonInstruction) => {
	return 'wait' in instruction
}
export const isInstructionSetParameter = (instruction: TactonInstruction) => {
	return 'setParameter' in instruction
}
export type TactonInstruction = InstructionSetParameter | InstructionWait;
export interface InstructionServerPayload {
	Instruction: TactonInstruction
}
export function getDuration(tacton: Tacton): number {
	let d = 0
	tacton.instructions.filter(i => { return isInstructionWait(i) == true }).forEach(i => {
		d += (i as InstructionWait).wait.miliseconds
	})
	return d
}
function hasInstructions(tacton: Tacton): boolean {
	return tacton.instructions.filter(i => { return isInstructionSetParameter(i) == true }).length > 1
}
export function isWellFormed(tacton: Tacton): boolean {
	return getDuration(tacton) > 0 && hasInstructions(tacton)
}

export interface InstructionToClient {
	channelIds: number[],
	intensity: number,
	author: User | undefined
}

export interface TactileTask {
	channelIds: number[],
	intensity: number,
}

//Per Display actions
export interface SetAmplitudeTask {
	channelIds: number[],
	intensity: number,
}

export interface SetFrequencyTask {
	channelIds: number[],
	frequency: number,
}

// export interface SetDisplayParameterTask {
// 	channelIds: number[],
// 	value: number,
// 	type: 'frequency' | 'amplitude'
// }