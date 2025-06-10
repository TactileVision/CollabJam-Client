<script lang="ts">
import {defineComponent, watch} from "vue";
import {Tacton} from "@sharedTypes/tactonTypes";
import {useStore} from "@/renderer/store/store";
import {InstructionParser} from "@/renderer/helpers/timeline/instructionParser";
import {BlockManager} from "@/renderer/helpers/timeline/blockManager";
import {TimelineActionTypes} from "@/renderer/store/modules/timeline/actions";
import {clearPixiApp, createPixiApp, getDynamicContainer,} from "@/renderer/helpers/timeline/pixiApp";
import {Container, Graphics, Text} from "pixi.js";
import config from "@/renderer/helpers/timeline/config";
import TheTimelineGrid from "@/renderer/components/TheTimelineGrid.vue";
import TheTimelineSlider from "@/renderer/components/TheTimelineSlider.vue";
import TheCursorPositionIndicator from "@/renderer/components/TheCursorPositionIndicator.vue";
import TheTimelineScrollbar from "@/renderer/components/TheTimelineScrollbar.vue";
import {BlockData} from "@/renderer/helpers/timeline/types";

export default defineComponent({
  name: "TheTimeline",
  components: {
    TheTimelineScrollbar,
    TheCursorPositionIndicator,
    TheTimelineSlider,
    TheTimelineGrid,
  },
  data() {
    return {
      blockManager: null as BlockManager | null,
      parser: new InstructionParser(),
      store: useStore(),
      trackCount: 0,
      mounted: false,
      tracks: [] as Container[],
    };
  },
  computed: {
    tacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
  },
  methods: {
    renderTrackLines() {
      // clear rendered tracks
      // TODO improve, only delete those not needed 
      // (e.g. after removing one track, or loading new tacton that has less tracks)
      for (const trackContainer of this.tracks) {
        trackContainer.destroy({ children: true });
      }      
      this.tracks = [];
      for (let i = 0; i <= this.trackCount; i++) {
        const trackContainer: Container = new Container();
        trackContainer.height = config.trackHeight;
        trackContainer.width = this.store.state.timeline.canvasWidth;
        trackContainer.y =
          config.sliderHeight +
          config.componentPadding +
          i * config.trackHeight;
        trackContainer.x = config.leftPadding;
        trackContainer.zIndex = -1;

        const trackLine = new Graphics();
        trackLine.rect(0, config.trackHeight / 2, this.store.state.timeline.canvasWidth, 2);
        trackLine.fill(config.colors.trackLineColor);
        trackContainer.addChild(trackLine);

        const trackLabel = new Text();
        trackLabel.text = i;
        trackLabel.style.fontSize = 18;
        trackLabel.x = -(config.leftPadding / 2) - trackLabel.width / 2;
        trackLabel.y = config.trackHeight / 2 - trackLabel.height / 2;
        trackContainer.addChild(trackLabel);

        getDynamicContainer().addChild(trackContainer);
        this.tracks.push(trackContainer);
      }
    },
    calculateInitialZoom(duration: number) {
      const viewportWidth = this.store.state.timeline.canvasWidth - config.leftPadding;
      const durationInSeconds = duration / 1000;
      const durationInPixels =
        durationInSeconds * config.pixelsPerSecond + config.pixelsPerSecond;
      const zoom = viewportWidth / durationInPixels;

      console.debug("viewportWidth", viewportWidth);
      console.debug("totalDuration:", durationInSeconds.toFixed(2), "s");
      console.debug("durationInPixels", durationInPixels);
      console.debug("zoom: ", zoom);

      this.store.dispatch(
        TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
        0,
      );
      this.store.dispatch(
        TimelineActionTypes.UPDATE_INITIAL_VIRTUAL_VIEWPORT_WIDTH,
        durationInPixels,
      );
      this.store.dispatch(
        TimelineActionTypes.UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH,
        durationInPixels,
      );
      this.store.dispatch(TimelineActionTypes.UPDATE_ZOOM_LEVEL, zoom);
      this.store.dispatch(TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL, zoom);
    },
  },
  watch: {
    async tacton() {
      if (this.tacton) {
        // parse instructions
        const parsed = this.parser.parseInstructionsToBlocks(
          this.tacton.instructions,
        );
        const blockData: BlockData[] = parsed.blockData;
        
        if (this.store.state.timeline.blockManager == null) {
          await createPixiApp();
          // create blockManager --> depends on the existence of canvas
          this.store.dispatch(TimelineActionTypes.SET_BLOCK_MANAGER, new BlockManager());
        }

        // set initZoom
        this.calculateInitialZoom(parsed.duration);

        // calculated trackCount
        this.trackCount = Math.max(
          ...blockData.map((block: BlockData) => block.trackId),
        );
        this.store.dispatch(
          TimelineActionTypes.SET_TRACK_COUNT,
          this.trackCount,
        );

        // set visible height --> depends on trackCount
        const visibleHeight =
          window.innerHeight -
          this.store.state.timeline.wrapperYOffset -
          config.sliderHeight;
        this.store.dispatch(
          TimelineActionTypes.SET_VISIBLE_HEIGHT,
          visibleHeight,
        );
        this.store.dispatch(TimelineActionTypes.CALCULATE_SCROLLABLE_HEIGHT);

        // create blocks
        this.store.state.timeline.blockManager?.createBlocksFromData(blockData);

        // render trackLines
        this.renderTrackLines();

        // TODO remove - just for debugging
        this.store.dispatch(TimelineActionTypes.TOGGLE_EDIT_STATE, true);

        // render components
        this.mounted = true;
      }
    },
  },
  mounted() {
    watch(() => this.store.state.timeline.canvasWidth, (newWidth: number) => {
      for (const trackLine of this.tracks) {
        trackLine.width = newWidth;
      }
    });
  },
  beforeUnmount() {
    clearPixiApp();
    this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS); 
    this.store.dispatch(TimelineActionTypes.SET_BLOCK_MANAGER, undefined);
  },
});
</script>

<template>
  <div id="timelineCanvas" class="position-relative"></div>
  <template v-if="mounted">
    <TheCursorPositionIndicator></TheCursorPositionIndicator>
    <TheTimelineSlider :is-playback-active="false"></TheTimelineSlider>
    <TheTimelineGrid></TheTimelineGrid>
    <TheTimelineScrollbar></TheTimelineScrollbar>
  </template>
</template>

<style scoped lang="scss"></style>
