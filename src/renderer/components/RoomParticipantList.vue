<template>
  <v-row
    v-for="(item, i) in participantList"
    :key="i"
    :value="item"
    no-gutters
    style="justify-content: center"
  >
    <v-col cols="2">
      <UserMenuCustomProfile
        v-if="item.name !== ''"
        :letter="item.name.charAt(0).toUpperCase()"
        :color="item.color"
        :is-first-entry="true"
        :clickable="false"
      />
      <UserMenuDefaultProfile
        v-else
        :color="item.color"
        :is-first-entry="true"
        :clickable="false"
      />
    </v-col>
    <v-col cols="7" style="padding-top: 4px">
      {{ item.name == "" ? "Guest" : item.name }}
    </v-col>
  </v-row>
</template>

<style scoped lang="scss"></style>
<script lang="ts">
import { useStore } from "@/renderer/store/store";
import { defineComponent } from "vue";
import UserMenuDefaultProfile from "@/renderer/components/UserMenuDefaultProfile.vue";
import UserMenuCustomProfile from "@/renderer/components/UserMenuCustomProfile.vue";
export default defineComponent({
  name: "RoomParticipantList",
  components: {
    UserMenuDefaultProfile,
    UserMenuCustomProfile,
  },
  data: () => ({
    store: useStore(),
  }),
  computed: {
    participantList(): [] | { id: string; name: string; color: string }[] {
      if (this.store.state.roomSettings.participants == undefined) return [];
      return this.store.state.roomSettings.participants.filter(
        (user) => user.id !== this.store.state.roomSettings.user.id,
      );
    },
  },
});
</script>
