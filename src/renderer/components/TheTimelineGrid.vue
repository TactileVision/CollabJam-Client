<script lang="ts">
import { defineComponent, watch } from "vue";
import { Container, Graphics, Text } from "pixi.js";
import {
  getDynamicContainer,
  getStaticContainer,
} from "@/renderer/helpers/timeline/pixiApp";
import config, {GridLabelStyle} from "@/renderer/helpers/timeline/config";
import { useStore, Store } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";

export default defineComponent({
  name: "TheTimelineGrid",
  setup() {
    const store: Store = useStore();
    let gridContainer: Container | null = new Container();
    let labelContainer: Container | null = new Container();
    let animationFrameId: number | null = null;

    // caches
    const gridLineCache: Record<number, Graphics> = {};
    const labelCache: Record<number, Text> = {};
    const activeTimes: Set<number> = new Set();

    // initial Setup
    gridContainer.zIndex = -1;
    getDynamicContainer().addChild(gridContainer);
    getStaticContainer().addChild(labelContainer);
    updateGrid();
    
    watch(() => [
      store.state.timeline.zoomLevel,
      store.state.timeline.horizontalViewportOffset,
      store.state.timeline.canvasWidth
    ], () => {
      if (animationFrameId != null) return;

      animationFrameId = requestAnimationFrame(() => {
        updateGrid();
        animationFrameId = null;
      });
    });
    
    watch(
      () => store.state.timeline.trackCount,
      () => {
        rerenderAllGridLines();
      },
    );
    function updateGrid() {
      const trackCount = store.state.timeline.trackCount + 1;
      const adjustedPixelsPerSecond = config.pixelsPerSecond * store.state.timeline.zoomLevel;
      const gridOffset = config.leftPadding - store.state.timeline.horizontalViewportOffset;
      const totalWidth =
          store.state.timeline.canvasWidth +
          Math.abs(store.state.timeline.horizontalViewportOffset) -
          config.leftPadding;
      const y = trackCount * config.trackHeight + config.componentPadding + config.sliderHeight;
      const interval = getOptimalInterval();
      const visibleGridLines: number[] = [];
      activeTimes.clear();

      for (
          let step = 0;
          step * interval * adjustedPixelsPerSecond < totalWidth;
          step++
      ) {
        const fullFloatTime = step * interval;
        const time = parseFloat((step * interval).toFixed(3)); // key for cache
        const x = fullFloatTime * adjustedPixelsPerSecond;
        const screenX = x + gridOffset;
        const inViewport = isInViewport(screenX, totalWidth);
        activeTimes.add(time);

        // create / update gridLines
        if (!gridLineCache[time]) {
          const line = new Graphics();
          line.moveTo(0, config.sliderHeight + config.componentPadding);
          line.lineTo(0, y);
          line.stroke({ width: 1, color: config.colors.gridColor });
          gridLineCache[time] = line;
          gridContainer!.addChild(line);
        }
        const line = gridLineCache[time];
        line.visible = inViewport;
        if (inViewport) {
          line.x = screenX;
        }

        // create / update labels
        if (!labelCache[time]) {
          const label = new Text();
          label.text = formatIntervalToLabel(fullFloatTime);
          label.style.fontSize = 12;
          label.y = config.sliderHeight + (config.componentPadding / 2 - label.height / 2);
          labelCache[time] = label;
          labelContainer!.addChild(label);
        }
        const label = labelCache[time];
        label.visible = inViewport;
        if (inViewport) {
          label.x = x - label.width / 2;
          visibleGridLines.push(screenX);
        }
      }

      // hide unused gridLines
      for (const timeStr in gridLineCache) {
        const time = parseFloat(timeStr);
        if (!activeTimes.has(time)) {
          gridLineCache[time].visible = false;
        }
      }

      // hide unused labels
      for (const timeStr in labelCache) {
        const time = parseFloat(timeStr);
        if (!activeTimes.has(time)) {
          labelCache[time].visible = false;
        }
      }

      labelContainer!.x = gridOffset;
      store.dispatch(TimelineActionTypes.UPDATE_GRID_LINES, visibleGridLines);
    }
    function isInViewport(x: number, totalWidth: number, variance: number = 100): boolean {
      return x >= -variance && x <= totalWidth + variance;
    }
    function rerenderAllGridLines() {
      if (!gridContainer) return;

      const trackCount = store.state.timeline.trackCount + 1;
      const adjustedPixelsPerSecond = config.pixelsPerSecond * store.state.timeline.zoomLevel;
      const gridOffset = config.leftPadding - store.state.timeline.horizontalViewportOffset;
      const totalWidth =
          store.state.timeline.canvasWidth +
          Math.abs(store.state.timeline.horizontalViewportOffset) -
          config.leftPadding;
      const y = trackCount * config.trackHeight + config.componentPadding + config.sliderHeight;

      for (const timeStr in gridLineCache) {
        const time = parseFloat(timeStr);
        const line = gridLineCache[time];

        const x = time * adjustedPixelsPerSecond;
        const screenX = x + gridOffset;
        const inViewport = isInViewport(screenX, totalWidth);

        // Rebuild line
        line.clear();
        line.moveTo(0, config.sliderHeight + config.componentPadding);
        line.lineTo(0, y);
        line.stroke({ width: 1, color: config.colors.gridColor });

        // Update position & visibility
        line.x = screenX;
        line.visible = inViewport;
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
    
    function formatIntervalToLabel(value: number): string {
      switch (config.gridLabelStyle) {
        case GridLabelStyle.PLAIN: 
          return value.toString();
        case GridLabelStyle.FRACTIONS:
          return toFractionString(value);
        case GridLabelStyle.Clock:
          return toTimecode(value);
      }
    }
    function toFractionString(value: number): string {
      const denominator = 1 << 8;      
      const numerator = Math.round(value * denominator);
      const whole = Math.floor(numerator / denominator);
      const remainder = numerator % denominator;

      if (remainder === 0) {
        return whole.toString();
      }
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(remainder, denominator);
      const reducedNumerator = remainder / divisor;
      const reducedDenominator = denominator / divisor;

      if (whole === 0) {
        return `${reducedNumerator}/${reducedDenominator}`;
      }
      return `${whole} ${reducedNumerator}/${reducedDenominator}`;
    }
    function toTimecode(value: number): string {      
      const seconds = Math.floor(value);
      const milliseconds = Math.round((value - seconds) * 1000);      
      const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
      const msStr = milliseconds.toString().padStart(3, '0');
      return `${secStr}:${msStr}`;
    }
  },
});
</script>

<style scoped lang="scss"></style>
