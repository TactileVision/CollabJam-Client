<template>
  <h2>Entrance Check at Door example</h2>
  <v-alert v-if="actuators.length < 2" type="warning" variant="tonal">
    Please connect tactile displays with at least two actuators connected!
  </v-alert>
  <v-row>
    <v-col cols="8">
      <v-radio-group
        :disabled="actuators.length < 2"
        v-model="userCurrentStep"
        inline
      >
        <v-radio label="No contact" value="0"></v-radio>
        <v-radio label="Touches door" value="1"></v-radio>
        <v-radio label="Pushes Down 1" value="2"></v-radio>
        <v-radio label="Pushes Down 2" value="3"></v-radio>
        <v-radio label="Completely pushed down" :value="4"></v-radio>
      </v-radio-group>
      <!-- <v-slider :disabled="actuators.length < 2" hide-details min="0" step="1" max="4" show-ticks
				v-model="userCurrentStep">
				<template v-slot:prepend>
					{{ getDescriptionForUserStep(this.userCurrentStep) }}
				</template>
			</v-slider> -->
    </v-col>
    <v-col>
      <actuator-selection-menu
        :disabled="isRunning"
        :num-actuators="2"
        v-model="actuators"
      ></actuator-selection-menu>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import ActuatorSelectionMenu from "@/renderer/components/ActuatorSelectionMenu.vue";
import { ActuatorSelection } from "@/renderer/helpers/TactileDisplayValidation";
import { atm, stopAtm } from "@/renderer/helpers/atm";
interface outParams {
  amp: number;
  bd: number;
  interval: number;
}
export default defineComponent({
  name: "EntranceControl",
  components: { ActuatorSelectionMenu },
  data() {
    return {
      actuators: new Array<ActuatorSelection>(),
      userCurrentStep: 0,
      userAllowed: true,
      isRunning: false,
      restartTimeout: 0,
      params: [
        {}, //0 (dummy for easier index accces)
        { amp: 0.5, bd: 500, interval: 2000 }, // 1
        { amp: 0.66, bd: 250, interval: 1000 }, // 2
        { amp: 0.75, bd: 125, interval: 500 }, // 3
        { amp: 1, bd: 70, interval: 100 }, // 4
      ] as outParams[],
    };
  },
  methods: {
    getDescriptionForUserStep(step: number): string {
      if (step == 0) {
        return "No contact";
      } else if (step == 1) {
        return "Touches door";
      } else if (step < 4) {
        return "Pushes Down";
      } else {
        return "Completely pushed down";
      }
    },
    restart() {
      stopAtm(this.actuators);
      let intMs = this.params[this.userCurrentStep].interval;
      let amp = this.params[this.userCurrentStep].amp;
      let bd = this.params[this.userCurrentStep].bd;
      clearTimeout(this.restartTimeout);
      this.restartTimeout = window.setTimeout(() => {
        console.log("Restarting");
        atm(this.actuators, bd, amp, this.restart);
      }, intMs);
    },
  },
  watch: {
    userCurrentStep: function () {
      console.log("Step changed");
      console.log(this.userCurrentStep);
      if (this.userCurrentStep == 0) {
        stopAtm(this.actuators);
        clearTimeout(this.restartTimeout);
        this.isRunning = false;
        //TODO Stop all vibrations
        //TODO only start when actuator selection is bigger 1 all vibrations
      } else {
        this.isRunning = true;
        let amp = this.params[this.userCurrentStep].amp;
        let bd = this.params[this.userCurrentStep].bd;
        atm(this.actuators, bd, amp, this.restart);
      }
    },
  },
});
</script>
