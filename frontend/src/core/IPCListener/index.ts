import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels";
import { useStore } from "@/app/store/store";
import { GeneralSettingsActionTypes, VibrotactileDevice } from "@/app/store/modules/generalSettings/generalSettings";
import { PlayGroundMutations } from "@/feature/collabJamming/store/playGround/types";
import { CustomSettings } from "@/core/FileManager/initSettings";
import { RoomMutations } from "@/feature/collabJamming/store/roomSettings/roomSettings";

const store = useStore()
/**
 * initiate listener from the main process
 */
export const initIPCListener = () => {
  window.api.receive(IPC_CHANNELS.renderer.foundDevice, (device: VibrotactileDevice) => {
    //console.log("Get from main " + device);
    store.dispatch(GeneralSettingsActionTypes.addNewDevice, device)
  });

  window.api.receive(IPC_CHANNELS.renderer.deviceStatusChanged, (device: VibrotactileDevice) => {
    console.log("Get from main " + device);
    store.dispatch(GeneralSettingsActionTypes.updateDeviceStatus, device)
  });

  window.api.receive(IPC_CHANNELS.renderer.numberOfOutputsDiscovered, (payload:{deviceId:string, numOfOutputs:number}) => {
    store.dispatch(GeneralSettingsActionTypes.setNumberOfOutPuts, payload)
  });

  window.api.receive(IPC_CHANNELS.renderer.initConfig, (setting: CustomSettings) => {
    store.commit(PlayGroundMutations.BULK_GRID_UPDATE, setting.profiles);
    store.commit(RoomMutations.UPDATE_USER_NAME, setting.userName);
  });

}