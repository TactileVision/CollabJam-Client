<template>
  <grid-layout
    :layout="gridItems"
    :col-num="store.state.playGround.gridLayout.x"
    :row-height="rowHeight"
    :max-rows="store.state.playGround.gridLayout.y"
    :is-draggable="store.state.playGround.inEditMode"
    :is-resizable="false"
    :vertical-compact="false"
    :prevent-collision="true"
  >
    <grid-item
      v-for="item in gridItems"
      :key="item.i"
      :static="false"
      :x="item.x"
      :y="item.y"
      :w="item.w"
      :h="item.h"
      :i="item.i"
      @moved="(i, x, y) => movedEvent(item.binding, item.device, x, y)"
      @move="moveEvent"
    >
      <KeyBoardButton
        :binding="item.binding"
        :profile="item.profile"
        :is-moved="isMoved"
        @updateis-moved="updateisMoved"
        @edit-button="(id) => $emit('editButton', id)"
      />
    </grid-item>
  </grid-layout>
</template>

<script>
import { PlayGroundActionTypes } from "@/feature/collabJamming/store/playGround/types";
import { useStore } from "@/app/store/store";
import { defineComponent } from "vue";
import { GridLayout, GridItem } from "vue-grid-layout";
import KeyBoardButton from "./KeyBoardButton.vue";

export default defineComponent({
  name: "GridArea",
  components: {
    GridLayout,
    GridItem,
    KeyBoardButton,
  },
  emits: ["editButton"],
  data: () => ({
    store: useStore(),
    rowHeight: 100,
    isMoved: false,
  }),
  mounted() {
    window.addEventListener("resize", this.resizeScreen);
    this.resizeScreen();
  },
  computed: {
    gridItems() {
      return this.store.state.playGround.profiles.flatMap((profile) =>
        profile.bindings.map((binding) => ({
          i: binding.uid,
          binding,
          profile,
          ...binding.position,
        })),
      );
    },
  },
  methods: {
    movedEvent: function (binding, device, newX, newY) {
      //console.log("MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
      const newPosition = { ...binding.position, x: newX, y: newY };

      this.store.dispatch(PlayGroundActionTypes.updateKeyButton, {
        id: binding.uid,
        device,
        props: { position: newPosition },
      });
    },
    moveEvent: function () {
      //console.log("MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
      this.isMoved = true;
    },
    updateisMoved: function (newValue) {
      this.isMoved = newValue;
    },
    resizeScreen() {
      const height =
        window.innerHeight -
        document.getElementById("gridHeader").clientHeight -
        document.getElementById("headerPlayGround").clientHeight -
        20;

      if (height == undefined || height == null) return;
      this.rowHeight = Math.floor(
        height / this.store.state.playGround.gridLayout.y,
      );
    },
  },
});
</script>
