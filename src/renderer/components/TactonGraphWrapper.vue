<template>
  <v-row
    no-gutters
    align="center"
    style="justify-content: space-evenly; margin: 5px 0"
    id="tactonHeader"
  >
  </v-row>
  <TactonGraph :is-mounted="isMounted" />
</template>

<style scoped="scss"></style>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { WebSocketAPI } from "@/main/WebSocketManager";
import TactonGraph from "./TactonGraph.vue";
import { InteractionMode } from "@sharedTypes/roomTypes";

export default defineComponent({
  name: "TactonGraphWrapper",
  components: { TactonGraph /* PixiTest */ /*TactonSelectionList */ },
  props: {
    isMounted: {
      type: Boolean,
    },
  },
  data() {
    return {
      store: useStore(),
    };
  },
  computed: {
    maxDurationStore(): number {
      return this.store.state.roomSettings.maxDuration;
    },
    duration: {
      get(): string {
        return (this.maxDurationStore / 1000).toString() + "s";
      },
      set(newValue: string) {
        WebSocketAPI.updateTactonDuration({
          roomId: this.store.state.roomSettings.id || "",
          duration: parseInt(newValue.substring(0, newValue.length - 1)) * 1000,
        });
      },
    },
    mode(): InteractionMode {
      return this.store.state.roomSettings.mode;
    },
  },
  methods: {
    // saveTacton() {
    //   sendSocketMessage(WS_MSG_TYPE.GET_TACTON_SERV, {
    //     roomId: this.store.state.roomSettings.id,
    //     shouldRecord: false,
    //   });
    // },
  },
});
</script>
