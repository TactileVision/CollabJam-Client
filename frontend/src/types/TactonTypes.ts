
export interface Tacton {
	uuid: string
	name: string
	favorite: boolean
	recordDate: Date
	instructions: TactonInstruction[]
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

