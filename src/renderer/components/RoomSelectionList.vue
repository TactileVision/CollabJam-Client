<template>
  <!--MARK: Recording-->
  <!-- <v-sheet class="pa-1"> -->
  <!-- <div class="text-overline">Create Tacton</div> -->
  <v-list lines="one" class="selection-list" color="primary" density="compact">
    <v-list-item
      v-for="room of store.state.roomSettings.availableRooms"
      :key="room.id"
      :title="room.name"
      :active="room.id == selection?.id"
      @click="selectRoom(room)"
    >
    </v-list-item>
  </v-list>
</template>

<style lang="scss" scoped>
.selection-list {
  height: 70vh;
  overflow-y: scroll !important;
}
</style>

<script lang="ts">
import { PropType, defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { Room } from "@sharedTypes/roomTypes";

export default defineComponent({
  name: "RoomSelectionList",
  props: {
    modelValue: {
      type: null as unknown as PropType<Room | null>,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      store: useStore(),
      // selection: null as Room | null,
    };
  },
  computed: {
    selection: {
      get: function () {
        return this.modelValue;
      },
      set: function (value: Room | null) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  watch: {},
  methods: {
    selectRoom(room: Room) {
      this.selection = room;
    },
  },
});
</script>
