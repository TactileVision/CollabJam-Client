<template>
  <div class="input-device-info mb-8">
    <v-card class="mx-auto">
      <v-card-title>
        {{ name.indexOf('(') == -1 ? name : name.substring(0, name.indexOf('(')) }}
        <!-- {{ name }} -->
      </v-card-title>
      <inline-svg class="input-device-illustration" :src="imagePath" />
      <v-card-actions>
        <v-select hide-details v-model="selectedProfileUid" label="Profile" :items="allProfileOptions"></v-select>
        <v-btn @click="updateProfile" color="primary">Update</v-btn>
      </v-card-actions>
    </v-card>
    <!-- <h3>{{ name }}</h3>
    <v-row>
      <v-col>
        <inline-svg :src="imagePath" />
      </v-col>
      <v-col>
        <v-select v-model="selectedProfileUid" label="Profile" :items="allProfileOptions"></v-select>
        <v-btn @click="updateProfile" color="primary">Update</v-btn>
      </v-col>
    </v-row> -->
  </div>
</template>

<style lang="scss" scoped >
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
import getDeviceName from "@/renderer/InputDetection/getDeviceName";
import { useStore } from "@/renderer/store/store";
import { InputDevice } from "@/types/InputBindings";
import { defineComponent } from "@vue/runtime-core";
import defaultImagePath from "@/renderer/assets/controller.svg";
import { PlayGroundMutations } from "@/renderer/store/modules/playGround/types";

export default defineComponent({
  name: "DeviceProfile",
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
    };
  },
  mounted() {
    const profile = this.currentProfile;
    if (profile)
      this.selectedProfileUid = profile.uid;
    else
      this.selectedProfileUid = this.allProfileOptions[0]?.value;
  },
  computed: {
    selectedProfile() {
      return this.store.state.playGround.profiles.find(profile => profile.uid == this.selectedProfileUid);
    },
    currentProfile() {
      return this.store.getters.getProfileByDevice(this.device);
    },
    name() {
      return getDeviceName(this.device);
    },
    imagePath() {
      if (this.selectedProfile) {
        return this.selectedProfile.imagePath
      } else {
        return defaultImagePath;
      }
    },
    allProfileOptions() {
      const allProfiles = this.store.state.playGround.profiles;
      return allProfiles
        .filter(profile => profile.deviceType === this.device.type)
        .map(profile => ({ title: profile.name, value: profile.uid }));
    },
  },
  methods: {
    updateProfile() {
      if (!this.selectedProfileUid) return;
      this.store.commit(PlayGroundMutations.UPDATE_PROFILE, { device: this.device, profileUid: this.selectedProfileUid })
    }
  },
});
</script>