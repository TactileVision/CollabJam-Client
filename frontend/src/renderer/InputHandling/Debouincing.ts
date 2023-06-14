import { Instruction } from "./InputHandlerManager";

export const debouncedHandling = (instructions: Instruction[]): Instruction[] => {

	const combinedInstructions: Instruction[] = []
	if (instructions.length > 0) {

		//get all unique channels in buffered instructions
		const uniqueChannels = [...new Set(instructions.map(item => item.channels).flat())]; // [ 'A', 'B']
		const lastInstructions: Instruction[] = []

		// get for each channel the last instruction that is stored in the array
		uniqueChannels.forEach((c) => {
			const lastForInstructionChannel = instructions.filter(instruction => {
				// console.log(instruction.channels)
				// console.log(c)
				return instruction.channels.includes(c) == true
			}).pop()
			if (lastForInstructionChannel != undefined) {
				lastInstructions.push(lastForInstructionChannel)
			}

		})

		//get all unique intensities in buffered instructions
		const uniqueIntensities = [...new Set(lastInstructions.map(item => item.intensity))]; // [ 'A', 'B']

		uniqueIntensities.forEach(intensity => {
			const x = lastInstructions.filter(i => {
				return i.intensity == intensity
			})
			//Combine all channnel arrays into one array
			const channels: Set<number> = new Set<number>()
			x.forEach(e => {
				e.channels.forEach(c => {
					channels.add(c)
				})
			})

			combinedInstructions.push({
				channels: [...channels],
				intensity: intensity

			})

		})
	}
	return combinedInstructions
}