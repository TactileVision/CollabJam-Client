<template>
  <v-container fill-height class="">
    <v-row no-gutters style="padding-bottom: 10px">
      <v-btn elevation="2" color="primary" @click="startScanning">
        <v-progress-circular
          v-if="isScanning"
          indeterminate
          color="red"
          :size="20"
          style="margin-right: 10px"
        ></v-progress-circular>
        {{ isScanning ? "Stop" : "Start" }} Scanning
      </v-btn>
    </v-row>
    <!-- <v-row class="test"> -->
    <!-- <v-container class="listSection"> -->
    <v-list :items="deviceList">
      <v-list-item v-for="item in deviceList" :key="item.id" style="padding: 0">
        <DeviceConnectionTableRow :device="item" />
      </v-list-item>
    </v-list>
    <!-- <v-list-item v-for="item in deviceList" :key="item.id" style="padding:0">
          <DeviceConnectionTableRow :device="item" />
        </v-list-item>
        </v-list>
        <v-list-item v-for="item in deviceList" :key="item.id" style="padding:0">
          <DeviceConnectionTableRow :device="item" />
        </v-list-item> -->
    <!-- </v-container> -->
    <!-- </v-row> -->
  </v-container>
</template>

<style lang="scss" scoped>
// .deviceView {
//   display: flex;
//   flex-direction: column;
//   max-width: 100% !important;
//   min-width: 100% !important;
//   height: 100%;
//   font-size: 0.8em;
//   flex-shrink: 0;
//   padding:0 10px;
// }

// .listSection {
//   margin: 0;
//   padding: 0;
//   max-width: 100% !important;
//   min-width: 100% !important;
// }

// .test {
//   margin: 0;
//   flex-grow: 1;
// }
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import DeviceConnectionTableRow from "./DeviceConnectionTableRow.vue";
import { useStore } from "@/renderer/store/store";
import {
  VibrotactileDevice,
  GeneralMutations,
} from "@/renderer/store/modules/generalSettings/generalSettings";

export default defineComponent({
  components: { DeviceConnectionTableRow },
  name: "DeviceConnection",
  data() {
    return {
      isScanning: false,
      store: useStore(),
    };
  },
  computed: {
    deviceList(): VibrotactileDevice[] {
      return this.store.state.generalSettings.deviceList;
    },
  },
  methods: {
    startScanning() {
      this.isScanning = !this.isScanning;
      if (this.isScanning)
        this.store.commit(GeneralMutations.UPDATE_DEVICE_LIST, []);
      window.api.send(IPC_CHANNELS.main.changeScan, {
        scanStatus: this.isScanning,
      });
    },
  },
});
</script>
