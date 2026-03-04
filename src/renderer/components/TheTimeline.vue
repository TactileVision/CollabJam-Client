<script lang="ts">
import {defineComponent, watch} from "vue";
import {Tacton} from "@sharedTypes/tactonTypes";
import {useStore} from "@/renderer/store/store";
import {InstructionParser} from "@/renderer/helpers/timeline/instructionParser";
import {BlockManager} from "@/renderer/helpers/timeline/blockManager";
import {TimelineActionTypes} from "@/renderer/store/modules/timeline/actions";
import {
  clearPixiApp,
  createPixiApp,
  getDynamicContainer,
  getLiveContainer,
  getStaticContainer,
} from "@/renderer/helpers/timeline/pixiApp";
import * as PIXI from "pixi.js";
import {Graphics} from "pixi.js";
import config from "@/renderer/helpers/timeline/config";
import TheTimelineGrid from "@/renderer/components/TheTimelineGrid.vue";
import TheCursorPositionIndicator from "@/renderer/components/TheCursorPositionIndicator.vue";
import TheTimelineScrollbar from "@/renderer/components/TheTimelineScrollbar.vue";
import {
  BlockData,
  BlockSelection,
  SliderStateSnapshot,
  SnackbarTexts,
  TimelineEvents
} from "@/renderer/helpers/timeline/types";
import {InteractionMode} from "@sharedTypes/roomTypes";
import {
  OutputChannelState,
  TactonSettingsActionTypes
} from "@/renderer/store/modules/collaboration/tactonSettings/tactonSettings";
import {WebSocketAPI} from "@/main/WebSocketManager";
import {LiveBlockBuilder} from "@/renderer/helpers/timeline/liveBlockBuilder";
import {PlayHead} from "@/renderer/helpers/timeline/playHead";
import {Slider} from "@/renderer/helpers/timeline/Slider";
import SnackBar from "@/renderer/components/Snackbar.vue";
import {resetLockTimer, clearLocks, stopLockTimer} from "@/renderer/helpers/timeline/lockManager";

/*
* For the upcoming demo, the reactive behaviour to the number of tracks
* used will be replaced by a fixed number (4). All lines of code that 
* have been commented out or changed in this context are marked with 
* ‘FTC’ (Fixed Track Count).
* */
export default defineComponent({
  name: "TheTimeline",
  components: {
    SnackBar,
    TheTimelineScrollbar,
    TheCursorPositionIndicator,
    TheTimelineGrid,
  },
  data() {
    return {
      parser: new InstructionParser(),
      store: useStore(),
      trackCount: 3,
      mounted: false,
      tracks: [] as {
        line: Graphics,
        indicator: Graphics
      }[],
      playHead: null as PlayHead | null,
      ticker: null as PIXI.Ticker | null,
      currentTime: 0,
      lastTactonId: null as string | null,
      sliderStateSnapshot: {} as SliderStateSnapshot,
      isSliderFollowing: false,
      liveBlockBuilder: new LiveBlockBuilder(),
      latency: 0,
      isFirstTick: false,
      canceledRecording: false,
      slider: new Slider(),
    };
  },
  computed: {
    tacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
    interactionMode(): InteractionMode {
      return this.store.state.roomSettings.mode;
    },
    isEditable(): boolean {
      return this.store.state.timeline.isEditable;
    },
    channelStates(): OutputChannelState[] {
      return [...this.store.state.tactonSettings.outputChannelState];
    },
  },
  methods: {
    renderTrackLines() {
      this.tracks = [];
      for (let i = 0; i <= this.trackCount; i++) {
        const y = config.sliderHeight +
          config.componentPadding +
          i * config.trackHeight + config.trackHeight / 2
        const trackLine = new Graphics();
        trackLine.rect(0, y, this.store.state.timeline.canvasWidth, 2);
        trackLine.fill(config.colors.trackLineColor);
        trackLine._zIndex = -1;
        
        const trackIndicator = new Graphics();
        trackIndicator.circle((config.leftPadding / 2), y, 12);
        trackIndicator.fill(config.colors.trackLineColor);
        
        this.tracks.push({
          line: getDynamicContainer().addChild(trackLine),
          indicator: getStaticContainer().addChild(trackIndicator)
        });
      }
    },
    durationToPixels(durationMs: number): number {
      const durationInSeconds = durationMs / 1000;
      return durationInSeconds * config.pixelsPerSecond + config.pixelsPerSecond;
    },
    calculateInitialZoom(durationInPixels: number): number {
      const viewportWidth = this.store.state.timeline.canvasWidth - config.leftPadding;
      return viewportWidth / durationInPixels;
    },
    playback() {
      const x = ((this.currentTime / 1000) * (config.pixelsPerSecond * this.store.state.timeline.zoomLevel));
      this.playHead?.moveToPosition(x, this.isSliderFollowing);
      this.currentTime += this.ticker!.elapsedMS;
    },
    recording() {
      // wait for input to start live rendering
      if (!this.liveBlockBuilder.hasReceivedInput) {
        this.currentTime = 0;
        this.canceledRecording = true;
      } else {
        this.canceledRecording = false;
      }

      const x = ((this.currentTime / 1000) * (config.pixelsPerSecond * this.store.state.timeline.zoomLevel));
      this.playHead?.moveToPosition(x, true);
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
        console.log("latency: ", this.latency);
        this.isFirstTick = false;
      }

      this.currentTime += this.ticker!.elapsedMS;
      const channels = this.store.state.tactonSettings.outputChannelState;
      this.liveBlockBuilder.processTick(channels, this.currentTime);
      getLiveContainer().x = - (this.store.state.timeline.horizontalViewportOffset);
      const x = ((this.currentTime / 1000) * (config.pixelsPerSecond * this.store.state.timeline.zoomLevel));
      this.playHead?.moveToPosition(x, this.isSliderFollowing);
    },
    isTactonInViewport(): boolean {
      const lastBlockXPosition = this.store.state.timeline.lastBlockPositionX;
      const canvasWidth = this.store.state.timeline.canvasWidth;
      const horizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
      const isLastBlockOutOfViewport = lastBlockXPosition > canvasWidth;
      const isLastBlockOutOfNewViewport = (lastBlockXPosition + horizontalViewportOffset) > canvasWidth;
      return isLastBlockOutOfViewport || (horizontalViewportOffset != 0 && isLastBlockOutOfNewViewport);
    },
    handleTactonWasEdited(): void {
      const tacton = this.tacton
      if (tacton == null) return;

      const instructions = this.parser.parseBlocksToInstructions();

      WebSocketAPI.updateTacton({
        roomId: this.store.state.roomSettings.id || "",
        tactonId: tacton.uuid,
        tacton: { ...tacton, instructions },
      });

      resetLockTimer();
    },
    handleSelection() {
      // add BlockUuids
      const selectedUuids: string[] = this.store.state.timeline.selectedBlocks.map((selection: BlockSelection) => {
        return selection.uuid;
      });

      WebSocketAPI.requestEditingForUuids(
          this.store.state.roomSettings.id || "",
          this.store.state.roomSettings.user.id,
          selectedUuids
      );
    },
    handleSliderInteractivityChange(e: Event) {
      const event = e as CustomEvent<boolean>;
      this.slider.setInteractivity(event.detail);
    }
  },
  watch: {
    async tacton() {
      if (this.tacton) {
        if (this.lastTactonId == null || this.lastTactonId != this.tacton.uuid) {
          // clear data of blockManager and store
          this.store.state.timeline.blockManager?.clearData();
          this.store.state.timeline.groups.clear();
          this.store.state.timeline.selectedBlocks = [];
          this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS);
          clearLocks()
          
          // save uuid
          this.lastTactonId = this.tacton.uuid;

          // parse instructions
          const parsed = this.parser.parseInstructionsToBlocks(
            this.tacton.instructions,
          );
          const blockData: BlockData[] = parsed.blockData;
          
          // set initZoom
          const durationInPixels = this.durationToPixels(parsed.duration);
          const zoom = this.calculateInitialZoom(durationInPixels);

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
          
          this.sliderStateSnapshot = {
            horizontalViewportOffset: 0, 
            initialViewportWidth: durationInPixels,
            viewportWidth: durationInPixels,
            initialZoom: zoom, 
            zoom: zoom
          }

          // FTC
          // calculated trackCount
/*          this.trackCount = Math.max(
            ...blockData.map((block: BlockData) => block.trackId),
          );
          this.store.dispatch(
            TimelineActionTypes.SET_TRACK_COUNT,
            this.trackCount,
          );*/

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

          // FTC
          // render trackLines
          //this.renderTrackLines();

          // TODO remove - just for debugging
          this.store.dispatch(TimelineActionTypes.TOGGLE_EDIT_STATE, true);

          this.playHead?.drawCursor();
          this.playHead?.hide();

          // render components
          this.mounted = true;
        } else {
          // current tacton was updated
          // parse instructions
          const parsed = this.parser.parseInstructionsToBlocks(
              this.tacton.instructions,
          );
          const blockData: BlockData[] = parsed.blockData;
          
          // FTC
          // calculated trackCount
/*          this.trackCount = Math.max(
              ...blockData.map((block: BlockData) => block.trackId),
          );
          this.store.dispatch(
              TimelineActionTypes.SET_TRACK_COUNT,
              this.trackCount,
          );*/

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

          // FTC
          // render trackLines
          //this.renderTrackLines();
        }
      } else {
        this.store.state.timeline.blockManager?.clearData();
        this.store.state.timeline.groups.clear();
        this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS);
      }
    },
    interactionMode(mode) {
      // reset liveBLockBuilder
      this.liveBlockBuilder.reset();
      this.store.state.timeline.blockManager?.clearData();
      this.currentTime = 0;
      
      // clear timeout of changing mode -> selection is cleared anyways
      stopLockTimer();
      
      if (this.ticker !== null && this.ticker.count > 0) {
        this.ticker?.remove(this.recording);
        this.ticker?.remove(this.playback);
        this.ticker?.remove(this.overdubbing);
      }
      
      // clear channel state and locks
      this.store.dispatch(TactonSettingsActionTypes.clearChannelState);
      this.store.dispatch(TimelineActionTypes.CLEAR_LOCKS);
    
      if (mode == InteractionMode.Recording) {
        // store values
        this.sliderStateSnapshot.horizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
        this.sliderStateSnapshot.zoom = this.store.state.timeline.zoomLevel;
        this.sliderStateSnapshot.viewportWidth = this.store.state.timeline.currentVirtualViewportWidth;
        
        // calculate full timeline zoom
        const durationInPixels = this.durationToPixels(config.baseTrackDurationMs);
        const zoom = this.calculateInitialZoom(durationInPixels);

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

        // prepare for recording
        this.slider.setInteractivity(false);
        this.store.state.timeline.blockManager?.toggleBlockVisibility(false);
        this.slider.updateSliderToViewport();
        this.store.dispatch(TactonSettingsActionTypes.instantiateArray);
        this.canceledRecording = false;

        this.ticker?.add(this.recording);
        this.ticker?.start();
      } else if (mode == InteractionMode.Overdubbing) {
        if (this.tacton != null) {
          // store values
          this.sliderStateSnapshot.horizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
          this.sliderStateSnapshot.zoom = this.store.state.timeline.zoomLevel;

          // show full timeline
          this.store.dispatch(TimelineActionTypes.UPDATE_ZOOM_LEVEL, this.store.state.timeline.initialZoomLevel);
          this.store.dispatch(TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET, 0);
          this.slider.updateSliderToViewport();
          
          // prepare for overdubbing
          this.slider.setInteractivity(false);
          this.isSliderFollowing = this.isTactonInViewport();
          this.store.state.timeline.blockManager?.blockInteraction(true);
          this.store.dispatch(TactonSettingsActionTypes.instantiateArray);

          this.isFirstTick = true;
          this.latency = performance.now();
          this.ticker?.add(this.overdubbing);
          this.ticker?.start();
        }
      } else if (mode == InteractionMode.Jamming) {
        if (this.canceledRecording) {
          this.store.state.timeline.blockManager?.toggleBlockVisibility(true);
          this.canceledRecording = false;
        }
        
        // prepare for jamming
        this.store.state.timeline.blockManager?.blockInteraction(false);
        this.slider.setInteractivity(true);
        
        // apply last state

        this.store.dispatch(
          TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET,
          this.sliderStateSnapshot.horizontalViewportOffset
        );
        this.store.dispatch(
          TimelineActionTypes.UPDATE_INITIAL_VIRTUAL_VIEWPORT_WIDTH,
          this.sliderStateSnapshot.initialViewportWidth,
        );
        this.store.dispatch(
          TimelineActionTypes.UPDATE_CURRENT_VIRTUAL_VIEWPORT_WIDTH,
          this.sliderStateSnapshot.viewportWidth,
        );
        this.store.dispatch(
          TimelineActionTypes.UPDATE_ZOOM_LEVEL,
          this.sliderStateSnapshot.zoom
        );
        this.store.dispatch(
          TimelineActionTypes.UPDATE_INITIAL_ZOOM_LEVEL,
          this.sliderStateSnapshot.initialZoom
        );
        
        this.slider.updateSliderToViewport();
        // hide cursor
        this.playHead?.hide();
      } else if (mode == InteractionMode.Playback) {
        this.isSliderFollowing = this.isTactonInViewport();

        // store values
        this.sliderStateSnapshot.horizontalViewportOffset = this.store.state.timeline.horizontalViewportOffset;
        this.sliderStateSnapshot.zoom = this.store.state.timeline.zoomLevel;

        // prepare for playback
        this.slider.setInteractivity(false);
        this.store.state.timeline.blockManager?.blockInteraction(true);
        this.store.dispatch(TimelineActionTypes.UPDATE_HORIZONTAL_VIEWPORT_OFFSET, 0);

        this.ticker?.add(this.playback);
        this.ticker?.start();
      } /* else {
        //Non existent editing mode
        this.editingEnabled = true;
      } */
    },
    isEditable() {
      if (this.store.state.timeline.isEditable) {
        this.store.dispatch(
            TimelineActionTypes.UPDATE_SNACKBAR_TEXT,
            SnackbarTexts.TACTON_CAN_BE_EDITED()
        );
        this.store.state.timeline.blockManager?.blockInteraction(false);
      } else {
        this.store.dispatch(
          TimelineActionTypes.UPDATE_SNACKBAR_TEXT,
          SnackbarTexts.TACTON_IS_READONLY()
        );
        this.store.state.timeline.blockManager?.blockInteraction(true);
      }
    },
    channelStates() {
      this.channelStates.forEach((state) => {
        const color = state.intensity > 0 ? state.author?.color || config.colors.selectedBlockColor : "0xFFFFFF";
        this.tracks[state.channelId].indicator.tint = color as unknown as number;
      });
    },
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
    this.playHead = new PlayHead(0xec660c);
    this.playHead.moveToPosition(0);
    this.slider.initSlider();

    // FTC
    // show all tracklines
    this.trackCount = 3;
    this.store.dispatch(
        TimelineActionTypes.SET_TRACK_COUNT,
        this.trackCount,
    );
    this.renderTrackLines();
    this.playHead.drawCursor();

    this.store.state.timeline.blockManager?.eventBus.addEventListener(TimelineEvents.TACTON_WAS_EDITED, this.handleTactonWasEdited);
    this.store.state.timeline.blockManager?.eventBus.addEventListener(TimelineEvents.TACTON_BLOCK_SELECTED, this.handleSelection);
    this.store.state.timeline.blockManager?.eventBus.addEventListener(TimelineEvents.CHANGE_SLIDER_INTERACTIVITY, this.handleSliderInteractivityChange)

    this.ticker = PIXI.Ticker.shared;
    this.ticker.autoStart = false;
    this.ticker.stop();
    
    // instantiateArray to initialize computed-value channelStates
    this.store.dispatch(TactonSettingsActionTypes.instantiateArray);
  },
  beforeUnmount() {
    WebSocketAPI.requestEditingForUuids(
        this.store.state.roomSettings.id || "",
        this.store.state.roomSettings.user.id,
        []
    );

    if (this.ticker !== null && this.ticker.count > 0) {
      this.ticker?.remove(this.recording);
    }

    this.store.state.timeline.blockManager?.eventBus.removeEventListener(TimelineEvents.TACTON_WAS_EDITED, this.handleTactonWasEdited);
    this.store.state.timeline.blockManager?.eventBus.removeEventListener(TimelineEvents.TACTON_BLOCK_SELECTED, this.handleSelection)
    
    this.store.state.timeline.blockManager?.destroy();
    clearPixiApp();
    this.slider.clearSlider();
    this.store.dispatch(TimelineActionTypes.DELETE_ALL_BLOCKS);
    this.store.dispatch(TimelineActionTypes.SET_BLOCK_MANAGER, undefined);
  },
});
</script>

<template>
  <div id="timelineCanvas" class="position-relative"></div>
  <template v-if="mounted">
    <TheCursorPositionIndicator></TheCursorPositionIndicator>
    <TheTimelineGrid></TheTimelineGrid>
    <TheTimelineScrollbar></TheTimelineScrollbar>
  </template>
  <SnackBar
    :text-key="store.state.timeline.snackbarText.key"
    :text="store.state.timeline.snackbarText.text"
  ></SnackBar>  
</template>

<style scoped lang="scss"></style>
