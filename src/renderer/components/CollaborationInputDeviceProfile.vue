<template>
  <div class="input-device-info mb-8">
    <v-card class="mx-auto">
      <v-card-title>
        {{
          name.indexOf("(") == -1 ? name : name.substring(0, name.indexOf("("))
        }}
      </v-card-title>
      <inline-svg class="input-device-illustration" :src="imagePath" />
      <v-card-actions>
        <v-radio-group
          inline
          hide-details
          color="primary"
          v-model="selectedProfileUid"
        >
          <v-radio
            v-for="profile in allProfileOptions"
            :key="profile.value"
            :label="profile.title"
            :value="profile.value"
          ></v-radio>
        </v-radio-group>
      </v-card-actions>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
// .input-device-info {
//   // max-width: 100%;
//   // max-height: 20vh;
//   // height: 33.3%;
// }

.input-device-illustration {
  // max-height: 25vh
  // max-width: 90%;
}
</style>
<script lang="ts">
import getDeviceName from "@/main/Input/InputDetection/getDeviceName";
import { useStore } from "@/renderer/store/store";
import { InputDevice } from "@sharedTypes/InputDetection/InputBindings";
import { defineComponent } from "vue";
import defaultImagePath from "@/renderer/assets/inputs/controller.svg";
import { PlayGroundMutations } from "@/renderer/store/modules/collaboration/playGround/types";
import { StateProfile } from "@/renderer/store/modules/collaboration/playGround/playGround";

export default defineComponent({
  name: "CollaborationInputDeviceProfile",
  props: {
    device: {
      type: Object as () => InputDevice,
      required: true,
    },
  },
  data() {
    return {
      store: useStore(),
      selectedProfileUid: null as string | null,
      profileCheckbox: null as string | null,
    };
  },
  mounted() {
    const profile = this.currentProfile;
    if (profile) this.selectedProfileUid = profile.uid;
    else this.selectedProfileUid = this.allProfileOptions[0]?.value;
  },
  computed: {
    selectedProfile(): StateProfile | undefined {
      return this.store.state.playGround.profiles.find(
        (profile) => profile.uid == this.selectedProfileUid,
      );
    },
    currentProfile(): StateProfile | undefined {
      return this.store.getters.getProfileByDevice(this.device);
    },
    name(): string {
      return getDeviceName(this.device);
    },
    imagePath(): string {
      if (this.selectedProfile) {
        return this.selectedProfile.imagePath;
      } else {
        return defaultImagePath;
      }
    },
    allProfileOptions(): { title: string; value: string }[] {
      const allProfiles = this.store.state.playGround.profiles;
      return allProfiles
        .filter((profile) => profile.deviceType === this.device.type)
        .map((profile) => ({ title: profile.name, value: profile.uid }));
    },
  },
  methods: {
    updateProfile() {
      if (!this.selectedProfileUid) return;
      this.store.commit(PlayGroundMutations.UPDATE_PROFILE, {
        device: this.device,
        profileUid: this.selectedProfileUid,
      });
    },
  },
  watch: {
    selectedProfileUid() {
      this.updateProfile();
    },
    selectedProfile(val) {
      const p = val as StateProfile;
      this.selectedProfileUid = p.uid;
    },
  },
});
</script>
