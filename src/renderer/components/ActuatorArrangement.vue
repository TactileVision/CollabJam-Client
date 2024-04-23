<template>
  <v-card>
    <v-card-title> Actuator Arrangement </v-card-title>
    <draggable
      v-model="localModelValue"
      group="people"
      @start="drag = true"
      @end="drag = false"
      :item-key="'${deviceUuid}${actuator}'"
    >
      <template #item="{ element: e }">
        <div
          class="actuator"
          :style="'background-color:' + getColorForDevice(e.deviceUuid)"
        >
          {{ e.actuator + 1 }}
        </div>
      </template>
    </draggable>
  </v-card>
</template>

<style lang="scss" scoped>
.actuator {
  display: inline-block;
  margin: 1em;
  padding: 1em;
  border-radius: 100%;
  // background-color: rgb(96, 84, 19);
  user-select: none;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { ActuatorSelection } from "@/renderer/helpers/TactileDisplayValidation";
import draggable from "vuedraggable";
import { useStore } from "vuex";
import { defaultColors } from "../plugins/colors";

export default defineComponent({
  name: "ActuatorArrangement",
  components: { draggable },
  emits: ["update:modelValue"],
  data() {
    return {
      store: useStore(),
      drag: false,
      colorDeviceMap: new Map<string, string>(),
    };
  },
  computed: {
    localModelValue: {
      get(): ActuatorSelection[] | undefined {
        return this.modelValue;
      },
      set(newValue: ActuatorSelection[]) {
        this.$emit("update:modelValue", newValue);
      },
    },
  },
  props: {
    modelValue: {
      type: Object as () => ActuatorSelection[],
      required: true,
    },
  },
  methods: {
    getColorForDevice(uuid: string) {
      if (!this.colorDeviceMap.has(uuid)) {
        this.colorDeviceMap.set(uuid, defaultColors[this.colorDeviceMap.size]);
      }
      return this.colorDeviceMap.get(uuid);
    },
  },
});
</script>
