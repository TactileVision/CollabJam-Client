import { createApp } from 'vue';
import App from "./App.vue";
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import router from "./app/router";
import { useStore } from "./app/store/store";
import { initWebsocket } from "./core/WebSocketManager";
import { initIPCListener } from "./core/IPC/IpcListener";
import { registerInputAdapter } from "./core/Input/InputDetection/InputAdapter/InputAdapterRegistry";
// import GamepadAdapter from "./app/InputDetection/InputAdapter/GamepadAdapter";
import GamepadAdapter from "./core/Input/InputDetection/InputAdapter/GamepadAdapter";
import { registerInputHandler } from "./core/Input/InputHandling/InputHandlerManager";
import VariableIntensityHandler from "./core/Input/InputHandling/handlers/VariableIntensityHandler";
import TriggerActuatorHandler from "./core/Input/InputHandling/handlers/TriggerActuatorHandler";
import TriggerActuatorWithDynamicIntensityHandler from "./core/Input/InputHandling/handlers/TriggerActuatorWithDynamicIntensityHandler";
import DynamicActuatorHandler from "./core/Input//InputHandling/handlers/DynamicActuatorHandler";
import LockIntensityHandler from "./core/Input/InputHandling/handlers/LockIntensityHandler";
import ChangeInteractionModeHandler from "./core/Input/InputHandling/handlers/ChangeInteractionModeHandler"
import InlineSvg from 'vue-inline-svg';

loadFonts()
const store = useStore();

registerInputAdapter(GamepadAdapter);

registerInputHandler(VariableIntensityHandler());
registerInputHandler(TriggerActuatorHandler());
registerInputHandler(TriggerActuatorWithDynamicIntensityHandler());
registerInputHandler(DynamicActuatorHandler());
registerInputHandler(LockIntensityHandler());
registerInputHandler(ChangeInteractionModeHandler());

createApp(App)
  .use(vuetify)
  .use(store)
  .use(router)
  .component('inline-svg', InlineSvg)
  .mount('#app')

initIPCListener();
initWebsocket(store);