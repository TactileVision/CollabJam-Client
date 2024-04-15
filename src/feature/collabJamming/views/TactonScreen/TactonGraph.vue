<template>
  <div id="tactonDisplay"></div>
</template>

<script lang="ts">
import * as PIXI from "pixi.js";
import "pixi.js/unsafe-eval";
import { defineComponent } from "vue";
import { useStore } from "@/app/store/store";
import {
  TactonSettingsActionTypes,
  OutputChannelState,
} from "@/feature/collabJamming/store/tactonSettings/tactonSettings";
import { User, InteractionMode } from "@sharedTypes/roomTypes";
import {
  Tacton,
  TactonInstruction,
  isInstructionSetParameter,
  getDuration,
  isInstructionWait,
  GraphBlock,
  StretchDirection,
} from "@sharedTypes/tactonTypes";
import { toRaw } from "vue";
import { sendSocketMessage } from "@/core//WebSocketManager";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";

interface IntensityObject {
  intensity: number;
  author?: User;
  startTime?: number;
  endTime?: number;
  index?: number;
  object?: PIXI.Graphics;
}
interface GraphicObject {
  channelId: number;
  container: PIXI.Container;
}
interface ChannelGraph extends GraphicObject {
  intensities: IntensityObject[];
}
class Cursor {
  graphic: PIXI.Graphics = new PIXI.Graphics();
  container: PIXI.Container = new PIXI.Container();
  position = 0;
  hasDrawnCursor = false;
  color: number;

  constructor(color: number) {
    this.container.addChild(this.graphic);
    this.color = color;
  }

  getContainer(): PIXI.Container {
    return this.container;
  }

  drawCursor(height: number) {
    // this.graphic.beginFill(this.color);
    // this.graphic.drawRect(0, 0, 2, height);
    this.graphic.setFillStyle({ color: this.color, matrix: new PIXI.Matrix() });
    this.graphic.rect(0, 0, 2, height).fill();
    this.hasDrawnCursor = true;
  }
  moveToPosition(xPosition: number) {
    this.container.position.set(xPosition, 0);
  }
}

export default defineComponent({
  name: "TactonGraph",
  props: {
    isMounted2: {
      type: Boolean,
    },
  },
  data() {
    return {
      pixiApp: null as PIXI.Application | null,
      // pixiApp: null as PIXI.Application<HTMLCanvasElement> | null,
      graphContainer: null as PIXI.Container | null,
      channelGraphs: [] as ChannelGraph[],
      coordinateContainer: null as PIXI.Container | null,
      legendLabels: [] as GraphicObject[],
      maskIndex: -1,
      ticker: null as PIXI.Ticker | null,
      store: useStore(),
      width: {
        original: -1,
        actual: -1,
      },
      height: {
        original: -1,
        actual: -1,
      },
      paddingRL: 32,
      growRatio: 0,
      currentTime: 0,
      dropdownDisabled: false,
      cursor: new Cursor(0xec660c),
      endOfTactonIndicator: new Cursor(0x83be63),
      selectedBlock: null as {
        moving: boolean;
        channel: number;
        index: number;
        container: PIXI.Container;
      } | null,
      currentStretch: null as {
        channel: number;
        index: number;
        previousScale: number;
        block: PIXI.Container;
        direction: StretchDirection;
      } | null,
      blocksByChannel: [] as GraphBlock[][],
      isMounted: false,
    };
  },
  computed: {
    maxDurationStore(): number {
      return this.store.state.roomSettings.maxDuration;
    },
    newStoreItem(): boolean {
      return this.store.state.tactonSettings.trackStateChanges;
    },
    interactionMode(): InteractionMode {
      return this.store.state.roomSettings.mode;
    },
    tacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
    numberOfOutputs(): number {
      return this.store.getters.getNumberOfOutputs;
    },
    playbackTime(): number {
      return this.store.state.tactonPlayback.playbackTime;
    },
  },
  watch: {
    //start to drawing if all components are mounted
    isMounted(newVal, oldVal) {
      if (newVal == true && newVal !== oldVal) this.resizeScreen();
    },
    //change the max Duration of the time profiles, if there are changes
    maxDurationStore() {
      this.calcLegend();
      this.growRatio =
        (this.width.original - 2 * this.paddingRL) / this.maxDurationStore;
      this.resizeRectangles();
    },
    //update store from server, response retrieved
    interactionMode(mode) {
      if (mode == InteractionMode.Recording) {
        //Coming into recording mode
        this.store.dispatch(TactonSettingsActionTypes.instantiateArray);
        this.clearGraph();
        this.ticker?.start();
      } else {
        this.ticker?.stop();
        this.ticker?.remove(this.loop);

        if (mode == InteractionMode.Jamming) {
          this.cursor.moveToPosition(0);
        }
      }
    },
    tacton(tacton) {
      console.log("Tacton");
      console.log(this);

      if (tacton == null) return;
      const t = tacton as Tacton;
      this.clearGraph();
      this.drawStoredGraph(t.instructions);
      this.endOfTactonIndicator.moveToPosition(
        getDuration(tacton) * this.growRatio + this.paddingRL,
      );
      this.endOfTactonIndicator.drawCursor(this.height.actual);
      this.graphContainer?.addChild(this.endOfTactonIndicator.getContainer());
    },
    playbackTime(time) {
      console.log(time);
      // this.cursor.moveToPosition(time * this.growRatio + this.paddingRL)
      this.positionCursor(time);
    },
  },
  async mounted() {
    try {
      //listener to recalculate time profiles
      window.addEventListener("resize", this.resizeScreen);

      // PIXI.Program.defaultFragmentPrecision = PRECISION.HIGH;
      // this.pixiApp = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
      this.pixiApp = new PIXI.Application();
      await this.pixiApp.init({
        backgroundAlpha: 0,
        // antialias: true,
      });

      this.pixiApp.stage.eventMode = "static";
      this.pixiApp.stage.hitArea = this.pixiApp.screen;

      for (const handler of [this.moveBlockEnd, this.stretchBlockEnd]) {
        this.pixiApp.canvas.addEventListener("pointerup", handler);
        this.pixiApp.canvas.addEventListener("pointerupoutside", handler);
      }

      document
        .getElementById("tactonDisplay")
        ?.appendChild(this.pixiApp.canvas);
      /**
       * create ticker for animation
       */
      this.ticker = PIXI.Ticker.shared;
      this.ticker.autoStart = false;
      this.ticker.stop();
      this.store.dispatch(TactonSettingsActionTypes.instantiateArray);

      // //start the initial resize screen
      this.isMounted = true;
      if (this.isMounted) this.resizeScreen();
    } catch (e) {
      console.log(e);
    }
  },
  beforeUnmount() {
    //remove listener and loop if the component is clossed
    if (this.ticker !== null && this.ticker.count > 0)
      this.ticker?.remove(this.loop);

    this.pixiApp?.destroy(false, { children: true });
    window.removeEventListener("resize", this.resizeScreen);
    document.removeEventListener("keydown", this.handleBlockKeyDown);
    document.removeEventListener("pointerdown", this.unselectBlock);
  },
  methods: {
    resizeScreen() {
      /**
       * be aware that changing the width will apply a scaling factor in the background
       * this means you have never to update the width or height for your calculation
       * you will calculate the original position, width still and the scaling will position it relative
       */
      const newWidth = document.getElementById("tactonScreen")!.clientWidth;
      const newHeight =
        document.getElementById("tactonScreenHeight")!.clientHeight;
      // window.innerHeight -
      // document.getElementById("tactonHeader")!.clientHeight -
      // document.getElementById("headerPlayGround")!.clientHeight;

      if (this.width.original == -1) {
        this.width.original = newWidth;
        this.width.actual = newWidth;

        this.height.original = newHeight;
        this.height.actual = newHeight;

        this.pixiApp!.stage.removeChildren;
        this.coordinateContainer = new PIXI.Container();
        console.log("ADDING coordinates");
        this.pixiApp!.stage.addChild(
          this.coordinateContainer! as PIXI.Container,
        );
        const graphContainer = new PIXI.Container();
        this.graphContainer = graphContainer;
        this.pixiApp!.stage.addChild(graphContainer);

        this.growRatio =
          (this.width.original - 2 * this.paddingRL) / this.maxDurationStore;
      }

      //recalculate the size if of the container if something is changed
      const xRatio = newWidth / this.width.actual;
      const yRatio = newHeight / this.height.actual;
      console.log(
        `newHeight: ${newHeight} / this.height.actual ${this.height.actual} =  ${yRatio}`,
      );
      this.width.actual = newWidth;
      this.height.actual = newHeight;

      // console.log(`height: ${this.height.actual}, Y ratio: ${yRatio}`)
      this.graphContainer!.width = this.graphContainer!.width * xRatio;
      this.graphContainer!.height = this.graphContainer!.height * yRatio;
      /*       console.log(
              "x value " +
              this.graphContainer!.x +
              "   " +
              this.graphContainer!.width
            );
            console.log(
              "y value " +
              this.graphContainer!.y +
              "   " +
              this.graphContainer!.height
            );
       */

      this.pixiApp?.renderer.resize(this.width.actual, this.height.actual);
      // this.createMask();
      this.calcLegend();
    },
    /**
     * method to create a mask, so you will never see figures outside of the time area
     * if the size of time area is changed, it will create a new modified mask
     */
    createMask() {
      if (this.maskIndex !== -1)
        this.pixiApp?.stage.removeChildAt(this.maskIndex);
      const px_mask_outter_bounds = new PIXI.Graphics();
      // px_mask_outter_bounds.beginFill();
      // px_mask_outter_bounds.fill();
      px_mask_outter_bounds.rect(
        this.paddingRL,
        0,
        this.width.actual - 2 * this.paddingRL,
        this.height.actual,
      );
      // px_mask_outter_bounds.fillS();
      px_mask_outter_bounds.renderable = true;
      // px_mask_outter_bounds.cacheAsBitmap = true;
      console.log("Adding mask");
      this.pixiApp!.stage.addChild(px_mask_outter_bounds);

      this.maskIndex = this.pixiApp!.stage.children.length - 1;
      this.graphContainer!.mask = px_mask_outter_bounds;
    },
    /**
     * method to create the legen of the time are
     * contain all lines and numbers
     * draw the legend every time new, because numbers get blurry at scaling
     */
    calcLegend() {
      console.log("Calculating legend");
      const parts = 20;
      this.coordinateContainer?.removeChildren();
      let xPosition = this.width.actual - this.paddingRL;
      let yPosition = 0;
      const distLinesY = this.height.actual / (this.numberOfOutputs + 1 + 1);
      const distLinesX = (this.width.actual - 2 * this.paddingRL) / parts;
      let duration = this.maxDurationStore / 1000;
      const timeInterval = duration / parts;

      const graphics = new PIXI.Graphics();
      graphics.setStrokeStyle({
        width: 1,
        color: 0x000000,
        alpha: 1,
        matrix: new PIXI.Matrix(), // The neccessary inclusion of the matrix parameter seems like a bug to me
      });
      //draw horizontal lines
      for (let i = 0; i < this.numberOfOutputs + 1; i++) {
        yPosition += distLinesY;
        graphics.moveTo(this.paddingRL, yPosition);
        graphics.lineTo(this.width.actual - this.paddingRL, yPosition).stroke();
      }

      //draw vertil lines and labels
      for (let i = 0; i <= parts; i++) {
        graphics.moveTo(xPosition, yPosition - 10);
        graphics.lineTo(xPosition, yPosition + 10).stroke();
        // const label = new PIXI.Text({
        //   text: duration.toString() + " s",
        //   style: {
        //     fontFamily: "Arial",
        //     fontSize: 12,
        //     align: "center",
        //   },
        // });

        // let xOffset = 8;
        // // label.resolution = 3;
        // if (duration >= 10) xOffset = 12;

        // label.x = xPosition - xOffset;
        // label.y = yPosition + 15;
        // this.coordinateContainer?.addChild(label);
        // duration -= timeInterval;
        // xPosition -= distLinesX;
      }

      // this.coordinateContainer?.addChild(basicText);
      this.coordinateContainer?.addChild(graphics);
    },
    /**
     * method to resize the figures, if the max duration is changed
     */
    resizeRectangles() {
      const channels = this.store.state.tactonSettings.outputChannelState;
      for (let i = 0; i < channels.length; i++) {
        const graph = this.channelGraphs.find(
          (graph) => graph.channelId == channels[i].channelId,
        );

        if (graph == undefined) continue;
        const intensityArray: IntensityObject[] = [];
        graph.container.removeChildren();
        let timeToMoveContainer = 0;
        if (this.currentTime > this.maxDurationStore)
          timeToMoveContainer = this.currentTime - this.maxDurationStore;

        graph.container.x = 0 - timeToMoveContainer * this.growRatio;
        for (let z = graph.intensities.length - 1; z >= 0; z--) {
          if (graph.intensities[z].intensity == 0) continue;

          intensityArray.push({
            intensity: graph.intensities[z].intensity,
            startTime: graph.intensities[z].startTime,
            endTime: graph.intensities[z].endTime,
            author: graph.intensities[z].author,
          });
        }

        graph.intensities = [];
        for (let z = intensityArray.length - 1; z >= 0; z--) {
          const duration =
            intensityArray[z].endTime! - intensityArray[z].startTime!;
          const intensityObject = this.drawRectangle(
            intensityArray[z].startTime! * this.growRatio + this.paddingRL,
            duration * this.growRatio,
            intensityArray[z].intensity,
            graph.container as PIXI.Container,
            intensityArray[z].author,
          );

          graph.intensities.push({
            ...intensityObject,
            startTime: intensityArray[z].startTime,
            endTime: intensityArray[z].endTime,
          });
        }
      }
    },
    clearGraph() {
      this.currentTime = 0;
      this.channelGraphs.forEach((graph) => {
        graph.container.removeChildren();
      });
      this.graphContainer?.removeChild(
        this.endOfTactonIndicator.getContainer(),
      );
      this.channelGraphs = [];
      if (this.ticker !== null && this.ticker.count > 0) {
        console.log("stopped ticker");
        this.ticker?.remove(this.loop);
      }
      console.log("starting ticker");
      this.ticker?.add(this.loop);
    },
    drawStoredGraph(instructions: TactonInstruction[]) {
      console.log("Drawing graph");
      // Divide instructions into blocks
      this.blocksByChannel = Array.from(
        { length: this.numberOfOutputs },
        () => [],
      );

      const getMillisForIndex = (
        instructions: TactonInstruction[],
        from: number,
        to: number,
      ): number => {
        let ms = 0;
        for (let index = from; index < to; index++) {
          const instruction = instructions[index];
          if (isInstructionWait(instruction)) {
            ms += instruction.wait.miliseconds;
          }
        }

        return ms;
      };

      console.log(
        "receiving instructions",
        JSON.parse(JSON.stringify(instructions)),
      );
      const waiting = Array.from({ length: this.numberOfOutputs }, () => true);
      instructions.forEach((instruction, index) => {
        // perform deep copy of instruction
        if (isInstructionSetParameter(instruction)) {
          instruction.setParameter.channelIds.forEach((channelId) => {
            const blocks = this.blocksByChannel[channelId];
            const block = blocks[blocks.length - 1];
            const newInstruction = {
              setParameter: {
                channelIds: [channelId],
                intensity: instruction.setParameter.intensity,
              },
            };

            if (block && !waiting[channelId]) {
              block.instructions.push(newInstruction);
            }

            if (newInstruction.setParameter.intensity === 0) {
              waiting[channelId] = true;
            } else if (waiting[channelId]) {
              waiting[channelId] = false;
              blocks.push({
                instructions: [newInstruction],
                startMs: getMillisForIndex(instructions, 0, index),
                length: 0,
                deleted: false,
              });
            }
          });
        } else if (isInstructionWait(instruction)) {
          this.blocksByChannel.forEach((blocks, channelId) => {
            const block = blocks[blocks.length - 1];
            // Ignore block if it has no instructions yet
            if (block && !waiting[channelId]) {
              block.instructions.push({
                wait: { miliseconds: instruction.wait.miliseconds },
              });
              block.length += instruction.wait.miliseconds;
            }
          });
        }
      });

      console.log(this.blocksByChannel);

      //Work on each channel
      for (let i = 0; i < this.numberOfOutputs; i++) {
        const blocks = this.blocksByChannel[i];

        if (blocks.length === 0) continue;

        let graph = this.channelGraphs.find((graph) => graph.channelId == i);

        if (graph === undefined) {
          const container = new PIXI.Container();

          graph = {
            channelId: i,
            container: container,
            intensities: [],
          };

          this.channelGraphs.push(graph);
          // toRaw turns this.graphContainer into a non-proxy object, which is needed
          // to let pixi set the parent attribute on the container correctly.
          toRaw(this.graphContainer)?.addChild(container);
        }

        let blockIndex = 0;
        for (const { instructions, startMs } of blocks) {
          let accumulatedMs = startMs;

          const instructionsContainer = new PIXI.Container();

          for (let index = 0; index < instructions.length; index += 1) {
            const instruction = instructions[index];

            if (isInstructionSetParameter(instruction)) {
              if (instruction.setParameter.intensity === 0) continue;

              let timeBetweenInstructionsMs = 0;
              let nextInstructionIndex = index + 1;
              let nextInstruction = instructions[nextInstructionIndex];
              if (!nextInstruction || !isInstructionWait(nextInstruction)) {
                console.warn(
                  "Instruction set malformed. No wait instruction next.",
                  { instructions, index },
                );
              }

              while (nextInstruction && isInstructionWait(nextInstruction)) {
                timeBetweenInstructionsMs += nextInstruction.wait.miliseconds;
                nextInstructionIndex += 1;
                nextInstruction = instructions[nextInstructionIndex];
              }
              const additionalWidth =
                this.growRatio * timeBetweenInstructionsMs;

              const xPosition =
                ((this.width.original - 2 * this.paddingRL) *
                  (accumulatedMs - startMs)) /
                this.maxDurationStore;

              const intensityObject = this.drawRectangle(
                xPosition,
                additionalWidth,
                instruction.setParameter.intensity,
                instructionsContainer,
                undefined,
              );

              graph.intensities.push({
                ...intensityObject,
                startTime: accumulatedMs,
                endTime: accumulatedMs + timeBetweenInstructionsMs,
              });

              accumulatedMs += timeBetweenInstructionsMs;
            }
          }

          const lengthOfBlock = accumulatedMs - startMs;

          const blockContainer = new PIXI.Container();
          blockContainer.addChild(instructionsContainer);

          this.drawBlockControls(
            i,
            blockIndex,
            lengthOfBlock * this.growRatio,
            blockContainer,
          );

          blockContainer.eventMode = "static";
          const currentIndex = blockIndex;
          blockContainer.addEventListener(
            "pointerdown",
            (e: PIXI.FederatedPointerEvent) => {
              // Prevent document pointerdown to unselect block
              e.preventDefault();

              // Remove highlight of currently selected block
              const currentlySelected = this.selectedBlock;
              if (currentlySelected) {
                const { index, channel } = currentlySelected;
                // Do nothing if the currently selected block is this block
                if (channel === i && index === currentIndex) {
                  currentlySelected.moving = true;
                  this.pixiApp?.stage?.addEventListener(
                    "pointermove",
                    this.moveBlock,
                  );
                  return;
                }

                this.unselectBlock();
              }

              // add highlight to current block
              const oldControls = blockContainer.getChildByName("controls");
              if (oldControls) {
                blockContainer.removeChild(oldControls);
                oldControls.destroy({ children: true });
              }
              const newControls = this.drawBlockControls(
                i,
                currentIndex,
                blockContainer.width,
                blockContainer,
                true,
              );
              this.selectedBlock = {
                moving: true,
                channel: i,
                index: currentIndex,
                container: blockContainer,
              };

              this.pixiApp?.stage?.addEventListener(
                "pointermove",
                this.moveBlock,
              );

              document.addEventListener("keydown", this.handleBlockKeyDown);
              document.addEventListener("pointerdown", this.unselectBlock);
            },
          );

          // +1 for the legend, + 1 because numberOfOutputs starts counting at 0
          const numberOfRows = this.numberOfOutputs + 1 + 1;
          const distLinesY = this.height.original / numberOfRows;
          const ratioHeight = 35 / numberOfRows;
          const height = distLinesY - ratioHeight * numberOfRows;
          const yPosition = (i + 1) * distLinesY - height * 0.5;

          const xPosition =
            ((this.width.original - 2 * this.paddingRL) * startMs) /
              this.maxDurationStore +
            this.paddingRL;

          blockContainer.position.set(xPosition, yPosition);

          graph.container.addChild(blockContainer);
          blockIndex += 1;
        }
      }
      /*
        filter the instructions for each channel, also get the index
        calaculate the time between each change by summing up all wait instructions between the first and the second instruction
      */
      console.log(instructions);
    },
    drawLiveGraph(channels: OutputChannelState[]) {
      const additionalWidth = this.growRatio * this.ticker!.elapsedMS;
      for (let i = 0; i < channels.length; i++) {
        const graph = this.channelGraphs.find(
          (graph) => graph.channelId == channels[i].channelId,
        );
        if (graph == undefined) {
          /**
           * draw for every row a container,
           * if there are no items, just enter 0 for the intensity as default
           * the container is needed, to move the starting point later on, also if there are no figures
           */
          //if (channels[i].intensity == 0) continue;
          //there is currently no rectangle
          const container = new PIXI.Container();

          let xPosition = this.width.original - this.paddingRL;
          if (this.currentTime < this.maxDurationStore)
            xPosition =
              (xPosition * this.currentTime) / this.maxDurationStore +
              this.paddingRL;

          //Go thorugh InstructionToClient object, for each channel in channelIds
          const intensityObject = this.drawRectangleLive(
            i,
            xPosition,
            additionalWidth,
            channels[i].intensity,
            container,
            channels[i].author,
          );
          this.channelGraphs.push({
            channelId: channels[i].channelId,
            container: container,
            intensities: [
              {
                ...intensityObject,
                startTime: this.currentTime,
                endTime: this.currentTime + this.ticker!.elapsedMS,
              },
            ],
          });

          this.graphContainer?.addChild(container);
          ///this.ticker?.stop();
        } else {
          //push the container to left, to have place for new values
          if (this.currentTime >= this.maxDurationStore) {
            graph.container.x -= additionalWidth;
          }
          //get the last figure object
          const index = graph.intensities.length - 1;
          const lastIntensityObject = graph.intensities[index];

          // if the new intensity is 0, dont draw a figure, just enter the new intensity
          if (channels[i].intensity == 0) {
            if (lastIntensityObject.intensity !== 0) {
              graph.intensities.push({ intensity: 0 });
            }
            continue;
          }

          if (
            lastIntensityObject.intensity == channels[i].intensity &&
            lastIntensityObject.author == channels[i].author
          ) {
            //could use same figure, update width and the new endtime
            lastIntensityObject.object!.width =
              lastIntensityObject.object!.width + additionalWidth;

            graph.intensities[index] = {
              ...lastIntensityObject,
              endTime: lastIntensityObject.endTime! + this.ticker!.elapsedMS,
            };
          } else {
            //intensity or author changed, draw new rectangle
            const xPosition =
              ((this.width.original - 2 * this.paddingRL) * this.currentTime) /
                this.maxDurationStore +
              this.paddingRL;

            const intensityObject = this.drawRectangleLive(
              i,
              xPosition,
              additionalWidth,
              channels[i].intensity,
              graph.container as PIXI.Container,
              channels[i].author,
            );

            graph.intensities.push({
              ...intensityObject,
              startTime: this.currentTime,
              endTime: this.currentTime + this.ticker!.elapsedMS,
            });
          }
        }
      }
    },
    positionCursor(time: number) {
      if (!this.cursor.hasDrawnCursor) {
        this.cursor.drawCursor(this.height.actual);
      }
      this.cursor.moveToPosition(time * this.growRatio + this.paddingRL);
      this.graphContainer?.addChild(this.cursor.getContainer());
    },
    drawRectangleLive(
      idGraph: number,
      xPosition: number,
      additionalWidth: number,
      intensity: number,
      container: PIXI.Container,
      author?: User,
    ) {
      // not du anything at intensity of 0
      if (intensity == 0) return { intensity: 0 };
      //+1 for the legend, + 1 because numberOfOutputs starts counting at 0
      const numberOfRows = this.numberOfOutputs + 1 + 1;
      const distLinesY = this.height.original / numberOfRows;
      const ratioHeight = 35 / numberOfRows;
      const height = (distLinesY - ratioHeight * numberOfRows) * intensity;
      let yPosition = (idGraph + 1) * distLinesY - height * 0.5;

      // console.log("draw Rectangle at x: " + xPosition);
      // console.log("draw Rectangle at x" + yPosition);
      // console.log("draw Rectangle width: " + additionalWidth);
      // console.log("draw Rectangle height: " + height);
      // draw the rectangle
      const rect = new PIXI.Graphics();

      //calculate colour
      if (author == undefined) {
        rect.setFillStyle({
          color: "0x6c6c60",
          alpha: 1,
          matrix: new PIXI.Matrix(),
        });
      } else {
        rect.setFillStyle({
          color: author.color,
          alpha: 1,
          matrix: new PIXI.Matrix(),
        });
      }
      rect.rect(0, 0, additionalWidth, height);
      rect.position.set(xPosition, yPosition);
      rect.fill();

      container.addChild(rect);
      //this.ticker?.stop();
      return {
        index: container.children.length - 1,
        intensity: intensity,
        width: additionalWidth,
        object: rect,
        author: author,
      };
    },
    /**
     * method to draw a new rectangle
     * idGraph = number at which row to draw figure; start at 0
     * xPostion = x position of figure, measured at top left corner
     * additionalWidth = width of figure
     * intensity = intensity to display, used for height calculation
     * container = container, which contain all figures of one row
     * author = user, which caused input
     */
    drawRectangle(
      xPosition: number,
      additionalWidth: number,
      intensity: number,
      container: PIXI.Container,
      author?: User,
    ) {
      // not du anything at intensity of 0
      if (intensity == 0) return { intensity: 0 };

      const numberOfRows = this.numberOfOutputs + 1 + 1;
      const distLinesY = this.height.original / numberOfRows;
      const ratioHeight = 35 / numberOfRows;
      const rowHeight = distLinesY - ratioHeight * numberOfRows;
      const height = rowHeight * intensity;
      const yPosition = (rowHeight - height) * 0.5;

      //console.log("draw Rectangle at x: " + xPosition);
      // console.log(draw Rectangle at x: " + yPosition)
      //console.log("draw Rectangle width: " + additionalWidth);
      //console.log("draw Rectangle height: " + height);
      // draw the rectangle
      const rect = new PIXI.Graphics();

      //calculate colour
      if (author == undefined) {
        rect.setFillStyle({
          color: "0x6c6c60",
          matrix: new PIXI.Matrix(),
        });
      } else {
        rect.setFillStyle({
          color: author.color,
          matrix: new PIXI.Matrix(),
        });
      }
      rect.rect(0, 0, additionalWidth, height);
      rect.position.set(xPosition, yPosition);
      rect.fill();

      container.addChild(rect);
      //this.ticker?.stop();
      return {
        index: container.children.length - 1,
        intensity: intensity,
        width: additionalWidth,
        object: rect,
        author: author,
      };
    },
    drawBlockControls(
      channelIndex: number,
      blockIndex: number,
      width: number,
      container: PIXI.Container,
      highlighted = false,
    ) {
      const numberOfRows = this.numberOfOutputs + 1 + 1;
      const distLinesY = this.height.original / numberOfRows;
      const ratioHeight = 35 / numberOfRows;
      const height = distLinesY - ratioHeight * numberOfRows;

      const blockControls = new PIXI.Container();

      const lineWidth = highlighted ? 4 : 2;
      const rect = new PIXI.Graphics();
      rect.setStrokeStyle({
        width: lineWidth,
        color: 0xec660c,
        matrix: new PIXI.Matrix(),
      });
      // rect.lineStyle(lineWidth, 0xec660c);
      // rect.beginFill(0xec660c, highlighted ? 0.4 : 0.2);
      rect.moveTo(0, 0);
      rect.rect(0, 0, width, height).stroke();
      // rect.drawRect(0, 0, width, height);
      // rect.endFill();

      const renderBorder = (x: number) => {
        const border = new PIXI.Graphics();
        border.eventMode = "static";
        // border.lineStyle(2, 0xec660c);
        border.setStrokeStyle({
          width: 2,
          color: 0xec660c,
          matrix: new PIXI.Matrix(),
        });
        //border.lineStyle(2, 0x0000000);
        border.lineTo(0, height).stroke();
        border.cursor = "col-resize";
        border.x = x;

        // border.hitArea = {
        //   contains: (x: number, y: number) => {
        //     //TODO PIXI Change
        //     const points = border.geometry.points;
        //     const od = [];
        //     const even = [];

        //     for (let index = 0; index * 2 < points.length; index++) {
        //       const x = points[index * 2];
        //       const y = points[index * 2 + 1];
        //       const z = points[index * 2 + 2];
        //       if (index % 2 === 0) {
        //         od.push({ x, y, z });
        //       } else {
        //         even.push({ x, y, z });
        //       }
        //     }
        //     return new PIXI.Polygon([...od, ...even.reverse()]).contains(x, y);
        //   },
        // };

        border.addEventListener(
          "pointerdown",
          (e: PIXI.FederatedPointerEvent) => {
            e.stopPropagation();
            this.currentStretch = {
              channel: channelIndex,
              index: blockIndex,
              previousScale: container.children[0].scale.x,
              block: container,
              direction:
                x === 0 ? StretchDirection.NEGATIVE : StretchDirection.POSITIVE,
            };
            this.pixiApp?.stage?.addEventListener(
              "pointermove",
              this.stretchBlock,
            );
          },
        );

        return border;
      };

      blockControls.addChild(rect);

      blockControls.addChild(renderBorder(0));
      blockControls.addChild(renderBorder(width));

      // blockControls.name = "controls";
      blockControls.label = "controls";

      container.addChild(blockControls);
      return blockControls;
    },
    moveBlock(e: PIXI.FederatedPointerEvent) {
      const selectedBlock = this.selectedBlock;
      if (selectedBlock && selectedBlock.moving) {
        const { container, channel, index } = selectedBlock;

        // Collision detection
        const newStartMs =
          ((container.x + e.movement.x - this.paddingRL) *
            this.maxDurationStore) /
          (this.width.original - 2 * this.paddingRL);

        let newX = container.x + e.movement.x;

        const shouldAbort = () => {
          // Return if moved over left end of timeline
          if (newStartMs < 0) {
            newX = this.paddingRL;
            return true;
          }

          // Return if moved over right end of timeline
          const block = this.blocksByChannel[channel][index];
          if (newStartMs + block.length > this.maxDurationStore) {
            newX =
              ((this.width.original - 2 * this.paddingRL) *
                (this.maxDurationStore - block.length)) /
                this.maxDurationStore +
              this.paddingRL;
            return true;
          }

          // Check if another block conflicts
          const otherBlocksByDistance = this.blocksByChannel[channel]
            .filter(
              (other, otherIndex) => !other.deleted && otherIndex !== index,
            )
            .sort(
              (a, b) =>
                Math.abs(a.startMs - block.startMs) -
                Math.abs(b.startMs - block.startMs),
            );
          if (e.movement.x > 0) {
            const rightBlock = otherBlocksByDistance.find(
              (other) => other.startMs - block.startMs > 0,
            );
            if (rightBlock && newStartMs + block.length >= rightBlock.startMs) {
              // Subtracting 5 here makes it easier to grab the container again
              newX =
                ((this.width.original - 2 * this.paddingRL) *
                  (rightBlock.startMs - block.length - 5)) /
                  this.maxDurationStore +
                this.paddingRL;
              return true;
            }
          } else {
            const leftBlock = otherBlocksByDistance.find(
              (other) => other.startMs - block.startMs < 0,
            );
            if (
              leftBlock &&
              newStartMs <= leftBlock.startMs + leftBlock.length
            ) {
              newX =
                ((this.width.original - 2 * this.paddingRL) *
                  (leftBlock.startMs + leftBlock.length + 5)) /
                  this.maxDurationStore +
                this.paddingRL;
              return true;
            }
          }

          return false;
        };

        // Notice that this function sets newX to the last location that is valid.
        const abort = shouldAbort();

        container.x = newX;

        if (abort) {
          this.moveBlockEnd();
        }
      }
    },
    moveBlockEnd() {
      const selectedBlock = this.selectedBlock;
      if (selectedBlock && selectedBlock.moving) {
        const { channel, index, container } = selectedBlock;
        const block = this.blocksByChannel[channel][index];
        block.startMs =
          ((container.x - this.paddingRL) * this.maxDurationStore) /
          (this.width.original - 2 * this.paddingRL);
        this.updateTacton();
        selectedBlock.moving = false;
      }
      this.pixiApp?.stage?.removeEventListener("pointermove", this.moveBlock);
    },
    stretchBlock(e: PIXI.FederatedPointerEvent) {
      const currentStretch = this.currentStretch;
      if (currentStretch) {
        const { channel, index, block: container, direction } = currentStretch;
        const instructionsContainer = container.children[0] as PIXI.Container;

        // Collision detection
        const block = this.blocksByChannel[channel][index];
        let length = block.length;
        let startMs = block.startMs;
        let newX = container.x;
        let newWidth = instructionsContainer.width;

        switch (direction) {
          case StretchDirection.NEGATIVE: {
            newX += e.movement.x;
            newWidth -= e.movement.x;
            startMs =
              ((newX - this.paddingRL) * this.maxDurationStore) /
              (this.width.original - 2 * this.paddingRL);
            length =
              (newWidth * this.maxDurationStore) /
              (this.width.original - 2 * this.paddingRL);
            break;
          }
          case StretchDirection.POSITIVE: {
            newWidth += e.movement.x;
            length =
              (newWidth * this.maxDurationStore) /
              (this.width.original - 2 * this.paddingRL);
            break;
          }
        }

        const shouldAbort = () => {
          // Return if moved over left end of timeline
          if (startMs < 0) {
            newX = this.paddingRL;
            newWidth = instructionsContainer.width + instructionsContainer.x;
            return true;
          }
          // Check if new length is negative
          if (length < 0) {
            newWidth = 1;
            if (direction === StretchDirection.NEGATIVE) {
              newX = container.x + instructionsContainer.width - newWidth;
            }
            return true;
          }
          // Return if moved over right end of timeline
          if (startMs + length > this.maxDurationStore) {
            newWidth =
              ((this.width.original - 2 * this.paddingRL) *
                (this.maxDurationStore - startMs)) /
              this.maxDurationStore;
            return true;
          }

          // Check if another block conflicts
          const otherBlocksByDistance = this.blocksByChannel[channel]
            .filter(
              (other, otherIndex) => !other.deleted && otherIndex !== index,
            )
            .sort(
              (a, b) =>
                Math.abs(a.startMs - block.startMs) -
                Math.abs(b.startMs - block.startMs),
            );
          switch (direction) {
            case StretchDirection.NEGATIVE: {
              const leftBlock = otherBlocksByDistance.find(
                (other) => other.startMs - block.startMs < 0,
              );
              if (
                leftBlock &&
                startMs <= leftBlock.startMs + leftBlock.length
              ) {
                newX =
                  ((this.width.original - 2 * this.paddingRL) *
                    (leftBlock.startMs + leftBlock.length + 5)) /
                    this.maxDurationStore +
                  this.paddingRL;
                newWidth = container.x + instructionsContainer.width - newX;
                return true;
              }
              break;
            }
            case StretchDirection.POSITIVE: {
              const rightBlock = otherBlocksByDistance.find(
                (other) => other.startMs - block.startMs > 0,
              );
              if (rightBlock && startMs + length >= rightBlock.startMs) {
                // Subtracting 5 here makes it easier to grab the container again
                newWidth =
                  ((this.width.original - 2 * this.paddingRL) *
                    (rightBlock.startMs - startMs - 5)) /
                  this.maxDurationStore;
                return true;
              }
              break;
            }
          }

          return false;
        };

        // Notice that this function sets newX and newWidth to the last location that is valid.
        const abort = shouldAbort();

        const controls = container.getChildByName("controls");
        if (controls) {
          container.removeChild(controls as PIXI.Container);
          controls.destroy({ children: true });
        }

        instructionsContainer.width = newWidth;
        container.x = newX;
        this.drawBlockControls(
          channel,
          index,
          container.width,
          toRaw(container) as PIXI.Container,
        );

        if (abort) {
          this.stretchBlockEnd();
        }
      }
    },
    stretchBlockEnd() {
      const currentStretch = this.currentStretch;
      if (currentStretch) {
        const {
          channel,
          index,
          block: blockContainer,
          previousScale,
        } = currentStretch;
        const block = this.blocksByChannel[channel][index];
        let length = 0;
        block.instructions.forEach((instruction) => {
          if (isInstructionWait(instruction)) {
            instruction.wait.miliseconds *=
              blockContainer.children[0].scale.x / previousScale;
            length += instruction.wait.miliseconds;
          }
        });
        block.startMs =
          ((blockContainer.x - this.paddingRL) * this.maxDurationStore) /
          (this.width.original - 2 * this.paddingRL);
        block.length = length;
        this.updateTacton();
      }

      this.currentStretch = null;
      this.pixiApp?.stage?.removeEventListener(
        "pointermove",
        this.stretchBlock,
      );
    },
    deleteCurrentlySelectedBlock() {
      const selectedBlock = this.selectedBlock;
      if (!selectedBlock) return;

      const { index, channel, container } = selectedBlock;
      container.destroy({ children: true });
      this.blocksByChannel[channel][index].deleted = true;
      this.selectedBlock = null;
      this.updateTacton();
    },
    unselectBlock(e?: PointerEvent) {
      if (e && e.defaultPrevented) return;

      const selectedBlock = this.selectedBlock;
      if (!selectedBlock) return;

      const { container, index, channel } = selectedBlock;

      const controls = container.getChildByName("controls");
      if (controls) {
        container.removeChild(controls as PIXI.Container);
        controls.destroy({ children: true });
      }

      this.drawBlockControls(
        channel,
        index,
        container.width,
        toRaw(container) as PIXI.Container,
      );

      this.selectedBlock = null;

      document.removeEventListener("pointerdown", this.unselectBlock);
      document.removeEventListener("keydown", this.handleBlockKeyDown);
    },
    handleBlockKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Clear currently selected block
        this.unselectBlock();
      } else if (e.key === "Delete") {
        // Delete block
        this.deleteCurrentlySelectedBlock();
      }
    },
    updateTacton() {
      const tacton = this.tacton;
      if (!tacton) return;

      const instructions: TactonInstruction[] = [];

      // Build a list of instructions with start and end time
      const timeline: {
        startMs: number;
        endMs: number;
        instruction: TactonInstruction;
      }[] = [];
      this.blocksByChannel.forEach((blocks) => {
        blocks
          .filter((block) => !block.deleted)
          .forEach((block) => {
            let currentMs = block.startMs;
            block.instructions.forEach((instruction) => {
              let duration = 0;
              if (isInstructionWait(instruction)) {
                duration = instruction.wait.miliseconds;
              }

              timeline.push({
                startMs: currentMs,
                endMs: currentMs + duration,
                instruction: JSON.parse(JSON.stringify(instruction)),
              });

              currentMs += duration;
            });
          });
      });

      // Sort the list by start time
      const sortedTimeline = timeline.sort(
        (a, b) => a.startMs - b.startMs || a.endMs - b.endMs,
      );

      // Iterate over the list, eliminating duplications and emitting new instructions
      if (sortedTimeline[0].startMs !== 0) {
        instructions.push({ wait: { miliseconds: sortedTimeline[0].startMs } });
      }

      for (let index = 0; index < sortedTimeline.length; index++) {
        const entry = sortedTimeline[index];

        if (index + 1 >= sortedTimeline.length) {
          instructions.push(entry.instruction);
        }

        while (index + 1 < sortedTimeline.length) {
          const nextEntry = sortedTimeline[index + 1];

          // entry goes "over" next entry
          if (entry.endMs >= nextEntry.startMs) {
            if (isInstructionWait(entry.instruction)) {
              if (isInstructionWait(nextEntry.instruction)) {
                entry.instruction.wait.miliseconds +=
                  nextEntry.instruction.wait.miliseconds;
              } else {
                entry.instruction.wait.miliseconds =
                  nextEntry.startMs - entry.startMs;
                instructions.push(entry.instruction);
                break;
              }
            } else if (isInstructionSetParameter(entry.instruction)) {
              if (
                isInstructionSetParameter(nextEntry.instruction) &&
                entry.instruction.setParameter.intensity ===
                  nextEntry.instruction.setParameter.intensity
              ) {
                entry.instruction.setParameter.channelIds = [
                  ...new Set([
                    ...entry.instruction.setParameter.channelIds,
                    ...nextEntry.instruction.setParameter.channelIds,
                  ]),
                ];
              } else {
                instructions.push(entry.instruction);
                break;
              }
            }
            // There is a gap
          } else {
            if (isInstructionWait(entry.instruction)) {
              entry.instruction.wait.miliseconds =
                nextEntry.startMs - entry.startMs;
              instructions.push(entry.instruction);
            } else {
              instructions.push(entry.instruction);
              instructions.push({
                wait: { miliseconds: nextEntry.startMs - entry.startMs },
              });
            }
            break;
          }
          index++;
        }
      }

      const payload = {
        roomId: this.store.state.roomSettings.id,
        tactonId: tacton.uuid,
        tacton: { ...tacton, instructions },
      };
      sendSocketMessage(WS_MSG_TYPE.UPDATE_TACTON_SERV, payload);
    },
    /**
     * method wich will called every frame, to draw and update figures
     */
    loop() {
      console.log("loop");
      //calculate the additional width, which has to add for the time frame
      const numOfInst = this.channelGraphs.reduce(
        (acc, val) => acc + val.intensities.length,
        0,
      );
      if (numOfInst == this.numberOfOutputs) {
        this.currentTime = 0;
      }
      const channels = this.store.state.tactonSettings.outputChannelState;
      this.drawLiveGraph(channels);
      this.positionCursor(this.currentTime);
      this.currentTime += this.ticker!.elapsedMS;
    },
  },
});
</script>
