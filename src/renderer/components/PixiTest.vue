<template>
  <div id="pixiTest"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as PIXI from "pixi.js";
import "pixi.js/unsafe-eval";
export default defineComponent({
  name: "PixiTest",
  data() {
    return {};
  },
  async mounted() {
    const app = new PIXI.Application();

    await app.init({
      background: "#1099bb",
      backgroundAlpha: 1,
      // resizeTo: window,
    });
    app.canvas.width = 1000;
    app.canvas.height = 690;
    document.getElementById("pixiTest")?.appendChild(app.canvas);

    const basicText = new PIXI.Text({ text: "Basic text in pixi" });
    basicText.x = 10;
    basicText.y = 10;

    const graphics = new PIXI.Graphics();
    graphics.setStrokeStyle({
      width: 1,
      color: 0x000000,
      alpha: 1,
      matrix: new PIXI.Matrix(), // The neccessary inclusion of the matrix parameter seems like a bug to me
    });
    graphics.rect(100, 100, 100, 100).fill({ color: "0xfefefe" });
    graphics.moveTo(0, 0 - 10);
    graphics.lineTo(500, 500).stroke();
    const container = new PIXI.Container();
    container.addChild(graphics);
    container.addChild(basicText);
    app.stage.addChild(container);

    // Load the bunny texture.
  },
});
</script>
