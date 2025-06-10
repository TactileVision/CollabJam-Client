<script lang="ts">
import { defineComponent, watch } from "vue";
import { useStore } from "@/renderer/store/store";
import { Container, Graphics } from "pixi.js";
import {
  getStaticContainer,
} from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";

export default defineComponent({
  name: "TheTimelineSlider",
  props: {
    isPlaybackActive: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    let viewportWidth = store.state.timeline.canvasWidth - config.leftPadding;
    let sliderMaxWidth = store.state.timeline.canvasWidth - 2 * config.sliderHandleWidth;

    let sliderWidth = sliderMaxWidth;
    let initialSliderWidth = sliderWidth;
    let isResizingLeft = false;
    let isResizingRight = false;
    let isDraggingSlider = false;
    let initialMouseX = 0;
    let initialSliderX = config.sliderHandleWidth;
    let sliderX = initialSliderX;
    let initialZoomLevel = store.state.timeline.initialZoomLevel;
    const sliderContainer = new Container();

    //*************** init slider ***************

    // slider
    const sliderRect = new Graphics();
    sliderRect.rect(
      (store.state.timeline.canvasWidth - sliderWidth) / 2,
      0,
      sliderWidth,
      config.sliderHeight,
    );
    sliderRect.fill("rgba(18,21,24,0.46)");
    sliderRect.interactive = true;
    sliderRect.cursor = "pointer";

    // left handle
    const leftSliderHandle = new Graphics();
    leftSliderHandle.rect(0, 0, config.sliderHandleWidth, config.sliderHeight);
    leftSliderHandle.fill(config.colors.sliderHandleColor);
    leftSliderHandle.interactive = true;
    leftSliderHandle.cursor = "ew-resize";

    // right handle
    const rightSliderHandle = new Graphics();
    rightSliderHandle.rect(
      sliderRect.width + config.sliderHandleWidth,
      0,
      config.sliderHandleWidth,
      config.sliderHeight,
    );
    rightSliderHandle.fill(config.colors.sliderHandleColor);
    rightSliderHandle.interactive = true;
    rightSliderHandle.cursor = "ew-resize";

    sliderContainer.addChild(leftSliderHandle);
    sliderContainer.addChild(sliderRect);
    sliderContainer.addChild(rightSliderHandle);
    getStaticContainer().addChild(sliderContainer);

    //*************** EventListeners / Watcher ***************

    sliderRect.on("pointerdown", (event) => {
      isDraggingSlider = true;
      initialMouseX = event.data.global.x;
      initialSliderX = sliderX;

      store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      window.addEventListener("pointermove", onScale);
      window.addEventListener("pointerup", onScaleEnd);
    });

    leftSliderHandle.on("pointerdown", (event) => {
      isResizingLeft = true;
      initialMouseX = event.data.global.x;
      initialSliderWidth = sliderWidth;
      initialSliderX = sliderX;

      store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      window.addEventListener("pointermove", onScale);
      window.addEventListener("pointerup", onScaleEnd);
    });

    rightSliderHandle.on("pointerdown", (event) => {
      isResizingRight = true;
      initialMouseX = event.data.global.x;
      initialSliderWidth = sliderWidth;

      store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      window.addEventListener("pointermove", onScale);
      window.addEventListener("pointerup", onScaleEnd);
    });

    // TODO is resizing of the window also allowed?
    /*    window.addEventListener('resize', () => {
      windowWidth = pixiApp.canvas.width;
      sliderMaxWidth = windowWidth - (2 * config.sliderHandleWidth);
      viewportWidth = windowWidth - config.leftPadding;
      updateLastZoomLevel();
      updateSliderToViewport();
    });*/

    watch(
      () => store.state.timeline.horizontalViewportOffset,
      () => {
        if (isDraggingSlider || isResizingLeft || isResizingRight) return;
        updateSliderToViewport();
      },
    );

    watch(
      () => store.state.timeline.currentVirtualViewportWidth,
      () => {
        updateSliderToViewport();
      },
    );

    watch(
      () => store.state.timeline.initialZoomLevel,
      () => {
        initialZoomLevel = store.state.timeline.initialZoomLevel;
      },
    );

    watch(
      () => props.isPlaybackActive,
      () => {
        sliderContainer.children.forEach((object) => {
          object.interactive = !props.isPlaybackActive;
        });
      },
    );
    
    watch(
        () => store.state.timeline.canvasWidth,
        (newWidth: number) => {
          sliderMaxWidth = newWidth - 2 * config.sliderHandleWidth;
          viewportWidth = newWidth - config.leftPadding;
          updateLastZoomLevel();
          updateSliderToViewport();
        }
    )

    //*************** functions ***************
    async function updateLastZoomLevel(newZoomLevel?: number) {
      const lo = store.state.timeline.horizontalViewportOffset;
      const ro = getRightOverflow();

      if (!newZoomLevel) {
        // calculate zoom that can display sequence without overflow
        newZoomLevel =
          viewportWidth / store.state.timeline.initialVirtualViewportWidth;
        initialZoomLevel = newZoomLevel;
        store.dispatch(
          TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL,
          newZoomLevel,
        );
        return;
      }

      if (ro == 0 && lo == 0) {
        if (newZoomLevel > initialZoomLevel) {
          initialZoomLevel = newZoomLevel;
          store.dispatch(
            TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL,
            initialZoomLevel,
          );
        }
      }
    }
    function updateSlider() {
      sliderRect.clear();
      sliderRect.rect(sliderX, 0, sliderWidth, config.sliderHeight);
      sliderRect.fill("rgba(18,21,24,0.46)");

      leftSliderHandle.clear();
      leftSliderHandle.rect(
        sliderX - config.sliderHandleWidth,
        0,
        config.sliderHandleWidth,
        config.sliderHeight,
      );
      leftSliderHandle.fill(config.colors.sliderHandleColor);

      rightSliderHandle.clear();
      rightSliderHandle.rect(
        sliderX + sliderWidth,
        0,
        config.sliderHandleWidth,
        config.sliderHeight,
      );
      rightSliderHandle.fill(config.colors.sliderHandleColor);
    }
    function onScale(event: PointerEvent) {
      let deltaX =
        event.clientX - initialMouseX - store.state.timeline.wrapperXOffset;
      if (isResizingLeft) {
        if (initialSliderX + deltaX >= config.sliderHandleWidth) {
          sliderWidth = Math.max(
            config.sliderMinWidth,
            Math.min(initialSliderWidth - deltaX, sliderMaxWidth),
          );
          sliderX = Math.max(
            config.sliderHandleWidth,
            Math.min(
              initialSliderX + deltaX,
                store.state.timeline.canvasWidth - sliderWidth - config.sliderHandleWidth,
            ),
          );
        }
      }

      if (isResizingRight) {
        sliderWidth = Math.min(
          Math.max(initialSliderWidth + deltaX, config.sliderMinWidth),
          Math.min(
            sliderMaxWidth,
              store.state.timeline.canvasWidth - sliderX - config.sliderHandleWidth,
          ),
        );
      }

      if (isDraggingSlider) {
        sliderX = Math.max(
          config.sliderHandleWidth,
          Math.min(
            initialSliderX + deltaX,
              store.state.timeline.canvasWidth - sliderWidth - config.sliderHandleWidth,
          ),
        );
      }

      updateSlider();

      store.dispatch(TimelineActionTypes.UPDATE_ZOOM_LEVEL, calculateZoom());
      store.dispatch(
        TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
        calculateViewport(),
      );
    }
    function onScaleEnd() {
      isResizingRight = false;
      isResizingLeft = false;
      isDraggingSlider = false;
      store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
      store.dispatch(TimelineActionTypes.GET_LAST_BLOCK_POSITION);
      window.removeEventListener("pointermove", onScale);
      window.removeEventListener("pointerup", onScaleEnd);
      store.state.timeline.blockManager?.onSliderScaleEnd();
    }
    function getRightOverflow(): number {
      const lo = store.state.timeline.horizontalViewportOffset;
      const virtualViewportWidth =
        store.state.timeline.currentVirtualViewportWidth -
        config.pixelsPerSecond;
      const currentViewportSize =
        (store.state.timeline.canvasWidth - config.leftPadding) /
        store.state.timeline.zoomLevel;
      let ro =
        (virtualViewportWidth -
          currentViewportSize -
          lo / store.state.timeline.zoomLevel) *
        store.state.timeline.zoomLevel;
      const scaledPadding =
        config.pixelsPerSecond * store.state.timeline.zoomLevel;
      if (ro > -scaledPadding) {
        ro += scaledPadding;
      }
      return Math.max(0, ro);
    }
    function updateSliderToViewport() {
      const lo = store.state.timeline.horizontalViewportOffset;
      const ro = getRightOverflow();

      const currentViewportWidth = store.state.timeline.canvasWidth + lo + ro;
      const currentViewportRatio = store.state.timeline.canvasWidth / currentViewportWidth;

      sliderWidth = sliderMaxWidth * currentViewportRatio;
      sliderX =
        (lo / currentViewportWidth) * sliderMaxWidth + config.sliderHandleWidth;
      updateSlider();
    }
    function calculateZoom(): number {
      const sliderRatio = sliderWidth / sliderMaxWidth;
      const visibleLength =
        store.state.timeline.currentVirtualViewportWidth * sliderRatio;
      return viewportWidth / visibleLength;
    }
    function calculateViewport(): number {
      const leftHandleSpace = sliderX - config.sliderHandleWidth;
      const newOffset =
        leftHandleSpace *
        (store.state.timeline.initialVirtualViewportWidth / sliderWidth);
      return newOffset * initialZoomLevel;
    }
  },
});
</script>

<style scoped lang="scss"></style>
