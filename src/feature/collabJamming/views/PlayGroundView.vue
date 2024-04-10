<!-- Component for the playGround -->
<!-- display the time profiles and the buttons to control the vibrotactile device -->
<template>
  <PlayGroundHeader />
  <PlayGroundBody />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PlayGroundBody from "./playGroundComponents/PlayGroundBody.vue";
import PlayGroundHeader from "./playGroundComponents/PlayGroundHeader.vue";

export default defineComponent({
  name: "PlayGroundView",
  components: {
    PlayGroundBody,
    PlayGroundHeader,
  },
});
</script>
