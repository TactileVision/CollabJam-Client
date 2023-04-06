import { TactileTask } from "@/types/GeneralType";
import { Peripheral } from "@abandonware/noble";
import protobuf from "protobufjs";
import { tactileDisplayService } from "./Services";
import path from "path";

enum InstructionType {
    channelId = "channelId",
    groupId = "groupId"
}

type payload = {
    [k in InstructionType]: number
} | {
    intensity: number
}

type Instruction = {
    setParameter: payload
}

const buildMessages = (instructions: Instruction[], definition: protobuf.Type) => {
    var messages: protobuf.Message[] = [];
    instructions.forEach((instruction: Instruction) => {
        const errMsg = definition.verify(instruction);
        if (errMsg) {
            throw Error(errMsg);
        }
        messages.push(definition.create(instruction));
    });
    return messages;
}

const buildWriter = (messages: protobuf.Message[], instructionDef: protobuf.Type): Buffer => {
    var writer: any = null;
    messages.forEach((message: protobuf.Message) => {
        writer = instructionDef.encodeDelimited(message, writer);
    });
    return writer.finish();
}

const convertTaskToInstruction = (taskList: TactileTask[], InstSetParamDef: protobuf.Type): Instruction[] => {
    const instructionList: Instruction[] = [];
    taskList.forEach(task => {
        const instruction = {
            setParameter: {
                channelId: task.channelId,
                intensity: task.intensity
            }
        }
        var errMsg = InstSetParamDef.verify(instruction);
        if (errMsg) {
            throw Error(errMsg);
        }

        instructionList.push(instruction)
    });
    return instructionList
}

/**
 * method to controll the vibrotactile device
 * it needed the peripheral, with the specicic characteristic
 * and a custom format for the vibrotactile instructions, 
 * it will transform it to the VTProto format and will use the characteristic to controll the device 
 */
export const executeInstruction = (device: Peripheral, taskList: TactileTask[]) => {

    const service = device.services.find((x) => x.uuid === tactileDisplayService.service.uuid)

    if (service !== undefined) {
        const characteristic = service.characteristics.find((characteristic) => characteristic.uuid === tactileDisplayService.characteristics!.vtprotoBuffer.uuid);
        if (characteristic !== undefined) {
            //TODO Change from building protobuf to building an array of uint8_t
            /* 1. Create an array of n uint8_t values
               2. Iterate through all tactileTasks
               3. Write in each iteration the new channel value into the array
               4. Send the array to device (/and other clients)?
             */

            //TODO Change hardcoded number to channel variable in in vue store
            let output = new Uint8Array(5).fill(255);

            const map = (value: number, x1: number, y1: number, x2: number, y2: number) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
            taskList.forEach(task => {
                console.log("Channel id: ", task.channelId)
                const intensity = map((task.intensity * 100), 0, 100, 0, 254)
                output[task.channelId] = intensity;
            })
            // console.log("new output array: ");
            // console.log(output);
            const buf = Buffer.from(output);
            characteristic.write(buf, false, (error) => {
                //go always in this callback if error is null;all is fine

                // console.log(buf);
                if (error !== null) {
                    console.log("Error sending data")
                    console.log(error)
                    throw error;
                }

            });
        }
    }
}