<template>
  <!--MARK: Recording-->
  <v-virtual-scroll :items="rooms">
    <template #default="{ item }">
      <v-list-item
        :disabled="!enabled"
        :title="item.name"
        :active="item.id == selection?.id"
        @click="selectRoom(item)"
      >
      </v-list-item>
    </template>
  </v-virtual-scroll>
</template>

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
    enabled: {
      type: Boolean,
      required: false,
      default: true,
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
    rooms() {
      const r = this.store.state.roomSettings.availableRooms;
      r.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
      return r;
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
