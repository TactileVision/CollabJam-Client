<template>
  <v-container class="playGroundView" ref="container" tabindex="-1">

    <v-col cols="2">
      <v-sheet elevation="0" class="mr-2 pa-4">
        <TactonSelectionList></TactonSelectionList>
      </v-sheet>
    </v-col>

    <v-col cols="10">

      <v-row>

        <v-col id="tactonScreenHeight" class="tactonScreenWrapper" cols="12">
          <div id="tactonScreen">
            <TactonScreen :isMounted="isMounted" />
          </div>
          <!-- <v-sheet id="tactonScreen" elevation="0" class="mr-2 pa-4"> -->
          <!-- </v-sheet> -->
        </v-col>
        <v-col class="inputDeviceWrapper" cols="4" v-for="device in devices" :key="getDeviceKey(device)">
          <DeviceProfile clas="flex-grow-1" :device="device" />
        </v-col>

      </v-row>
    </v-col>

    <v-dialog v-model="playGroundDialog" max-width="50%" class="tesing" @click:outside="closeDialog">
      <PlayGroundDialog @closeDialog="closeDialog" :keyButtonId="idOfEditableButton" />
    </v-dialog>
  </v-container>
</template>

<style lang="scss">
.playGroundView {
  display: flex;
  height: 90%;
  min-width: 100%;
  max-width: 100%;
  padding: 0;
}

.playGroundView:focus {
  outline: none;
}

#tactonScreen {
  border-right: 1px solid rgba(0, 0, 0, .2);
}

.tactonScreenWrapper,.inputDeviceWrapper {
  height: 45vh;
}

.devices {
  margin: 2rem;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import TactonScreen from "@/feature/collabJamming/views/TactonScreen/TactonScreen.vue";
import PlayGroundDialog from "./PlayGroundDialog.vue";
import DeviceProfile from "./DeviceProfile.vue";
import { GeneralMutations } from "@/app/store/modules/generalSettings/generalSettings";
import { RouterNames } from "@/app/router/Routernames";
import { useStore } from "@/app/store/store";
import { PlayGroundMutations } from "../../store/playGround/types";
import { getAllDevices } from "@/core/Input/InputDetection";
import { InputDevice, isGamepadDevice, isKeyboardDevice } from "@/core/Input/InputDetection/types/InputBindings";
import TactonSelectionList from "@/feature/collabJamming/views/TactonScreen/TactonSelectionList.vue";

export default defineComponent({
  name: "PlayGroundBody",
  components: {
    // GridHeader,
    // GridArea,
    DeviceProfile,
    TactonScreen,
    TactonSelectionList,
    PlayGroundDialog,
  },
  data() {
    return {
      store: useStore(),
      playGroundDialog: false,
      idOfEditableButton: "",
      isMounted: false,
      devices: [] as InputDevice[],
      pollDevices: -1
    };
  },
  mounted() {
    //set the focus to the gui, so key down and up is working
    const container: any = this.$refs.container;
    this.$nextTick(() => container.$el.focus());
    this.isMounted = true;
    this.store.commit(PlayGroundMutations.UPDATE_EDIT_MDOE, false);
    this.devices = getAllDevices();

    const pollFunction = () => {
      this.devices = getAllDevices();
      this.pollDevices = requestAnimationFrame(pollFunction)
    }

    this.pollDevices = requestAnimationFrame(pollFunction)
  },
  unmounted() {
    if (this.pollDevices !== -1) {
      cancelAnimationFrame(this.pollDevices);
    }
  },
  methods: {
    closeDialog() {
      this.playGroundDialog = false;
      this.store.commit(
        GeneralMutations.CHANGE_VISIBILE_VIEW,
        RouterNames.PLAY_GROUND
      );
      // set the focus again, so key down and up is working
      const container: any = this.$refs.container;
      this.$nextTick(() => container.$el.focus());
    },
    startDialog(id: string) {
      //console.log("startDialog: " + id);
      this.store.commit(
        GeneralMutations.CHANGE_VISIBILE_VIEW,
        RouterNames.PLAY_GROUND_DIALOG
      );
      this.idOfEditableButton = id;
      this.playGroundDialog = true;
    },
    getDeviceKey(device: InputDevice) {
      if (isKeyboardDevice(device)) return "keyboard"
      else if (isGamepadDevice(device)) return `gamepad-${device.name}`
    }
  },
});
</script>