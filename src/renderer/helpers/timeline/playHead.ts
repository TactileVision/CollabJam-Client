import * as PIXI from "pixi.js";
import { Store, useStore } from "@/renderer/store/store";
import { getDynamicContainer } from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";

export class PlayHead {
  private graphic: PIXI.Graphics = new PIXI.Graphics();
  private readonly color: number;
  private store: Store = useStore();
  constructor(color: number) {
    getDynamicContainer().addChild(this.graphic);
    this.color = color;
  }
  hide(): void {
    this.graphic.visible = false;
  }
  drawCursor(): void {
    this.graphic.clear();
    this.graphic.moveTo(
      config.leftPadding,
      config.sliderHeight + config.componentPadding,
    );
    this.graphic.lineTo(
      config.leftPadding,
      config.trackHeight * (this.store.state.timeline.trackCount + 1) +
        config.sliderHeight +
        config.componentPadding,
    );
    this.graphic.stroke({ width: 4, color: this.color });
    this.graphic._zIndex = 1;
  }
  moveToPosition(xPosition: number, isSliderFollowing: boolean = false): void {
    const middleOfCanvas: number = this.store.state.timeline.canvasWidth / 2;
    const isIndicatorAtViewportCenter: boolean =
      xPosition + config.leftPadding >= middleOfCanvas;
    if (isIndicatorAtViewportCenter && isSliderFollowing) {
      this.store.dispatch(
        TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
        xPosition + config.leftPadding - middleOfCanvas,
      );
      this.graphic.x =
        xPosition - this.store.state.timeline.horizontalViewportOffset;
    } else {
      this.graphic.x = xPosition;
    }
    this.graphic.visible = true;
  }
}
