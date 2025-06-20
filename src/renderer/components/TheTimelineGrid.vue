<script lang="ts">
import { defineComponent, onUnmounted, watch } from "vue";
import { Container, Graphics, Text } from "pixi.js";
import {
  getDynamicContainer,
  getStaticContainer,
} from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { useStore, Store } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";

export default defineComponent({
  name: "TheTimelineGrid",
  setup() {
    const store: Store = useStore();
    let gridContainer: Container | null;
    let labelContainer: Container | null;
    let gridGraphics: Graphics | null;
    let rerenderLabels: boolean = true;
    let animationFrameId: number | null = null;

    renderGrid();

    watch(
      () => store.state.timeline.zoomLevel,
      () => {
        if (animationFrameId != null) return;

        animationFrameId = requestAnimationFrame(() => {
          rerenderLabels = true;
          rerenderGrid();
          animationFrameId = null;
        });
      },
    );
    watch(
      () => store.state.timeline.horizontalViewportOffset,
      () => {
        if (animationFrameId != null) return;
        
        animationFrameId = requestAnimationFrame(() => {
          rerenderLabels = true;
          rerenderGrid();
          animationFrameId = null;
        });
      },
    );
    watch(
      () => store.state.timeline.trackCount,
      () => {
        rerenderLabels = false;
        rerenderGrid();
      },
    );

    window.addEventListener("resize", () => {
      rerenderLabels = true;
      rerenderGrid();
    });

    onUnmounted(() => {
      rerenderLabels = true;
      clearGrid();
    });
    function renderGrid() {
      // +1 as first trackId is 0
      const trackCount = store.state.timeline.trackCount + 1;
      gridContainer = new Container();
      gridGraphics = new Graphics();

      if (rerenderLabels && labelContainer == null) {
        labelContainer = new Container();
      }

      const adjustedPixelsPerSecond =
        config.pixelsPerSecond * store.state.timeline.zoomLevel;
      const totalWidth = 
        store.state.timeline.canvasWidth +
        Math.abs(store.state.timeline.horizontalViewportOffset) -
        config.leftPadding;
      const gridOffset =
        config.leftPadding - store.state.timeline.horizontalViewportOffset;
      const gridLines: number[] = [];
      const y =
        trackCount * config.trackHeight +
        config.componentPadding +
        config.sliderHeight;

      const interval = getOptimalInterval();
      for (
        let step = 0;
        step * interval * adjustedPixelsPerSecond < totalWidth;
        step++
      ) {
        const time = step * interval;
        const x = time * adjustedPixelsPerSecond;

        if (x + gridOffset > 0) {
          gridLines.push(x + gridOffset);
          gridGraphics.moveTo(x, config.sliderHeight + config.componentPadding);
          gridGraphics.lineTo(x, y);
          gridGraphics.stroke({ width: 1, color: config.colors.gridColor });

          if (rerenderLabels) {
            const label = new Text();
            label.text = parseFloat(time.toFixed(3));
            label.style.fontSize = 12;
            label.x = x - label.width / 2;
            label.y =
              config.sliderHeight +
              (config.componentPadding / 2 - label.height / 2);
            labelContainer!.addChild(label);
            labelContainer!.x = gridOffset;
            getStaticContainer().addChild(labelContainer!);
          }
        }
      }

      gridContainer.addChild(gridGraphics);
      gridContainer.x = gridOffset;
      gridContainer.zIndex = -1;
      getDynamicContainer().addChild(gridContainer);
      // TODO could only update store on pointerUp
      store.dispatch(TimelineActionTypes.UPDATE_GRID_LINES, gridLines);
    }
    function rerenderGrid() {
      clearGrid();
      renderGrid();
    }
    function clearGrid() {
      if (
        gridContainer == null ||
        gridGraphics == null ||
        labelContainer == null
      )
        return;

      getDynamicContainer().removeChild(gridContainer);
      gridContainer.destroy({ children: true });
      gridContainer = null;

      if (rerenderLabels) {
        getStaticContainer().removeChild(labelContainer);
        labelContainer.destroy({ children: true });
        labelContainer = null;
      }
    }
    function getOptimalInterval(): number {
      const adjustedPixelsPerSecond =
        config.pixelsPerSecond * store.state.timeline.zoomLevel;
      const idealPixelDistance =
        (config.minLineDistance + config.maxLineDistance) / 2;
      const idealInterval = idealPixelDistance / adjustedPixelsPerSecond;
      return Math.pow(2, Math.round(Math.log2(idealInterval)));
    }
  },
});
</script>

<style scoped lang="scss"></style>
