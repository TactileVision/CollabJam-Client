<template>
  <h3>Room Information</h3>
  {{ room?.name }}
  <RoomParticipantList :filter-user="false" />
  <!-- {{ room?.participants }} -->
</template>

<style scoped lang="scss"></style>

<script lang="ts">
import { Room } from "@/shared/types/roomTypes";
import { PropType, defineComponent } from "vue";
import { useStore } from "vuex";
import RoomParticipantList from "@/renderer/components/RoomParticipantList.vue";

export default defineComponent({
  name: "RoomInformation",
  components: { RoomParticipantList },
  props: {
    room: {
      type: null as unknown as PropType<Room | null>,
      required: true,
    },
  },
  data() {
    return {
      store: useStore(),
    };
  },
  computed: {},
  watch: {},
  methods: {},
});
</script>
