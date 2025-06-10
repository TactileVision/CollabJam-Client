<script lang="ts">
import { defineComponent, watch } from "vue";
import { Store, useStore } from "@/renderer/store/store";
import {getDynamicContainer, getPixiApp} from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { Graphics } from "pixi.js";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";

export default defineComponent({
  name: "TheCursorPositionIndicator",
  setup() {
    const store: Store = useStore();
    const positionIndicator = new Graphics();
    let showIndicator: boolean = true;
    let lastX: number = 0;
    let lastY: number = 0;
    let animationFrameId: number | null = null;
    getDynamicContainer().addChild(positionIndicator);
    renderIndicator();

    watch(
      () => store.state.timeline.trackCount,
      () => {
        renderIndicator();
      },
    );

    getPixiApp().canvas.addEventListener("pointermove", (event: PointerEvent) => {
      if (animationFrameId != null) return;
      
      animationFrameId = requestAnimationFrame(() => {
        renderIndicator(
            event.clientX - store.state.timeline.wrapperXOffset,
            event.clientY,
        );
        
        animationFrameId = null;
      });
    });
    function renderIndicator(newX?: number, newY?: number) {
      if (!newX) {
        newX = lastX;
      } else {
        lastX = newX;
      }

      if (!newY) {
        newY = lastY;
      } else {
        lastY = newY;
      }

      store.dispatch(TimelineActionTypes.UPDATE_CURRENT_CURSOR_POSITION, {
        x: newX,
        y: newY,
      });

      positionIndicator.clear();
      if (showIndicator) {
        positionIndicator.moveTo(
          newX,
          config.sliderHeight + config.componentPadding,
        );
        positionIndicator.lineTo(
          newX,
          config.trackHeight * (store.state.timeline.trackCount + 1) +
            config.sliderHeight +
            config.componentPadding,
        );
        positionIndicator.stroke({ width: 4, color: "rgba(0,0,0,0.1)" });
        positionIndicator._zIndex = -1;
      }
    }

    return {
      renderIndicator,
    };
  },
  watch: {
    trackCount: "renderIndicator",
  },
});
</script>

<style scoped lang="scss"></style>
