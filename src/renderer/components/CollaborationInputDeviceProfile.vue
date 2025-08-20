<template>
  <div class="input-device-info">
    <v-card width="400px">
      <v-card-title>
        {{
          name.indexOf("(") == -1 ? name : name.substring(0, name.indexOf("("))
        }}
      </v-card-title>
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
      <div class="pa-2">
        <inline-svg
          @click="openMappingImage = true"
          style="cursor: pointer"
          class="input-device-thumbnail"
          :src="thumbnailPath"
        />
      </div>
    </v-card>
  </div>
  <v-dialog width="600px" v-model="openMappingImage">
    <v-card>
      <v-card-title>
        {{
          name.indexOf("(") == -1 ? name : name.substring(0, name.indexOf("("))
        }}
      </v-card-title>
      <v-card-text>
        <inline-svg :src="imagePath" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
// .input-device-info {
//   // max-width: 100%;
//   // max-height: 20vh;
//   // height: 33.3%;
// }

.input-device-thumbnail {
  max-height: 120px;
}
</style>
<script lang="ts">
import getDeviceName from "@/main/Input/InputDetection/getDeviceName";
import { useStore } from "@/renderer/store/store";
import { InputDevice } from "@/main/Input/InputDetection/InputBindings";
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
      openMappingImage: false,
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
    thumbnailPath(): string {
      if (this.selectedProfile) {
        return this.selectedProfile.thumbnailPath;
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
