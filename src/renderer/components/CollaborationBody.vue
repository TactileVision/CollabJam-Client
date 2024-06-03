<template>
  <!--tactonList-->
  <v-navigation-drawer width="350">
    <TactonSelectionList></TactonSelectionList>
  </v-navigation-drawer>
  <!--participantList-->

  <v-container class="playGroundView ma-0" ref="container" tabindex="-1">
    <v-row>
      <v-col id="TactonGraphWrapperHeight" class="TactonGraphWrapperWrapper">
        <div id="TactonGraphWrapper">
          <TactonGraphWrapper :is-mounted="isMounted" />
        </div>
        <!-- <v-sheet id="TactonGraphWrapper" elevation="0" class="mr-2 pa-4"> -->
        <!-- </v-sheet> -->
      </v-col>
    </v-row>
    <!--inputDevices-->
    <v-navigation-drawer
      :width="windowHeight * 0.35"
      floating
      location="bottom"
      v-model="inputDeviceDrawer"
    >
      <v-sheet elevation="0">
        <v-row class="px-4">
          <v-col cols="5" v-for="device in devices" :key="getDeviceKey(device)">
            <CollaborationInputDeviceProfile :device="device" />
          </v-col>
        </v-row>
      </v-sheet>
    </v-navigation-drawer>
    <v-navigation-drawer
      floating
      width="50"
      location="bottom"
      class="d-flex align-center"
      style="background: none; border: none"
    >
      <v-btn
        variant="tonal"
        :color="inputDeviceDrawer ? 'primary' : 'secondary'"
        @click="inputDeviceDrawer = !inputDeviceDrawer"
        text="InputDevices"
        :prepend-icon="'mdi-controller-classic'"
      ></v-btn>
    </v-navigation-drawer>
    <v-dialog
      v-model="CollaborationDialog"
      max-width="50%"
      class="tesing"
      @click:outside="closeDialog"
    >
      <CollaborationDialog
        @close-dialog="closeDialog"
        :key-button-id="idOfEditableButton"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped lang="scss">
.playGroundView {
  display: flex;
  height: 90%;
  min-width: 100%;
  max-width: 100%;
  padding: 0;
}
#TactonGraphWrapper {
  width: 1192px;
}
.playGroundView:focus {
  outline: none;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import TactonGraphWrapper from "@/renderer/components/TactonGraphWrapper.vue";
// import ParticipantSettings from "@/renderer/components/ParticipantSettings.vue";
import CollaborationDialog from "./CollaborationDialog.vue";
import CollaborationInputDeviceProfile from "./CollaborationInputDeviceProfile.vue";
import { GeneralMutations } from "@/renderer/store/modules/generalSettings/generalSettings";
import { RouterNames } from "@/renderer/router/Routernames";
import { useStore } from "@/renderer/store/store";
import { PlayGroundMutations } from "@/renderer/store/modules/collaboration/playGround/types";
import { getAllDevices } from "@/main/Input/InputDetection";
import {
  InputDevice,
  isGamepadDevice,
  isKeyboardDevice,
} from "@/main/Input/InputDetection/InputBindings";
import TactonSelectionList from "@/renderer/components/TactonSelectionList.vue";

export default defineComponent({
  name: "CollaborationBody",
  components: {
    CollaborationInputDeviceProfile,
    TactonGraphWrapper,
    TactonSelectionList,
    CollaborationDialog,
  },
  data() {
    return {
      store: useStore(),
      CollaborationDialog: false,
      idOfEditableButton: "",
      isMounted: false,
      devices: [] as InputDevice[],
      pollDevices: -1,
      toggleInputDevices: false,
      inputDeviceDrawer: false,
      windowHeight: window.innerHeight,
    };
  },
  mounted() {
    //set the focus to the gui, so key down and up is working
    this.store.commit(PlayGroundMutations.UPDATE_EDIT_MDOE, false);
    this.devices = getAllDevices();

    const pollFunction = () => {
      this.devices = getAllDevices();
      this.pollDevices = requestAnimationFrame(pollFunction);
    };

    this.pollDevices = requestAnimationFrame(pollFunction);

    this.$nextTick(() => {
      window.addEventListener("resize", this.onResize);
    });
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
  },
  unmounted() {
    if (this.pollDevices !== -1) {
      cancelAnimationFrame(this.pollDevices);
    }
  },
  methods: {
    closeDialog() {
      this.CollaborationDialog = false;
      this.store.commit(
        GeneralMutations.CHANGE_VISIBILE_VIEW,
        RouterNames.PLAY_GROUND,
      );
      // set the focus again, so key down and up is working
      // const container: object = this.$refs.container as object;
      // this.$nextTick(() => (container.$el as HTMLDivElement).focus());
    },
    startDialog(id: string) {
      //console.log("startDialog: " + id);
      this.store.commit(
        GeneralMutations.CHANGE_VISIBILE_VIEW,
        RouterNames.PLAY_GROUND_DIALOG,
      );
      this.idOfEditableButton = id;
      this.CollaborationDialog = true;
    },
    getDeviceKey(device: InputDevice) {
      if (isKeyboardDevice(device)) return "keyboard";
      else if (isGamepadDevice(device)) return `gamepad-${device.name}`;
    },
    onResize() {
      this.windowHeight = window.innerHeight;
    },
  },
});
</script>
