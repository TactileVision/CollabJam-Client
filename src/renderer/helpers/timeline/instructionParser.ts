import config from "@/renderer/helpers/timeline/config";
import {
  isInstructionSetParameter,
  isInstructionWait,
  TactonInstruction,
} from "@sharedTypes/tactonTypes";
import { Store, useStore } from "@/renderer/store/store";
import { BlockDTO, BlockData } from "@/renderer/helpers/timeline/types";

interface BlockEvent {
  time: number;
  trackId: number;
  intensity: number;
  uuid: string;
  groupUuid: string | null;
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
        const uuids: string[] = instruction.setParameter.uuids;
        const groupUuid: (string | null)[] =
          instruction.setParameter.groupUuids;
        channels.forEach((channel: number, index: number): void => {
          const existing = activeChannels.get(channel);

          // finish construction of previous block, if existing
          if (existing) {
            const block: BlockData = {
              trackId: channel,
              startTime: existing.startTime,
              endTime: currentTime,
              intensity: existing.intensity,
              uuid: uuids[index],
              groupUuid: groupUuid[index],
            };
            blocks.push(block);
            activeChannels.delete(channel);
          }

          if (intensity > 0) {
            // start of block
            activeChannels.set(channel, { startTime: currentTime, intensity });
          }
        });
      } else if (isInstructionWait(instruction)) {
        currentTime += instruction.wait.miliseconds;
      }
    });

    return { blockData: blocks, duration: currentTime };
  }
  public parseBlocksToInstructions(): TactonInstruction[] {
    const sequence: BlockDTO[] = [];
    Object.values(this.store.state.timeline.blocks).forEach(
      (blocks: BlockDTO[]) =>
        blocks.forEach((block: BlockDTO) => sequence.push(block)),
    );

    const timelineWidth: number = this.store.state.timeline.canvasWidth;
    const totalDuration: number =
      (timelineWidth / config.pixelsPerSecond) * 1000;

    const events: BlockEvent[] = [];
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

      const intensity: number = block.rect.height / config.maxBlockHeight;
      events.push({
        time: startTime,
        trackId: block.trackId,
        intensity,
        uuid: block.uuid,
        groupUuid: block.groupUuid,
      });
      events.push({
        time: endTime,
        trackId: block.trackId,
        intensity: 0,
        uuid: block.uuid,
        groupUuid: block.groupUuid,
      });
    });

    // sort once
    events.sort(
      (a: BlockEvent, b: BlockEvent) =>
        a.time - b.time || a.intensity - b.intensity || a.trackId - b.trackId,
    );

    const instructions: TactonInstruction[] = [];
    let currentTime: number = 0;
    let i: number = 0;

    while (i < events.length) {
      const time: number = events[i].time;
      if (time > currentTime) {
        instructions.push({ wait: { miliseconds: time - currentTime } });
        currentTime = time;
      }

      // gather instructions with equal timing
      let j: number = i;
      while (j < events.length && this.nearlyEqual(events[j].time, time)) j++;
      const group: BlockEvent[] = events.slice(i, j);

      // end-instructions (intensity === 0)
      const ends: BlockEvent[] = group.filter(
        (ev: BlockEvent): boolean => ev.intensity === 0,
      );
      if (ends.length) {
        instructions.push({
          setParameter: {
            intensity: 0,
            channels: ends.map((e: BlockEvent) => e.trackId),
            uuids: ends.map((e: BlockEvent) => e.uuid),
            groupUuids: ends.map((e: BlockEvent) => e.groupUuid),
          },
        });
      }

      // start-instructions, grouped by intensity
      const starts: BlockEvent[] = group.filter((ev) => ev.intensity > 0);
      if (starts.length) {
        starts
          .sort((a: BlockEvent, b: BlockEvent) => a.intensity - b.intensity)
          .reduce((map: Map<number, BlockEvent[]>, ev: BlockEvent) => {
            if (!map.has(ev.intensity)) {
              map.set(ev.intensity, []);
            }
            map.get(ev.intensity)!.push(ev);
            return map;
          }, new Map<number, BlockEvent[]>())
          .forEach((evs: BlockEvent[], intensity: number): void => {
            instructions.push({
              setParameter: {
                intensity,
                channels: evs.map((e: BlockEvent) => e.trackId),
                uuids: evs.map((e: BlockEvent) => e.uuid),
                groupUuids: evs.map((e: BlockEvent) => e.groupUuid),
              },
            });
          });
      }

      i = j;
    }

    return instructions;
  }
  private nearlyEqual(
    a: number,
    b: number,
    variance: number = 0.0001,
  ): boolean {
    return Math.abs(a - b) < variance;
  }
}
