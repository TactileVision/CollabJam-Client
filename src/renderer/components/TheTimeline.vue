<script lang="ts">
import {defineComponent, watch} from "vue";
import {Tacton} from "@sharedTypes/tactonTypes";
import {useStore} from "@/renderer/store/store";
import {InstructionParser} from "@/renderer/helpers/timeline/instructionParser";
import {BlockManager} from "@/renderer/helpers/timeline/blockManager";
import {TimelineActionTypes} from "@/renderer/store/modules/timeline/actions";
import {clearPixiApp, createPixiApp, getDynamicContainer, getLiveContainer,} from "@/renderer/helpers/timeline/pixiApp";
import * as PIXI from "pixi.js";
import {Container, Graphics, Text} from "pixi.js";
import config from "@/renderer/helpers/timeline/config";
import TheTimelineGrid from "@/renderer/components/TheTimelineGrid.vue";
import TheTimelineSlider from "@/renderer/components/TheTimelineSlider.vue";
import TheCursorPositionIndicator from "@/renderer/components/TheCursorPositionIndicator.vue";
import TheTimelineScrollbar from "@/renderer/components/TheTimelineScrollbar.vue";
import {BlockData, Cursor, TimelineEvents} from "@/renderer/helpers/timeline/types";
import {InteractionMode} from "@sharedTypes/roomTypes";
import {TactonSettingsActionTypes} from "@/renderer/store/modules/collaboration/tactonSettings/tactonSettings";
import {WebSocketAPI} from "@/main/WebSocketManager";
import {LiveBlockBuilder} from "@/renderer/helpers/timeline/liveBlockBuilder";

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
      parser: new InstructionParser(),
      store: useStore(),
      trackCount: 0,
      mounted: false,
      tracks: [] as {
        line: Graphics,
        container: Container
      }[],
      cursor: null as Cursor | null,
      ticker: null as PIXI.Ticker | null,
      currentTime: 0,
      lastTactonId: null as string | null,
      lastHorizontalViewportOffset: 0,
      isSliderFollowing: false,
      liveBlockBuilder: new LiveBlockBuilder(),
      latency: 0,
      isFirstTick: false
    };
  },
  computed: {
    tacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
    interactionMode(): InteractionMode {
      return this.store.state.roomSettings.mode;
    },
  },
  methods: {
    renderTrackLines() {
      // clear rendered tracks
      // TODO improve, only delete those not needed 
      // (e.g. after removing one track, or loading new tacton that has less tracks)
      for (const track of this.tracks) {
        track.container.destroy({ children: true });
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
        trackLabel.text = i + 1;
        trackLabel.style.fontSize = 18;
        trackLabel.x = -(config.leftPadding / 2) - trackLabel.width / 2;
        trackLabel.y = config.trackHeight / 2 - trackLabel.height / 2;
        trackContainer.addChild(trackLabel);

        getDynamicContainer().addChild(trackContainer);
        this.tracks.push({
          line: trackLine,
          container: trackContainer
        });
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
    playback() {
      const x = ((this.currentTime / 1000) * (config.pixelsPerSecond * this.store.state.timeline.zoomLevel));
      this.cursor?.moveToPosition(x, this.isSliderFollowing);
      this.currentTime += this.ticker!.elapsedMS;
    },
    recording() {
      // wait for input to start live rendering
      if (!this.liveBlockBuilder.hasReceivedInput) {
        this.currentTime = 0;
      }
      
      const x = ((this.currentTime / 1000) * (config.pixelsPerSecond * this.store.state.timeline.zoomLevel));
      this.cursor?.moveToPosition(x, true);
      this.currentTime += this.ticker!.elapsedMS;

      const channels = this.store.state.tactonSettings.outputChannelState;
      this.liveBlockBuilder.processTick(channels, this.currentTime);
      
      getLiveContainer().x = - (this.store.state.timeline.horizontalViewportOffset);
    },
    overdubbing() {
      if (this.isFirstTick) {
        const now = performance.now();
        this.latency = now - this.latency;        
        //this.currentTime = -this.latency;
        console.log("latency: ",this.latency);
        this.isFirstTick = false;
      }
      
      this.currentTime += this.ticker!.elapsedMS;
      const channels = this.store.state.tactonSettings.outputChannelState;
      this.liveBlockBuilder.processTick(channels, this.currentTime);
      getLiveContainer().x = - (this.store.state.timeline.horizontalViewportOffset);
      const x = ((this.currentTime / 1000) * (config.pixelsPerSecond * this.store.state.timeline.zoomLevel));
      this.cursor?.moveToPosition(x, this.isSliderFollowing);
    },
    isTactonInViewport(): boolean {
      const lastBlockXPosition = this.store.state.timeline.lastBlockPositionX;
      const canvasWidth = this.store.state.timeline.canvasWidth;
      const horizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
      const isLastBlockOutOfViewport = lastBlockXPosition > canvasWidth;
      const isLastBlockOutOfNewViewport = (lastBlockXPosition + horizontalViewportOffset) > canvasWidth;
      return isLastBlockOutOfViewport || (horizontalViewportOffset != 0 && isLastBlockOutOfNewViewport);
    }
  },
  watch: {
    async tacton() {
      if (this.tacton) {
        if (this.lastTactonId == null || this.lastTactonId != this.tacton.uuid) {
          // clear data of blockManager and store
          this.store.state.timeline.groups.clear();
          
          // save uuid
          this.lastTactonId = this.tacton.uuid;
          
          // parse instructions
          const parsed = this.parser.parseInstructionsToBlocks(
              this.tacton.instructions,
          );
          const blockData: BlockData[] = parsed.blockData;
          
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

          this.cursor?.drawCursor();

          // render components
          this.mounted = true;
        } else {
          // TODO if block was selected, this selection is lost
          // current tacton was updated
          // parse instructions
          const parsed = this.parser.parseInstructionsToBlocks(
              this.tacton.instructions,
          );
          const blockData: BlockData[] = parsed.blockData;

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
        }
      }
    },
    interactionMode(mode) {
      //Cleanup after ending current mode by emptying the graph
      //this.clearGraph();
      // reset liveBLockBuilder
      this.liveBlockBuilder.reset();
      this.currentTime = 0;
      if (this.ticker !== null && this.ticker.count > 0) {
        this.ticker?.remove(this.recording);
        this.ticker?.remove(this.playback);
        this.ticker?.remove(this.overdubbing);
      }

      if (mode == InteractionMode.Recording) {
        // TODO set initial view for recoring (zoom = 1?, etc.)
        // TODO reload tacton after canceling recoding
        // TODO show all possible trackLInes when recording
        // TODO deselect before overdubbing
        
        this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS);
        this.store.dispatch(TactonSettingsActionTypes.instantiateArray);
        this.ticker?.add(this.recording);
        this.ticker?.start();
      } else if (mode == InteractionMode.Overdubbing) {
        if (this.tacton != null) {
          this.isSliderFollowing = this.isTactonInViewport()
          
          this.lastHorizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
          this.store.dispatch(TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET, 0);          
          this.store.dispatch(TactonSettingsActionTypes.instantiateArray);
          this.isFirstTick = true;
          this.latency = performance.now();          
          this.ticker?.add(this.overdubbing);
          this.ticker?.start();
        }
      } else if (mode == InteractionMode.Jamming) {
        // apply last horizontalViewportOffset
        this.store.dispatch(TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET, this.lastHorizontalViewportOffset);
        // reposition cursor
        this.cursor?.moveToPosition(0);
      } else if (mode == InteractionMode.Playback) {
        this.isSliderFollowing = this.isTactonInViewport();
        
        // save last horizontalViewportOffset
        this.lastHorizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
        this.store.dispatch(TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET, 0);
        
        this.ticker?.add(this.playback);
        this.ticker?.start();
      } /* else {
        //Non existent editing mode
        this.editingEnabled = true;
      } */
    }
  },
  async mounted() {
    watch(() => this.store.state.timeline.canvasWidth, (newWidth: number) => {
      for (const tracks of this.tracks) {
        tracks.line.width = newWidth;
      }
    });

    await createPixiApp();
    
    // blockManager and cursor depend on the existence of canvas
    this.store.dispatch(TimelineActionTypes.SET_BLOCK_MANAGER, new BlockManager());
    this.cursor = new Cursor(0xec660c);
    this.cursor.moveToPosition(0);
    
    this.store.state.timeline.blockManager?.eventBus.addEventListener(TimelineEvents.TACTON_WAS_EDITED, () => {
      const tacton = this.tacton
      if (tacton == null) return;

      const instructions = this.parser.parseBlocksToInstructions();

      WebSocketAPI.updateTacton({
        roomId: this.store.state.roomSettings.id || "",
        tactonId: tacton.uuid,
        tacton: { ...tacton, instructions },
      });
    });

    this.ticker = PIXI.Ticker.shared;
    this.ticker.autoStart = false;
    this.ticker.stop();
  },
  beforeUnmount() {
    clearPixiApp();
    this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS); 
    this.store.dispatch(TimelineActionTypes.SET_BLOCK_MANAGER, undefined);

    if (this.ticker !== null && this.ticker.count > 0) {
      this.ticker?.remove(this.recording);
    }
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
