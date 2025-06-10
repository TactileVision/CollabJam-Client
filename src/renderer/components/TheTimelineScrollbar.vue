<script lang="ts">
import { defineComponent, onMounted, watch } from "vue";
import { Store, useStore } from "@/renderer/store/store";
import {
  getDynamicContainer, getPixiApp,
} from "@/renderer/helpers/timeline/pixiApp";
import config from "@/renderer/helpers/timeline/config";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import { Graphics } from "pixi.js";

export default defineComponent({
  name: "TheTimelineScrollbar",
  setup() {
    const store: Store = useStore();
    
    const scrollBar = new Graphics();
    scrollBar.rect(
        store.state.timeline.canvasWidth - config.scrollBarWidth,
      config.sliderHeight,
      config.scrollBarWidth,
      config.scrollBarHeight,
    );
    scrollBar.fill(config.colors.tactonColor);
    scrollBar.interactive = true;
    scrollBar.cursor = "pointer";
    scrollBar.alpha = config.scrollBarPassiveAlpha;
    scrollBar.visible = false;
    getPixiApp().stage.addChild(scrollBar);

    let isDragging = false;
    let isScrollable = false;
    let startY = 0;
    let initialScrollY = 0;
    let scrollOffset = 0;
    let maxY = 0;
    let initialCanvasWidth = store.state.timeline.canvasWidth;

    watch(
      () => store.state.timeline.trackCount,
      () => {
        checkForScrollable();
        updateScrollbar();
      },
    );
    
    watch(
        () => store.state.timeline.canvasWidth, 
        (newWidth: number) => {
          scrollBar.x = newWidth - initialCanvasWidth;
      },
    );

    onMounted(() => {
      maxY =
        window.innerHeight -
        store.state.timeline.wrapperYOffset -
        config.scrollBarHeight -
        config.sliderHeight;
      checkForScrollable();
    });

    scrollBar.on("pointerdown", (event) => {
      store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, true);
      isDragging = true;
      startY = event.data.global.y;
      initialScrollY = scrollBar.y;
      scrollBar.alpha = 1;
    });

    window.addEventListener("pointermove", (event) => {
      if (isDragging) {
        const deltaY = event.clientY - startY - store.state.timeline.wrapperYOffset;
        const newY = initialScrollY + deltaY;
        scrollBar.y = Math.min(Math.max(newY, 0), maxY);
        const scrollRatio = scrollBar.y / maxY;
        scrollOffset = scrollRatio * store.state.timeline.scrollableHeight;
        getDynamicContainer().y = -scrollOffset;
      }
    });

    window.addEventListener("pointerup", () => {
      if (isDragging) {
        store.dispatch(TimelineActionTypes.SET_INTERACTION_STATE, false);
        isDragging = false;
        scrollBar.alpha = config.scrollBarPassiveAlpha;
        initialScrollY = scrollBar.y;
      }
    });

    getPixiApp().canvas.addEventListener("wheel", (event: WheelEvent) => {
      if (!isScrollable) return;
      if (isNaN(initialScrollY)) initialScrollY = 0;
      scrollBar.y = Math.min(Math.max(initialScrollY + event.deltaY, 0), maxY);
      initialScrollY = scrollBar.y;
      const scrollRatio = scrollBar.y / maxY;
      scrollOffset = scrollRatio * store.state.timeline.scrollableHeight;
      getDynamicContainer().y = -scrollOffset;
    });
    function checkForScrollable() {
      if (store.state.timeline.scrollableHeight > 0 && !isScrollable) {
        isScrollable = true;
        scrollBar.y = 0;
        scrollBar.visible = true;
      } else if (store.state.timeline.scrollableHeight <= 0 && isScrollable) {
        isScrollable = false;
        scrollBar.visible = false;
        getDynamicContainer().y = 0;
      }
    }
    function updateScrollbar() {
      scrollOffset = Math.min(
        scrollOffset,
        store.state.timeline.scrollableHeight,
      );
      scrollBar.y =
        (scrollOffset / store.state.timeline.scrollableHeight) *
        (store.state.timeline.visibleHeight -
          scrollBar.height +
          config.componentPadding);
      getDynamicContainer().y = -scrollOffset;
    }

    watch(
      () => store.state.timeline.verticalViewportOffset,
      (newOffset) => {
        scrollOffset = -newOffset;
        updateScrollbar();
      },
    );
  },
});
</script>

<style scoped lang="scss"></style>
