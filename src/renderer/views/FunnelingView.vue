<template>
  <h2>1D Funelling Illusion</h2>
  <div id="funneling-illusion">
    <v-alert v-if="!hardwareIsReady" type="warning" variant="tonal">
      Please connect tactile displays with at least two actuators connected!
    </v-alert>
    <v-row>
      <!-- MARK: Illusion Settings -->
      <v-col cols="8">
        <v-row>
          <v-col>
            <v-card>
              <v-card-title> Playback </v-card-title>
              <v-container>
                <v-row>
                  <v-col cols="10">
                    <v-radio-group
                      v-model="modeSelection"
                      :disabled="isRunning"
                      inline
                      hide-details
                    >
                      <v-radio label="Permanent" value="Permanent"></v-radio>
                      <v-radio label="Pulse" value="Pulse"></v-radio>
                      <v-radio
                        label="Looping Pulse"
                        value="Looping Pulse"
                      ></v-radio>
                    </v-radio-group>
                  </v-col>
                  <v-col>
                    <v-btn
                      :disabled="!hardwareIsReady"
                      @click="vibrate"
                      :icon="isRunning ? 'mdi-stop' : 'mdi-play'"
                      size="x-large"
                    >
                      Trigger vibration
                    </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-card>
            <v-card>
              <v-card-title> Illusion Parameter </v-card-title>
              <v-slider
                hide-details
                max="1"
                min="0.05"
                step="0.05"
                show-ticks
                thumb-label
                v-model="maxAmp"
              >
                <template v-slot:prepend> Maximal Amplitude </template>
                <template v-slot:append>
                  {{ maxAmp.toFixed(2) }}
                </template>
              </v-slider>
              <v-slider
                hide-details
                max="1"
                min="0"
                step="0.05"
                show-ticks
                thumb-label
                v-model="slider"
              >
                <template v-slot:prepend>
                  Left: {{ slider.toFixed(2) }}
                </template>

                <template v-slot:append>
                  Right: {{ (1 - slider).toFixed(2) }}
                </template>
              </v-slider>
            </v-card>
            <v-card>
              <v-card-title> Pulsing Parameter </v-card-title>
              <v-slider
                hide-details
                :disabled="modeSelection == 'Permanent'"
                max="1000"
                min="50"
                step="50"
                show-ticks
                thumb-label
                v-model="pulseMs"
              >
                <template v-slot:prepend> Pulse duration </template>
                <template v-slot:append> {{ pulseMs }}ms </template>
              </v-slider>
              <v-slider
                hide-details
                :disabled="modeSelection != 'Looping Pulse'"
                max="1000"
                min="50"
                step="50"
                show-ticks
                thumb-label
                v-model="interPulseMs"
              >
                <template v-slot:prepend> Inter Pulse Interval </template>
                <template v-slot:append> {{ interPulseMs }}ms </template>
              </v-slider>
            </v-card>
          </v-col>
          <v-col>
            <actuator-selection-menu
              :disabled="isRunning"
              :numActuators="2"
              v-model="actuators"
            ></actuator-selection-menu>
          </v-col>
        </v-row>
        <!-- MARK: Mode selection and playback -->

        <!-- <img :src="require('../assets/handshake_openmoji.png')" /> -->
        <!-- <v-dialog v-model="showActuatorSelection" persistent width="1500">
			<v-btn color="error" @click="showActuatorSelection = !showActuatorSelection">
				Exit
			</v-btn> -->
      </v-col>
      <!-- MARK: Infos -->
      <v-col> </v-col>
    </v-row>
  </div>
  <!-- {{ actuators }} -->
  <!-- </v-dialog> -->
  <!-- 
- Check if one device with at least two displays is connected or two devices with at least one device

- Select Left Actuator
- Select Right Actuator

- Add a slider for where the virtual actuator is placed
  -->
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import ActuatorSelectionMenu from "@/renderer/components/ActuatorSelectionMenu.vue";
import { ActuatorSelection } from "@/renderer/helpers/TactileDisplayValidation";

export default defineComponent({
  name: "Funneling",
  components: { ActuatorSelectionMenu },
  data() {
    return {
      store: useStore(),
      slider: 0.5,
      isRunning: false,
      leftIntensity: 0,
      rightIntensity: 0,
      showActuatorSelection: false,
      actuators: new Array<ActuatorSelection>(),
      maxAmp: 1,
      pulseMs: 100,
      interPulseMs: 100,
      modeSelection: "Permanent",
      fOnHandler: 0,
      fOffHandler: 0,
    };
  },
  computed: {
    hardwareIsReady(): boolean {
      const d = this.store.getters.getNumberOfConnectedDisplays > 0;
      if (!d) return false;

      const a =
        this.store.state.deviceManager.connectedTactileDisplays[0]
          .numOfOutputs >= 2;
      if (!a) return false;

      const s = this.actuators.length == 2;
      return s;
    },
  },
  watch: {
    maxAmp: function () {
      if (this.modeSelection != "Looping Pulse") {
        this.updateFunneling();
        if (this.isRunning) {
          this.updateVibration();
        }
      }
    },
    slider: function () {
      if (this.modeSelection != "Looping Pulse") {
        this.updateFunneling();
        if (this.isRunning) {
          this.updateVibration();
        }
      }
    },
  },
  methods: {
    updateFunneling() {
      this.leftIntensity = this.maxAmp * Math.sqrt(1 - this.slider);
      this.rightIntensity = this.maxAmp * Math.sqrt(this.slider);
    },
    writeValues(leftIntensity: number, rightIntensity: number) {
      window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, {
        deviceId: this.actuators[0].deviceUuid,
        taskList: [
          {
            channelIds: [this.actuators[0].actuator],
            intensity: leftIntensity,
          },
          {
            channelIds: [this.actuators[1].actuator],
            intensity: rightIntensity,
          },
        ],
      });
    },
    async ping() {
      this.isRunning = true;
      this.writeValues(this.leftIntensity, this.rightIntensity);
      await new Promise((r) => setTimeout(r, this.pulseMs));
      this.writeValues(0, 0);
      this.isRunning = false;
    },
    vibrate() {
      const fOn = () => {
        this.isRunning = true;
        this.updateFunneling();
        this.updateVibration();
        // call fOff after wait
        this.fOffHandler = window.setTimeout(() => {
          window.clearTimeout(this.fOffHandler);
          fOff();
        }, this.pulseMs);
      };
      const fOff = () => {
        this.stopVibration();
        this.fOnHandler = window.setTimeout(() => {
          window.clearTimeout(this.fOnHandler);
          fOn();
        }, this.interPulseMs);
      };
      if (this.modeSelection == "Permanent") {
        this.toggleVibration();
      } else if (this.modeSelection == "Pulse") {
        this.toggleVibration();
        window.setTimeout(() => {
          this.toggleVibration();
        }, this.pulseMs);
      } else {
        if (this.isRunning) {
          window.clearTimeout(this.fOnHandler);
          window.clearTimeout(this.fOffHandler);
          this.toggleVibration();
        } else {
          fOn();
        }
      }
    },
    updateVibration() {
      this.writeValues(this.leftIntensity, this.rightIntensity);
    },
    stopVibration() {
      this.writeValues(0, 0);
    },
    toggleVibration() {
      this.isRunning = !this.isRunning;
      if (this.isRunning) {
        this.updateFunneling();
        this.updateVibration();
      } else {
        this.stopVibration();
      }
      return false;
    },
  },
});
</script>
