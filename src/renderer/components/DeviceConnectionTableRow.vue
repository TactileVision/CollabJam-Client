<template>
  <v-row no-gutters>
    <v-col cols="3">{{ `Name: ${device.name}` }}</v-col>
    <v-col cols="2">
      <DeviceConnectionLevelIndicator :connection-quality="device.rssi" />
    </v-col>
    <v-col cols="3">{{ `Status: ${device.state}` }}</v-col>
    <v-spacer />
    <v-col
      cols="1"
      style="display: flex; justify-content: flex-end, padding:0px 5px,"
      v-if="device.state == 'connected' ? true : false"
      ><v-btn @click="vibrateDevice(device.id)" elevation="2" color="primary">
        <v-progress-circular
          v-if="isVibrating"
          indeterminate
          color="red"
          :size="20"
        ></v-progress-circular>
        Retry</v-btn
      >
    </v-col>

    <v-col style="display: flex; justify-content: flex-end" cols="3"
      ><v-btn @click="changeConnectionStatus" elevation="2" color="primary">
        {{ device.state == "connected" ? "Disconnect" : "Connect" }}</v-btn
      >
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
import { defineComponent } from "vue";
import {
  DeviceStatus,
  VibrotactileDevice,
} from "@/renderer/store/modules/generalSettings/generalSettings";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { useStore } from "@/renderer/store/store";
import DeviceConnectionLevelIndicator from "./DeviceConnectionLevelIndicator.vue";
import { pingDisplayViaIPC } from "@/renderer/helpers/TactileDisplayActions";

export default defineComponent({
  name: "DeviceConnectionTableRow",
  components: {
    DeviceConnectionLevelIndicator,
  },
  props: {
    device: {
      type: Object as () => VibrotactileDevice,
      required: true,
    },
  },
  data() {
    return {
      isVibrating: false,
      store: useStore(),
    };
  },
  methods: {
    changeConnectionStatus() {
      if (this.device.state == DeviceStatus.connected) {
        window.api.send(IPC_CHANNELS.main.disconnectDevice, {
          deviceId: this.device.id,
        });
      } else {
        window.api.send(IPC_CHANNELS.main.connectDevice, {
          deviceId: this.device.id,
        });
      }
    },
    async vibrateDevice(id: string) {
      this.isVibrating = true;
      pingDisplayViaIPC(id, 1000);
      this.isVibrating = false;
    },
  },
});
</script>
