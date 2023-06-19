<template>
  <div id="tactonDisplay"></div>
</template>

<script lang="ts">
import * as PIXI from "pixi.js";
import { PRECISION } from "@pixi/constants";
import { defineComponent } from "@vue/runtime-core";
import { useStore } from "@/renderer/store/store";
import { TactonSettingsActionTypes, OutputChannelState } from "@/renderer/store/modules/tactonSettings/tactonSettings";
import { User, InteractionMode } from "@sharedTypes/roomTypes";
import { Tacton, TactonInstruction, isInstructionSetParameter, InstructionSetParameter, InstructionWait, getDuration, isInstructionWait } from "@sharedTypes/tactonTypes";

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
  container: PIXI.Container = new PIXI.Container()
  position = 0
  hasDrawnCursor = false
  color: number

  constructor(color: number) {
    this.container.addChild(this.graphic)
    this.color = color
  }

  getContainer(): PIXI.Container {
    return this.container
  }

  drawCursor(height: number) {
    this.graphic.beginFill(this.color);
    this.graphic.drawRect(0, 0, 2, height);
    this.hasDrawnCursor = true
  }
  moveToPosition(xPosition: number) {
    this.container.position.set(xPosition, 0);
  }
}
export default defineComponent({
  name: "TactonGraph",
  props: {
    isMounted: {
      type: Boolean,
    },
  },
  data() {
    return {
      pixiApp: null as PIXI.Application | null,
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
      paddingRL: 20,
      growRatio: 0,
      currentTime: 0,
      dropdownDisabled: false,
      cursor: new Cursor(0xec660c),
      endOfTactonIndicator: new Cursor(0x83be63)
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
      return this.store.state.roomSettings.mode
    },
    tacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton
    },
    numberOfOutputs(): number {
      return this.store.getters.getNumberOfOutputs;
    },
    playbackTime(): number {
      return this.store.state.tactonPlayback.playbackTime
    }
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
        this.store.dispatch(TactonSettingsActionTypes.instantiateArray)
        this.clearGraph()
        this.ticker?.start();
      } else {
        this.ticker?.stop();
        this.ticker?.remove(this.loop);

        if (mode == InteractionMode.Jamming) {
          this.cursor.moveToPosition(0)
        }
      }
    },
    tacton(tacton) {
      if (tacton == null) return
      const t = tacton as Tacton
      this.clearGraph()
      this.drawStoredGraph(t.instructions)
      this.endOfTactonIndicator.moveToPosition(getDuration(tacton) * this.growRatio + this.paddingRL)
      this.endOfTactonIndicator.drawCursor(this.height.actual)
      this.graphContainer?.addChild(this.endOfTactonIndicator.getContainer())
    },
    playbackTime(time) {
      console.log(time)
      // this.cursor.moveToPosition(time * this.growRatio + this.paddingRL)
      this.positionCursor(time)
    }
  },
  mounted() {
    //listener to recalculate time profiles
    window.addEventListener("resize", this.resizeScreen);

    PIXI.settings.PRECISION_FRAGMENT = PRECISION.HIGH;
    this.pixiApp = new PIXI.Application({
      transparent: true,
      antialias: true,
    });
    this.pixiApp.renderer.view.style.display = "block";
    document.getElementById("tactonDisplay")?.appendChild(this.pixiApp.view);

    /**
     * create ticker for animation
     */
    this.ticker = PIXI.Ticker.shared;
    this.ticker.autoStart = false;
    this.ticker.stop();
    this.store.dispatch(TactonSettingsActionTypes.instantiateArray);

    //start the initial resize screen
    if (this.isMounted) this.resizeScreen();
  },
  beforeUnmount() {
    //remove listener and loop if the component is clossed
    if (this.ticker !== null && this.ticker.count > 0)
      this.ticker?.remove(this.loop);

    window.removeEventListener("resize", this.resizeScreen);
  },
  methods: {
    resizeScreen() {
      /**
       * be aware that changing the width will apply a scaling factor in the background
       * this means you have never to update the width or height for your calculation
       * you will calculate the original position, width still and the scaling will position it relative
       */
      const newWidth = document.getElementById("tactonScreen")!.clientWidth;
      const newHight =
        window.innerHeight -
        document.getElementById("tactonHeader")!.clientHeight -
        document.getElementById("headerPlayGround")!.clientHeight;

      if (this.width.original == -1) {
        this.width.original = newWidth;
        this.width.actual = newWidth;

        this.height.original = newHight;
        this.height.actual = newHight;

        this.pixiApp!.stage.removeChildren;
        this.coordinateContainer = new PIXI.Container();
        this.pixiApp!.stage.addChild(
          this.coordinateContainer! as PIXI.Container
        );
        const graphContainer = new PIXI.Container();
        this.pixiApp!.stage.addChild(graphContainer);
        this.graphContainer = graphContainer;

        this.growRatio =
          (this.width.original - 2 * this.paddingRL) / this.maxDurationStore;
      }

      //recalculate the size if of the container if something is changed
      const xRatio = newWidth / this.width.actual;
      const yRatio = newHight / this.height.actual;
      this.width.actual = newWidth;
      this.height.actual = newHight;

      this.graphContainer!.width = this.graphContainer!.width * xRatio;
      this.graphContainer!.height = this.graphContainer!.height * yRatio;
      /**        console.log(
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
      this.createMask();
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
      px_mask_outter_bounds.beginFill();
      px_mask_outter_bounds.drawRect(
        this.paddingRL,
        0,
        this.width.actual - 2 * this.paddingRL,
        this.height.actual
      );
      px_mask_outter_bounds.endFill();
      px_mask_outter_bounds.renderable = true;
      px_mask_outter_bounds.cacheAsBitmap = true;
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
      this.coordinateContainer?.removeChildren();
      let xPosition = this.width.actual - this.paddingRL;
      let yPosition = 0;
      const distLinesY = this.height.actual / (this.numberOfOutputs + 1 + 1);
      const distLinesX = (this.width.actual - 2 * this.paddingRL) / 5;
      let duration = this.maxDurationStore / 1000;
      const timeInterval = duration / 5;

      const graphics = new PIXI.Graphics();
      graphics.lineStyle(1, 0x000000, 1);

      //draw horizontal lines
      for (let i = 0; i < this.numberOfOutputs + 1; i++) {
        yPosition += distLinesY;
        graphics.moveTo(this.paddingRL, yPosition);
        graphics.lineTo(this.width.actual - this.paddingRL, yPosition);
      }

      //draw vertical lines and labels
      for (let i = 0; i <= 5; i++) {
        graphics.moveTo(xPosition, yPosition - 10);
        graphics.lineTo(xPosition, yPosition + 10);
        const label = new PIXI.Text(duration.toString() + " s", {
          fontFamily: "Arial",
          fontSize: 12,
          align: "center",
        });
        let xOffset = 8;
        label.resolution = 3;
        if (duration >= 10) xOffset = 12;

        label.x = xPosition - xOffset;
        label.y = yPosition + 15;
        this.coordinateContainer?.addChild(label);
        duration -= timeInterval;
        xPosition -= distLinesX;
      }

      this.coordinateContainer?.addChild(graphics);
    },
    /**
     * method to resize the figures, if the max duration is changed
     */
    resizeRectangles() {
      const channels = this.store.state.tactonSettings.outputChannelState;
      for (let i = 0; i < channels.length; i++) {
        const graph = this.channelGraphs.find(
          (graph) => graph.channelId == channels[i].channelId
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
            graph.channelId,
            intensityArray[z].startTime! * this.growRatio + this.paddingRL,
            duration * this.growRatio,
            intensityArray[z].intensity,
            graph.container as PIXI.Container,
            intensityArray[z].author
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
      this.graphContainer?.removeChild(this.endOfTactonIndicator.getContainer())
      this.channelGraphs = [];
      if (this.ticker !== null && this.ticker.count > 0) {
        console.log('stopped ticker')
        this.ticker?.remove(this.loop);
      }
      console.log('starting ticker')
      this.ticker?.add(this.loop);
    },
    drawStoredGraph(instructions: TactonInstruction[]) {
      const getMillisForIndex = (instructions: TactonInstruction[], from: number, to: number): number => {
        let ms = 0
        for (let index = from; index < to; index++) {
          const instruction = instructions[index];
          if (isInstructionWait(instruction)) {
            const wi = instruction as InstructionWait
            ms += wi.wait.miliseconds
          }
        }

        return ms
      }

      //Work on each channel
      for (let i = 0; i < this.numberOfOutputs; i++) {
        let accumulatedMs = 0
        /*  */
        //Find all setParameter Instructions that are associated with the channel Id (i)
        var indices = instructions.map((instruction, index) => isInstructionSetParameter(instruction) ? index : -1).filter(e => {
          if (e == -1) return false
          const sp = instructions[e] as InstructionSetParameter
          return sp.setParameter.channelIds.includes(i)
        })


        // Für die  erste Instruction muss auch der Startpunkt in MS bestimmt werden   
        let channelBeginningMs = getMillisForIndex(instructions, 0, indices[0])
        accumulatedMs = channelBeginningMs
        //Instead of using a timer, use the accumulated wait instructions to get the millisecond value for drawing the boxes
        for (let j = 0; j < indices.length - 1; j++) {
          let timeBetweenInstructionsMs = getMillisForIndex(instructions, indices[j], indices[j + 1])

          const graph = this.channelGraphs.find(
            (graph) => graph.channelId == i
          );
          const additionalWidth = this.growRatio * timeBetweenInstructionsMs
          // console.log(instructions[indices[j]])

          if (graph == undefined) {
            const container = new PIXI.Container();

            let xPosition = this.width.original - this.paddingRL;
            if (accumulatedMs < this.maxDurationStore)
              xPosition =
                (xPosition * accumulatedMs) / this.maxDurationStore +
                this.paddingRL;
            //Go thorugh InstructionToClient object, for each channel in channelIds
            const intensityObject = this.drawRectangle(
              i,
              xPosition,
              additionalWidth,
              (instructions[indices[j]] as InstructionSetParameter).setParameter.intensity,
              container,
              undefined
            );
            this.channelGraphs.push({
              channelId: i,
              container: container,
              intensities: [
                {
                  ...intensityObject,
                  startTime: accumulatedMs,
                  endTime: accumulatedMs + accumulatedMs,
                },
              ],
            });

            this.graphContainer?.addChild(container);
            ///this.ticker?.stop();
          } else {
            //intensity or author changed, draw new rectangle
            const xPosition =
              ((this.width.original - 2 * this.paddingRL) * accumulatedMs) /
              this.maxDurationStore +
              this.paddingRL;

            const intensityObject = this.drawRectangle(
              i,
              xPosition,
              additionalWidth,
              (instructions[indices[j]] as InstructionSetParameter).setParameter.intensity,
              graph.container as PIXI.Container,
              undefined
            );

            graph.intensities.push({
              ...intensityObject,
              startTime: accumulatedMs,
              endTime: accumulatedMs + accumulatedMs,
            });
          }

          accumulatedMs += timeBetweenInstructionsMs
          // console.log(`Starts at ${channelBeginningMs}ms, curently ${timeBetweenInstructionsMs} ending at ${accumulatedMs}`)

        }


      }
      /* 
        filter the instructions for each channel, also get the index
        calaculate the time between each change by summing up all wait instructions between the first and the second instruction
      */
      console.log(instructions)


    },
    drawLiveGraph(channels: OutputChannelState[]) {
      const additionalWidth = this.growRatio * this.ticker!.elapsedMS;
      for (let i = 0; i < channels.length; i++) {
        const graph = this.channelGraphs.find(
          (graph) => graph.channelId == channels[i].channelId
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
          const intensityObject = this.drawRectangle(
            i,
            xPosition,
            additionalWidth,
            channels[i].intensity,
            container,
            channels[i].author
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

            const intensityObject = this.drawRectangle(
              i,
              xPosition,
              additionalWidth,
              channels[i].intensity,
              graph.container as PIXI.Container,
              channels[i].author
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
        this.cursor.drawCursor(this.height.actual)
      }
      this.cursor.moveToPosition(time * this.growRatio + this.paddingRL)
      this.graphContainer?.addChild(this.cursor.getContainer())

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
      idGraph: number,
      xPosition: number,
      additionalWidth: number,
      intensity: number,
      container: PIXI.Container,
      author?: User
    ) {
      // not du anything at intensity of 0
      if (intensity == 0) return { intensity: 0 };
      //+1 for the legend, + 1 because numberOfOutputs starts counting at 0
      const numberOfRows = this.numberOfOutputs + 1 + 1;
      const distLinesY = this.height.original / numberOfRows;
      const ratioHeight = 35 / numberOfRows;
      const height = (distLinesY - ratioHeight * numberOfRows) * intensity;
      let yPosition = (idGraph + 1) * distLinesY - height * 0.5;

      //console.log("draw Rectangle at x: " + xPosition);
      // console.log(draw Rectangle at x: " + yPosition)
      //console.log("draw Rectangle width: " + additionalWidth);
      //console.log("draw Rectangle height: " + height);
      // draw the rectangle
      const rect = new PIXI.Graphics();

      //calculate colour
      if (author == undefined) {
        rect.beginFill(0x6c6c60);
      } else {
        const customColor: number = parseInt("0x" + author.color.slice(1));
        rect.beginFill(customColor);
      }
      rect.drawRect(0, 0, additionalWidth, height);
      rect.position.set(xPosition, yPosition);

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
     * method wich will called every frame, to draw and update figures
     */
    loop() {
      console.log("loop")
      //calculate the additional width, which has to add for the time frame
      const numOfInst = this.channelGraphs.reduce((acc, val) => acc + val.intensities.length, 0)
      if (numOfInst == this.numberOfOutputs) {
        this.currentTime = 0;
      }
      const channels = this.store.state.tactonSettings.outputChannelState;
      this.drawLiveGraph(channels)
      this.positionCursor(this.currentTime)
      this.currentTime += this.ticker!.elapsedMS;
    },
  },
});
</script>
