
export interface Tacton {
	uuid: string
	name: string
	favorite: boolean
	recordDate: Date
	instructions: TactonInstruction[]
}

export function impl<I>(i: I) { return i; }

// export class TactonRecording {
// 	uuid: string = uuidv4().toString()
// 	name: string = ""
// 	favorite: boolean = false
// 	isRecording: boolean = false
// 	recordDate: Date | undefined = undefined
// 	instructions: TactonInstruction[] = [] as TactonInstruction[]

// 	getTacton(): Tacton {
// 		return impl<Tacton>({
// 			uuid: this.uuid,
// 			name: this.name,
// 			favorite: this.favorite,
// 			recordDate: this.recordDate == undefined ? new Date() : this.recordDate,
// 			instructions: this.instructions
// 		})

// 	}
// }


// export class TactonRecordingSession {
// 	recording: TactonRecording = new TactonRecording()
// 	history: Tacton[] = [] as Tacton[]
// 	lastModified: number = new Date().getTime()

// 	updateModificationDate(): void {
// 		this.lastModified = new Date().getTime()
// 	}
// 	//getTactonByUUID
// 	//getTactonHistory
// 	finishRecording(): Tacton {
// 		const t = this.recording.getTacton()
// 		this.history.push(t)
// 		this.recording = new TactonRecording()
// 		this.updateModificationDate()
// 		return t
// 	}
// }
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