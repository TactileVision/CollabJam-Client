import { createApp } from 'vue';
import App from './renderer/App.vue';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import router from "./renderer/router";
import { useStore } from "./renderer/store/store";
import { initWebsocket } from "./renderer/CommunicationManager/WebSocketManager";
import { initIPCListener } from "./renderer/CommunicationManager/IPCListener";
import { registerInputHandler } from "./renderer/InputHandling/InputHandlerManager";
import VariableIntensityHandler from "./renderer/InputHandling/handlers/VariableIntensityHandler";
import TriggerActuatorHandler from "./renderer/InputHandling/handlers/TriggerActuatorHandler";
import TriggerActuatorWithDynamicIntensityHandler from "./renderer/InputHandling/handlers/TriggerActuatorWithDynamicIntensityHandler";

loadFonts()
const store = useStore();

registerInputHandler(VariableIntensityHandler());
registerInputHandler(TriggerActuatorHandler());
registerInputHandler(TriggerActuatorWithDynamicIntensityHandler());

createApp(App)
  .use(vuetify)
  .use(store)
  .use(router)
  .mount('#app')

initIPCListener();
initWebsocket(store);