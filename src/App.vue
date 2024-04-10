<!--inital view initiate the router and the toast for user messages -->
<template>
  <div class="root">
    <v-app>
      <v-container fluid class="ma-0">
        <v-row>
          <sidebar />
          <v-col>
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-app>
  </div>
</template>

<style lang="scss">
.main {
  height: 100%;
  outline: none;
  justify-content: center;
  display: flex;
}

.v-main__wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.root {
  display: block;
  width: 100%;
}

.customIcon {
  padding-left: 5px;
}

.snackbar {
  display: flex;
  justify-content: space-between;
  width: 90%;
  /* Set a default minimum width */
  box-shadow:
    0 10px 16px 0 rgba(0, 0, 0, 0.2),
    0 6px 20px 0 rgba(0, 0, 0, 0.19) !important;
  border-radius: 5px !important;
  // box-shadow: #333;
  background-color: #333;
  /* Black background color */
  color: #fff;
  /* White text color */
  text-align: center;
  /* Centered text */
  border-radius: 2px;
  /* Rounded borders */
  padding: 16px;
  /* Padding */
  margin: 16px;
  /* Padding */
  position: fixed;
  /* Sit on top of the screen */
  z-index: 1;
  /* Add a z-index if needed */
  bottom: 30px;
  /* 30px from the bottom */
}

.snackbarSucess {
  display: flex;
  justify-content: center;
  width: 50%;
  /* Set a default minimum width */
  box-shadow:
    0 10px 16px 0 rgba(0, 0, 0, 0.2),
    0 6px 20px 0 rgba(0, 0, 0, 0.19) !important;
  border-radius: 5px !important;
  // box-shadow: #333;
  color: #fff;
  /* White text color */
  text-align: center;
  /* Centered text */
  border-radius: 2px;
  /* Rounded borders */
  padding: 16px;
  /* Padding */
  margin: auto;
  /* Padding */
  position: fixed;
  /* Sit on top of the screen */
  z-index: 1;
  /* Add a z-index if needed */
  bottom: 30px;
  /* 30px from the bottom */
}

.label {
  display: flex;
  align-items: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.9s;
}

.fade-enter,
.fade-leave-to

/* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
<script lang="ts">
import { defineComponent } from "vue";
// import { RouterNames } from "@/app/router/Routernames";
import { GeneralSettingsActionTypes } from "@/app/store/modules/generalSettings/generalSettings";
import { useStore } from "@/app/store/store";
// import { initWebsocket } from "@/core/WebSocketManager";
// import { PlayGroundActionTypes } from "@/feature/collabJamming/store/playGround/types";
// import { createInputDetection } from "@/core/Input/InputDetection";
// import { InputEvent } from "@/core/Input/InputDetection/types/types";
// import { KeyInput, UserInputType } from "@/core/Input/InputDetection/types/InputDetection";
// import { DeviceType, KeyboardDevice } from "@/core/Input/InputDetection/types/InputBindings";
// import AppBar from "@/app/AppBar.vue"
import Sidebar from "@/app/Sidebar.vue";
export default defineComponent({
  name: "App",
  components: { /* AppBar , */ Sidebar },
  data() {
    return {
      store: useStore(),
      // isReconnecting: false,
      // detection: createInputDetection({ onInput: (e) => this.onUserInput(e) }),
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
});
</script>
