import { OutputChannelState } from "@/renderer/store/modules/collaboration/tactonSettings/tactonSettings";
import { User } from "@sharedTypes/roomTypes";
import { Graphics } from "pixi.js";
import config from "@/renderer/helpers/timeline/config";
import { getLiveContainer } from "@/renderer/helpers/timeline/pixiApp";
import { useStore, Store } from "@/renderer/store/store";

type RenderedBlock = {
  graphics: Graphics;
  startTime: number;
  intensity: number;
  color: string;
  author?: User;
};
export class LiveBlockBuilder {
  private activeBlocks: Map<number, RenderedBlock> = new Map();
  private pixelsPerMillisecond: number = config.pixelsPerSecond / 1000;
  private store: Store = useStore();

  public hasReceivedInput: boolean = false;
  public processTick(
    channelStates: OutputChannelState[],
    timeSinceStartMs: number,
  ): void {
    for (const channel of channelStates) {
      const active: RenderedBlock | undefined = this.activeBlocks.get(
        channel.channelId,
      );
      const blockColor: string =
        channel.author?.color || config.colors.tactonColor;
      const authorChanged: boolean = active?.author?.id !== channel.author?.id;
      const intensityChanged: boolean = active?.intensity !== channel.intensity;
      const shouldStartNewBlock: boolean =
        !active || authorChanged || intensityChanged;
      const zoom: number = this.store.state.timeline.zoomLevel;

      if (channel.intensity > 0) {
        if (shouldStartNewBlock) {
          // remove old block if needed
          if (active) {
            this.activeBlocks.delete(channel.channelId);
          }
          console.log("start of block at ", timeSinceStartMs);
          // create new block
          const g: Graphics = new Graphics();
          g.rect(0, 0, 1, 1);
          g.fill(blockColor);
          g.x =
            config.leftPadding +
            timeSinceStartMs * this.pixelsPerMillisecond * zoom;
          g.width = zoom;
          g.height = channel.intensity * config.maxBlockHeight;
          g.y =
            config.sliderHeight +
            config.componentPadding +
            channel.channelId * config.trackHeight +
            (config.trackHeight / 2 - g.height / 2);

          getLiveContainer().addChild(g);

          this.activeBlocks.set(channel.channelId, {
            graphics: g,
            startTime: timeSinceStartMs,
            intensity: channel.intensity,
            author: channel.author,
            color: blockColor,
          });

          this.hasReceivedInput = true;
        } else if (active) {
          // extend existing block
          const g: Graphics = active.graphics;
          const y: number = g.y;

          g.clear();
          g.rect(0, 0, 1, 1);
          g.fill(active.color);

          const startX: number = active.startTime * this.pixelsPerMillisecond;
          const width: number =
            (timeSinceStartMs - active.startTime) * this.pixelsPerMillisecond;

          g.x = config.leftPadding + startX * zoom;
          g.width = width * zoom;
          g.height = active.intensity * config.maxBlockHeight;
          g.y = y;
        }
      } else if (channel.intensity === 0 && active) {
        this.activeBlocks.delete(channel.channelId);
      }
    }
  }
  public reset(): void {
    getLiveContainer().removeChildren();
    this.activeBlocks.clear();
    this.hasReceivedInput = false;
  }
}
