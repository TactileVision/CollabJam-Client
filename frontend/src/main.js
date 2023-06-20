import { createApp } from 'vue';
import App from './renderer/App.vue';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import router from "./renderer/router";
import { useStore } from "./renderer/store/store";
import { initWebsocket } from "./renderer/CommunicationManager/WebSocketManager";
import { initIPCListener } from "./renderer/CommunicationManager/IPCListener";
import { registerInputAdapter } from "./renderer/InputDetection/InputAdapter/InputAdapterRegistry";
import GamepadAdapter from "./renderer/InputDetection/InputAdapter/GamepadAdapter";
import { registerInputHandler } from "./renderer/InputHandling/InputHandlerManager";
import VariableIntensityHandler from "./renderer/InputHandling/handlers/VariableIntensityHandler";
import TriggerActuatorHandler from "./renderer/InputHandling/handlers/TriggerActuatorHandler";
import TriggerActuatorWithDynamicIntensityHandler from "./renderer/InputHandling/handlers/TriggerActuatorWithDynamicIntensityHandler";
import DynamicActuatorHandler from "./renderer/InputHandling/handlers/DynamicActuatorHandler";
import LockIntensityHandler from "./renderer/InputHandling/handlers/LockIntensityHandler";
import InlineSvg from 'vue-inline-svg';

loadFonts()
const store = useStore();

registerInputAdapter(GamepadAdapter);

registerInputHandler(VariableIntensityHandler());
registerInputHandler(TriggerActuatorHandler());
registerInputHandler(TriggerActuatorWithDynamicIntensityHandler());
registerInputHandler(DynamicActuatorHandler());
registerInputHandler(LockIntensityHandler());

createApp(App)
  .use(vuetify)
  .use(store)
  .use(router)
  .component('inline-svg', InlineSvg)
  .mount('#app')

initIPCListener();
initWebsocket(store);