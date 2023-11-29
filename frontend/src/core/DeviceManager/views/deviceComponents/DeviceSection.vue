<template>
  <v-container fill-height class="">
    <v-row no-gutters style="padding-bottom:10px">
      <v-btn elevation="2" color="primary" @click="startScanning">
        <v-progress-circular v-if="isScanning" indeterminate color="red" :size="20"
          style="margin-right: 10px"></v-progress-circular>
        {{ isScanning ? "Stop" : "Start" }} Scanning
      </v-btn>
    </v-row>
    <!-- <v-row class="test"> -->
    <!-- <v-container class="listSection"> -->
    <v-list :items="bleDevices">
      <v-list-item v-for="item in bleDevices" :key="item.id" style="padding:0">
        <DeviceRow :device="item" />
      </v-list-item>
    </v-list>
    <v-list :items="midiOutputs">
      <v-list-item v-for="item in midiOutputs" :key="item.id" style="padding:0" :title="item.name"> </v-list-item>
    </v-list>
    <!-- <v-list-item v-for="item in deviceList" :key="item.id" style="padding:0">
          <DeviceRow :device="item" />
        </v-list-item>
        </v-list>
        <v-list-item v-for="item in deviceList" :key="item.id" style="padding:0">
          <DeviceRow :device="item" />
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

.listSection {
  margin: 0;
  padding: 0;
  max-width: 100% !important;
  min-width: 100% !important;
}

.test {
  margin: 0;
  flex-grow: 1;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels";
import DeviceRow from "./deviceRow.vue";
import { useStore } from "@/app/store/store";
import { VibrotactileDevice, GeneralMutations } from "@/app/store/modules/generalSettings/generalSettings";
import { MidiInputInfo, MidiOutputInfo } from "@sharedTypes/midiTypes";

export default defineComponent({
  components: { DeviceRow },
  name: "DeviceSection",
  data() {
    return {
      isScanning: false,
      store: useStore(),
    };
  },
  computed: {
    bleDevices(): VibrotactileDevice[] {
      return this.store.state.generalSettings.deviceList;
    },
    midiInputs(): MidiInputInfo[] {
      return this.store.state.deviceManager.midiInputs;
    },
    midiOutputs(): MidiOutputInfo[] {
      return this.store.state.deviceManager.midiOutputs;
    }
  },
  methods: {
    startScanning() {
      window.api.send(IPC_CHANNELS.midi.main.startMidi, {});

      /*       this.isScanning = !this.isScanning;
            if (this.isScanning)
              this.store.commit(GeneralMutations.UPDATE_DEVICE_LIST, []);
            window.api.send(IPC_CHANNELS.main.changeScan, this.isScanning); */
    },
  },
});
</script>