<!--svg for image with letter icon -->
<template>
  <svg
    width="30"
    height="30"
    viewBox="0 0 30 30"
    @click="$emit('displayMenuDialog')"
    :class="['svgImage', isFirstEntry ? '' : 'secondEntries']"
    :cursor="clickable == true ? 'pointer' : ''"
  >
    <path :fill="color" d="m0,15a15,15 0 1 1 30,0a15,15 0 1 1 -30,0" />
    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      stroke="white"
      stroke-width="2px"
      dy=".4em"
    >
      {{ letter }}
    </text>
  </svg>
</template>

<style lang="scss" scoped>
.svgImage {
  display: flex;
  align-items: center;
  height: 100%;
}
.secondEntries {
  margin-left: -10px;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UserMenuCustomProfile",
  emits: ["displayMenuDialog"],
  props: {
    letter: {
      type: String,
      default: "A",
    },
    color: {
      type: String,
      default: "#000000",
    },
    isFirstEntry: {
      type: Boolean,
    },
    clickable: {
      type: Boolean,
    },
  },
});
</script>
