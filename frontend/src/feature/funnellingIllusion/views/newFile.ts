import { defineComponent } from "vue";
import { useStore } from "@/app/store/store";
import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels";

// import DeviceManager from "@/core/DeviceManager/DeviceManager"
export default defineComponent({
name: "Funneling",
data() {
return {
store: useStore(),
slider: 0,
isRunning: false
};
},
computed: {
hardwareIsReady(): boolean {
const d = this.store.getters.getNumberOfConnectedDisplays > 0;
if (!d) return false;
const a = this.store.state.deviceManager.connectedTactileDisplays[0].numOfOutputs >= 2;
return a;
}
},
methods: {
canWork() {
// return DeviceManager.connectedDevices.size > 0
// return canDoIllusion();
},
toggleVibration() {
this.isRunning = !this.isRunning;

if (this.isRunning) {
//SET Vibration value based on slider
window.api.send(IPC_CHANNELS.bluetooth.main.writeAllAmplitudeBuffers, [
{
channelIds: [0],
intensity: 1,
},
]);
} else {
//SET Vibration value to zero
}
return false;
}
},
});
