<template>
  <v-row
    no-gutters
    align="center"
    style="justify-content: space-evenly; margin: 5px 0"
    id="tactonHeader"
  >
  </v-row>
  <!-- <TactonGraph :isMounted="isMounted" /> -->
  <!-- </v-col> -->
</template>

<style lang="scss">
.mode-indicator {
  display: block;
  width: 100%;
  user-select: none;
  &.recording {
    > span {
      color: white;
    }

    background-color: red;
  }

  &.jamming {
    background-color: green;
  }

  &.playback {
    background-color: yellow;
  }

  > span {
    display: block;
    margin: auto;
    padding: 1em;
    text-align: center;
    font-weight: bold;
  }
}

.durationBox {
  padding-left: 10px;
  max-width: 100px;

  .v-input__control {
    height: 40px !important;
    max-height: 40px !important;
    display: flex;

    .v-field {
      .v-label {
        display: none;
      }

      .v-field__append-inner {
        display: flex;
        height: 40px !important;
        align-items: center;
        padding-top: 0;
      }

      .v-field__field {
        height: 40px !important;
        max-height: 40px !important;
        display: flex;
        padding-top: 0;
      }
    }
  }

  .v-input__details {
    display: none;
  }
}
</style>
<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { useStore } from "@/app/store/store";
import { sendSocketMessage } from "@/core/WebSocketManager";
import TactonGraph from "./TactonGraph.vue";
import { InteractionMode } from "@sharedTypes/roomTypes";
import { WS_MSG_TYPE } from "@sharedTypes/websocketTypes";

export default defineComponent({
  name: "TactonScreen",
  components: { TactonGraph /* , TactonSelectionList */ },
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
      set(newValue: any) {
        sendSocketMessage(WS_MSG_TYPE.CHANGE_DURATION_SERV, {
          roomId: this.store.state.roomSettings.id,
          duration: newValue.substring(0, newValue.length - 1) * 1000,
        });
      },
    },
    mode(): InteractionMode {
      return this.store.state.roomSettings.mode;
    },
  },
  methods: {
    saveTacton() {
      sendSocketMessage(WS_MSG_TYPE.GET_TACTON_SERV, {
        roomId: this.store.state.roomSettings.id,
        shouldRecord: false,
      });
    },
  },
});
</script>
