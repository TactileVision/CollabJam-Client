import {
  Container,
  ContainerChild,
  FederatedPointerEvent,
  Graphics,
} from "pixi.js";
import { Store, useStore } from "@/renderer/store/store";
import config from "@/renderer/helpers/timeline/config";
import { getStaticContainer } from "@/renderer/helpers/timeline/pixiApp";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import { watch, WatchStopHandle } from "vue";
export class Slider {
  private store: Store = useStore();

  // slider values
  private viewportWidth: number = 0;
  private sliderMaxWidth: number = 0;
  private sliderWidth: number = 0;
  private initialSliderWidth: number = 0;

  // pixi components
  private sliderContainer: Container = new Container();
  private sliderRect: Graphics = new Graphics();
  private leftHandle: Graphics = new Graphics();
  private rightHandle: Graphics = new Graphics();

  // resizing vars
  private isResizingLeft: boolean = false;
  private isResizingRight: boolean = false;
  private isDraggingSlider: boolean = false;
  private initialMouseX: number = 0;
  private initialSliderX: number = config.sliderHandleWidth;
  private sliderX: number = this.initialSliderX;
  private initialZoomLevel: number = 0;

  // event throttling
  private scaleEventQueued: boolean = false;
  private lastScaleEvent: PointerEvent | null = null;

  private watcher: WatchStopHandle[] = [];
  constructor() {}

  /*
   * Initialises the timeline-slider.
   * */
  public initSlider(): void {
    console.log("initSlider");
    // set vars
    this.viewportWidth =
      this.store.state.timeline.canvasWidth - config.leftPadding;
    this.sliderMaxWidth =
      this.store.state.timeline.canvasWidth - 2 * config.sliderHandleWidth;
    this.sliderWidth = this.sliderMaxWidth;
    this.initialSliderWidth = this.sliderWidth;
    this.initialZoomLevel = this.store.state.timeline.initialZoomLevel;

    // create slider
    this.sliderRect.rect(
      (this.store.state.timeline.canvasWidth - this.sliderWidth) / 2,
      0,
      this.sliderWidth,
      config.sliderHeight,
    );
    this.sliderRect.fill("rgba(18,21,24,0.46)");
    this.sliderRect.interactive = true;
    this.sliderRect.cursor = "pointer";

    // left handle
    this.leftHandle.rect(0, 0, config.sliderHandleWidth, config.sliderHeight);
    this.leftHandle.fill(config.colors.sliderHandleColor);
    this.leftHandle.interactive = true;
    this.leftHandle.cursor = "ew-resize";

    // right handle
    this.rightHandle.rect(
      this.sliderRect.width + config.sliderHandleWidth,
      0,
      config.sliderHandleWidth,
      config.sliderHeight,
    );
    this.rightHandle.fill(config.colors.sliderHandleColor);
    this.rightHandle.interactive = true;
    this.rightHandle.cursor = "ew-resize";

    // install event-listener for slider
    this.sliderRect.on("pointerdown", (event: FederatedPointerEvent): void => {
      this.isDraggingSlider = true;
      this.initialMouseX = event.globalX;
      this.initialSliderX = this.sliderX;

      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      window.addEventListener("pointermove", this.queueScaleEvent);
      window.addEventListener("pointerup", this.onScaleEnd);
    });

    this.leftHandle.on("pointerdown", (event: FederatedPointerEvent): void => {
      this.isResizingLeft = true;
      this.initialMouseX = event.globalX;
      this.initialSliderWidth = this.sliderWidth;
      this.initialSliderX = this.sliderX;

      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      window.addEventListener("pointermove", this.queueScaleEvent);
      window.addEventListener("pointerup", this.onScaleEnd);
    });

    this.rightHandle.on("pointerdown", (event: FederatedPointerEvent): void => {
      this.isResizingRight = true;
      this.initialMouseX = event.globalX;
      this.initialSliderWidth = this.sliderWidth;

      this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      window.addEventListener("pointermove", this.queueScaleEvent);
      window.addEventListener("pointerup", this.onScaleEnd);
    });

    // install watcher
    this.watcher.push(
      watch(
        () => this.store.state.timeline.horizontalViewportOffset,
        (): void => {
          if (
            this.isDraggingSlider ||
            this.isResizingLeft ||
            this.isResizingRight
          )
            return;
          this.updateSliderToViewport();
        },
      ),
    );

    this.watcher.push(
      watch(
        () => this.store.state.timeline.currentVirtualViewportWidth,
        (): void => {
          this.updateSliderToViewport();
        },
      ),
    );

    this.watcher.push(
      watch(
        () => this.store.state.timeline.initialZoomLevel,
        (): void => {
          this.initialZoomLevel = this.store.state.timeline.initialZoomLevel;
        },
      ),
    );

    this.watcher.push(
      watch(
        () => this.store.state.timeline.canvasWidth,
        (newWidth: number): void => {
          this.sliderMaxWidth = newWidth - 2 * config.sliderHandleWidth;
          this.viewportWidth = newWidth - config.leftPadding;
          this.updateLastZoomLevel();
          this.updateSliderToViewport();
        },
      ),
    );

    // add to container
    this.sliderContainer.addChild(this.leftHandle);
    this.sliderContainer.addChild(this.sliderRect);
    this.sliderContainer.addChild(this.rightHandle);

    // add to stage
    getStaticContainer().addChild(this.sliderContainer);
  }
  private updateLastZoomLevel(newZoomLevel?: number): void {
    const lo: number = this.store.state.timeline.horizontalViewportOffset;
    const ro: number = this.getRightOverflow();

    if (!newZoomLevel) {
      // calculate zoom that can display sequence without overflow
      newZoomLevel =
        this.viewportWidth /
        this.store.state.timeline.initialVirtualViewportWidth;
      this.initialZoomLevel = newZoomLevel;
      this.store.dispatch(
        TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL,
        newZoomLevel,
      );
      return;
    }

    if (ro == 0 && lo == 0) {
      if (newZoomLevel > this.initialZoomLevel) {
        this.initialZoomLevel = newZoomLevel;
        this.store.dispatch(
          TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL,
          this.initialZoomLevel,
        );
      }
    }
  }
  private updateSlider(): void {
    this.sliderRect.clear();
    this.sliderRect.rect(
      this.sliderX,
      0,
      this.sliderWidth,
      config.sliderHeight,
    );
    this.sliderRect.fill("rgba(18,21,24,0.46)");

    this.leftHandle.clear();
    this.leftHandle.rect(
      this.sliderX - config.sliderHandleWidth,
      0,
      config.sliderHandleWidth,
      config.sliderHeight,
    );
    this.leftHandle.fill(config.colors.sliderHandleColor);

    this.rightHandle.clear();
    this.rightHandle.rect(
      this.sliderX + this.sliderWidth,
      0,
      config.sliderHandleWidth,
      config.sliderHeight,
    );
    this.rightHandle.fill(config.colors.sliderHandleColor);
  }
  private onScale(event: PointerEvent): void {
    const deltaX: number =
      event.clientX -
      this.initialMouseX -
      this.store.state.timeline.wrapperXOffset;
    if (this.isResizingLeft) {
      if (this.initialSliderX + deltaX >= config.sliderHandleWidth) {
        this.sliderWidth = Math.max(
          config.sliderMinWidth,
          Math.min(this.initialSliderWidth - deltaX, this.sliderMaxWidth),
        );
        this.sliderX = Math.max(
          config.sliderHandleWidth,
          Math.min(
            this.initialSliderX + deltaX,
            this.store.state.timeline.canvasWidth -
              this.sliderWidth -
              config.sliderHandleWidth,
          ),
        );
      }
    }

    if (this.isResizingRight) {
      this.sliderWidth = Math.min(
        Math.max(this.initialSliderWidth + deltaX, config.sliderMinWidth),
        Math.min(
          this.sliderMaxWidth,
          this.store.state.timeline.canvasWidth -
            this.sliderX -
            config.sliderHandleWidth,
        ),
      );
    }

    if (this.isDraggingSlider) {
      this.sliderX = Math.max(
        config.sliderHandleWidth,
        Math.min(
          this.initialSliderX + deltaX,
          this.store.state.timeline.canvasWidth -
            this.sliderWidth -
            config.sliderHandleWidth,
        ),
      );
    }

    this.updateSlider();

    this.store.dispatch(
      TimelineActionTypes.UPDATE_ZOOM_LEVEL,
      this.calculateZoom(),
    );
    this.store.dispatch(
      TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
      this.calculateViewport(),
    );
  }
  private getRightOverflow(): number {
    const lo: number = this.store.state.timeline.horizontalViewportOffset;
    const virtualViewportWidth: number =
      this.store.state.timeline.currentVirtualViewportWidth -
      config.pixelsPerSecond;
    const currentViewportSize: number =
      (this.store.state.timeline.canvasWidth - config.leftPadding) /
      this.store.state.timeline.zoomLevel;
    let ro: number =
      (virtualViewportWidth -
        currentViewportSize -
        lo / this.store.state.timeline.zoomLevel) *
      this.store.state.timeline.zoomLevel;
    const scaledPadding: number =
      config.pixelsPerSecond * this.store.state.timeline.zoomLevel;
    if (ro > -scaledPadding) {
      ro += scaledPadding;
    }
    return Math.max(0, ro);
  }
  private updateSliderToViewport(): void {
    const lo: number = this.store.state.timeline.horizontalViewportOffset;
    const ro: number = this.getRightOverflow();

    const currentViewportWidth: number =
      this.store.state.timeline.canvasWidth + lo + ro;
    const currentViewportRatio: number =
      this.store.state.timeline.canvasWidth / currentViewportWidth;

    this.sliderWidth = this.sliderMaxWidth * currentViewportRatio;
    this.sliderX =
      (lo / currentViewportWidth) * this.sliderMaxWidth +
      config.sliderHandleWidth;
    this.updateSlider();
  }
  private calculateZoom(): number {
    const sliderRatio: number = this.sliderWidth / this.sliderMaxWidth;
    const visibleLength: number =
      this.store.state.timeline.currentVirtualViewportWidth * sliderRatio;
    return this.viewportWidth / visibleLength;
  }
  private calculateViewport(): number {
    const leftHandleSpace: number = this.sliderX - config.sliderHandleWidth;
    const newOffset: number =
      leftHandleSpace *
      (this.store.state.timeline.initialVirtualViewportWidth /
        this.sliderWidth);
    return newOffset * this.initialZoomLevel;
  }

  // TODO visualize interactivity
  public setInteractivity(isInteractive: boolean): void {
    this.sliderContainer.children.forEach((child: ContainerChild): void => {
      child.interactive = isInteractive;
    });
  }
  private queueScaleEvent = (event: PointerEvent): void => {
    this.lastScaleEvent = event;

    if (!this.scaleEventQueued) {
      this.scaleEventQueued = true;
    }

    requestAnimationFrame(() => {
      this.scaleEventQueued = false;
      if (this.lastScaleEvent) {
        //console.log("A");
        this.onScale(this.lastScaleEvent);
        this.lastScaleEvent = null;
      }
    });
  };
  private onScaleEnd = (): void => {
    this.isResizingRight = false;
    this.isResizingLeft = false;
    this.isDraggingSlider = false;
    this.store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
    this.store.dispatch(TimelineActionTypes.GET_LAST_BLOCK_POSITION);
    window.removeEventListener("pointermove", this.queueScaleEvent);
    window.removeEventListener("pointerup", this.onScaleEnd);
    this.store.state.timeline.blockManager?.onSliderScaleEnd();
  };
  public clearSlider(): void {
    this.watcher.forEach((stopWatching: WatchStopHandle): void => {
      stopWatching();
    });
    this.watcher = [];
  }
}
