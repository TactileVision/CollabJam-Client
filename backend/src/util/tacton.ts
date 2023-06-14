import { InstructionSetParameter, Tacton, isInstructionSetParameter } from "../types";

export function trimTacton(t: Tacton) {
	// Case 1 - Ends with Pause
	// Case 2 - Ends with Vibration 
	// the last set parameter is for setting all items to zeri and the last wait indicates the time between the last input and the deactivation
	// when the second last setParameter Instruction sets a value to 0, remove the following wait instruction
	const instructions = t.instructions.filter(inst => { return isInstructionSetParameter(inst) == true; }) as InstructionSetParameter[];
	if (instructions.length > 2 && instructions[instructions.length - 2].setParameter.intensity == 0) {
		t.instructions.splice(t.instructions.length - 2, 1);
	}
}