import config from "@/renderer/helpers/timeline/config";
import {
  isInstructionSetParameter,
  isInstructionWait,
  TactonInstruction,
} from "@sharedTypes/tactonTypes";
import { Store, useStore } from "@/renderer/store/store";
import { BlockDTO, BlockData } from "@/renderer/helpers/timeline/types";
import { pixiApp } from "@/renderer/helpers/timeline/pixiApp";

interface BlockEvent {
  time: number;
  trackId: number;
  intensity: number;
}
export class InstructionParser {
  private store: Store;
  constructor() {
    this.store = useStore();
  }
  public parseInstructionsToBlocks(instructions: TactonInstruction[]): {
    blockData: BlockData[];
    duration: number;
  } {
    const blocks: BlockData[] = [];
    const activeChannels: Map<
      number,
      { startTime: number; intensity: number }
    > = new Map<number, { startTime: number; intensity: number }>();
    let currentTime: number = 0;

    instructions.forEach((instruction: TactonInstruction): void => {
      if (isInstructionSetParameter(instruction)) {
        const channels: number[] = instruction.setParameter.channels;
        const intensity: number = instruction.setParameter.intensity;

        channels.forEach((channel: number): void => {
          if (intensity > 0) {
            // start of block
            activeChannels.set(channel, { startTime: currentTime, intensity });
          } else if (intensity === 0 && activeChannels.has(channel)) {
            // end of block
            const channelData: { startTime: number; intensity: number } =
              activeChannels.get(channel)!;
            const block: BlockData = {
              trackId: channel,
              startTime: channelData.startTime,
              endTime: currentTime,
              intensity: channelData.intensity,
            };
            blocks.push(block);
            activeChannels.delete(channel);
          }
        });
      } else if (isInstructionWait(instruction)) {
        currentTime += instruction.wait.miliseconds;
      }
    });

    return { blockData: blocks, duration: currentTime };
  }

  // TODO check if this method is needed

  public parseBlocksToInstructions(): TactonInstruction[] {
    // flatten (per track) stored blocks into one sequence
    const sequence: BlockDTO[] = [];
    Object.keys(this.store.state.timeline.blocks).forEach(
      (trackIdAsString: string, trackId: number): void => {
        this.store.state.timeline.blocks[trackId].forEach(
          (block: BlockDTO): void => {
            sequence.push(block);
          },
        );
      },
    );

    const events: BlockEvent[] = [];
    const instructions: TactonInstruction[] = [];
    const timelineWidth: number = pixiApp.canvas.width;
    const totalDuration: number =
      (timelineWidth / config.pixelsPerSecond) * 1000;
    let currentTime: number = 0;

    // transform sequence into events
    sequence.forEach((block: BlockDTO): void => {
      const convertedX: number =
        (block.rect.x -
          config.leftPadding +
          this.store.state.timeline.horizontalViewportOffset) /
        this.store.state.timeline.zoomLevel;
      const convertedWidth: number =
        block.rect.width / this.store.state.timeline.zoomLevel;
      const startTime: number = (convertedX / timelineWidth) * totalDuration;
      const endTime: number =
        startTime + (convertedWidth / timelineWidth) * totalDuration;

      events.push({
        time: startTime,
        trackId: block.trackId,
        intensity: block.rect.height / config.blockHeightScaleFactor,
      });
      events.push({ time: endTime, trackId: block.trackId, intensity: 0 });
    });

    // sort events
    events.sort((a: BlockEvent, b: BlockEvent) => a.time - b.time);

    // transform events into instructions
    events.forEach((event: BlockEvent): void => {
      // insert wait-instruction if needed
      if (event.time > currentTime) {
        instructions.push({
          wait: { miliseconds: event.time - currentTime },
        });
        currentTime = event.time;
      }

      // insert set-Parameter instruction
      instructions.push({
        setParameter: {
          //startTime: currentTime,
          intensity: event.intensity,
          channels: [event.trackId],
        },
      });
    });

    return instructions;
  }
}
