<!--inital view initiate the router and the toast for user messages -->
<template>
  <div tabindex="0" class="main prevent-select">
    <div class="root">
      <v-app>
        <!-- <the-sidebar /> -->
        <!-- <the-app-bar /> -->
        <v-main>
          <v-container fluid class="ma-0">
            <router-view />
          </v-container>
        </v-main>
      </v-app>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  height: 100%;
  outline: none;
  justify-content: center;
  display: flex;
}
.root {
  display: block;
  width: 100%;
}

.prevent-select {
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>
<script lang="ts">
import { defineComponent } from "vue";
import { RouterNames } from "@/renderer/router/Routernames";
import { GeneralSettingsActionTypes } from "@/renderer/store/modules/generalSettings/generalSettings";
import { useStore } from "@/renderer/store/store";
import { createInputDetection } from "@/main/Input/InputDetection";
import { InputEvent } from "@/main/Input/InputDetection/types";
import {
  PlayGroundActionTypes,
  PlayGroundMutations,
} from "@/renderer/store/modules/collaboration/playGround/types";
import { InputDevice } from "@/main/Input/InputDetection/InputBindings";
// import TheAppBar from "@/renderer/components/TheAppBar.vue";
// import TheSidebar from "@/renderer/components/TheSidebar.vue";
export default defineComponent({
  name: "App",
  components: {
    /* TheAppBar ,*/
    // TheSidebar,
  },
  data() {
    return {
      store: useStore(),
      isReconnecting: false,
      detection: createInputDetection({ onInput: (e) => this.onUserInput(e) }),
    };
  },
  watch: {
    $route(to) {
      //this.show = false;
      this.store.dispatch(
        GeneralSettingsActionTypes.changeCurrentView,
        to.name,
      );
    },
  },
  mounted() {
    this.detection.start();
  },
  methods: {
    // reconnectSocket() {
    //   this.isReconnecting = true;
    //   initWebsocket(this.store);
    //   setTimeout(() => (this.isReconnecting = false), 5000);
    // },
    correctFrameForInput(): boolean {
      return this.store.getters.currentView == RouterNames.ROOM;
    },
    findOrCreateProfileFor(device: InputDevice) {
      const profile = this.store.getters.getProfileByDevice(device);
      if (profile) {
        return profile;
      }

      const profileUid = this.store.state.playGround.profiles.filter(
        ({ deviceType }) => deviceType == device.type,
      )[0]?.uid;
      if (!profileUid) {
        console.warn("Unknown device detected. Cannot create profile!", device);
        return null;
      }

      this.store.commit(PlayGroundMutations.UPDATE_PROFILE, {
        device,
        profileUid,
      });
      return this.store.getters.getProfileByDevice(device);
    },
    onUserInput(e: InputEvent) {
      if (this.store.state.playGround.inEditMode) return;
      if (!this.correctFrameForInput()) return;

      const { input, device, value, wasActive } = e;

      const profile = this.findOrCreateProfileFor(device);
      if (!profile) return;

      if (value === 0) {
        this.store.dispatch(PlayGroundActionTypes.deactivateKey, {
          profile,
          input,
        });
      } else {
        this.store.dispatch(PlayGroundActionTypes.activateKey, {
          profile,
          input,
          value,
          wasActive,
        });
      }
    },
  },
});
</script>
