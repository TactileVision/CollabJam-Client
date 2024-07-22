import { createApp } from "vue";
import App from "@/renderer/App.vue";
import vuetify from "@/plugins/vuetify";
// import { loadFonts } from '@/plugins/webfontloader';
import { router } from "@/renderer/router";
import { useStore } from "@/renderer/store/store";
import { initIpcRendererListener } from "@/renderer/helpers/IpcRendererListener";
import { registerInputAdapter } from "@/main/Input/InputDetection/InputAdapter/InputAdapterRegistry";
import GamepadAdapter from "@/main/Input/InputDetection/InputAdapter/GamepadAdapter";
import { registerInputHandler } from "@/main/Input/InputHandling/InputHandlerManager";
import VariableIntensityHandler from "@/main/Input/InputHandling/handlers/VariableIntensityHandler";
import TriggerActuatorHandler from "@/main/Input/InputHandling/handlers/TriggerActuatorHandler";
import TriggerActuatorWithDynamicIntensityHandler from "@/main/Input/InputHandling/handlers/TriggerActuatorWithDynamicIntensityHandler";
import DynamicActuatorHandler from "@/main/Input//InputHandling/handlers/DynamicActuatorHandler";
import LockIntensityHandler from "@/main/Input/InputHandling/handlers/LockIntensityHandler";
import ChangeInteractionModeHandler from "@/main/Input/InputHandling/handlers/ChangeInteractionModeHandler";
import InlineSvg from "vue-inline-svg";
import KeyboardAdapter from "./main/Input/InputDetection/InputAdapter/KeyboardAdapter";

// loadFonts()
const store = useStore();

registerInputAdapter(GamepadAdapter);
registerInputAdapter(KeyboardAdapter);

registerInputHandler(VariableIntensityHandler());
registerInputHandler(TriggerActuatorHandler());
registerInputHandler(TriggerActuatorWithDynamicIntensityHandler());
registerInputHandler(DynamicActuatorHandler());
registerInputHandler(LockIntensityHandler());
registerInputHandler(ChangeInteractionModeHandler());

createApp(App)
  .use(router)
  .use(vuetify)
  .use(store)
  .component("inline-svg", InlineSvg)
  .mount("#app");

initIpcRendererListener();
