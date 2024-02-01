import { IPC_CHANNELS } from "@/core/IPCMainManager/IPCChannels"
import { useStore } from "@/app/store/store"
import { GeneralSettingsActionTypes, VibrotactileDevice } from "@/app/store/modules/generalSettings/generalSettings"
import { PlayGroundMutations } from "@/feature/collabJamming/store/playGround/types"
import { CustomSettings } from "@/core/FileManager/initSettings"
import { RoomMutations } from "@/feature/collabJamming/store/roomSettings/roomSettings"
import { DeviceManagerStoreActionTypes, DeviceMutations, FrequencyInformation, PeripheralInformation, TactileDisplay } from "../DeviceManager/store/DeviceManagerStore"

const store = useStore()
/**
 * initiate listener from the main process
 */
export const initIPCListener = () => {
  window.api.receive(IPC_CHANNELS.renderer.foundDevice, (device: VibrotactileDevice) => {
    //console.log("Get from main " + device)
    store.dispatch(GeneralSettingsActionTypes.addNewDevice, device)
  })


  window.api.receive(IPC_CHANNELS.renderer.deviceStatusChanged, (device: VibrotactileDevice) => {
    console.log("Get from main " + device)
    store.dispatch(GeneralSettingsActionTypes.updateDeviceStatus, device)
  })

  window.api.receive(IPC_CHANNELS.renderer.numberOfOutputsDiscovered, (payload: { deviceId: string, numOfOutputs: number }) => {
    store.dispatch(GeneralSettingsActionTypes.setNumberOfOutPuts, payload)
  })

  window.api.receive(IPC_CHANNELS.renderer.initConfig, (setting: CustomSettings) => {
    store.commit(PlayGroundMutations.BULK_GRID_UPDATE, setting.profiles)
    store.commit(RoomMutations.UPDATE_USER_NAME, setting.userName)
  })

  window.api.receive(IPC_CHANNELS.bluetooth.renderer.discoveredPeripheral, (peripheral: PeripheralInformation) => {
    store.dispatch(DeviceManagerStoreActionTypes.discoveredPeripheral, peripheral)
  })

  window.api.receive(IPC_CHANNELS.bluetooth.renderer.connectedToDevice, (peripheral: TactileDisplay) => {
    store.dispatch(DeviceManagerStoreActionTypes.addConnectedDisplay, peripheral)
  })
  window.api.receive(IPC_CHANNELS.bluetooth.renderer.disconnectedFromDevice, (uuid: string) => {
    store.dispatch(DeviceManagerStoreActionTypes.removeDisconnectedDisplay, uuid)
  })

  window.api.receive(IPC_CHANNELS.bluetooth.renderer.readNumberOfOutputs, (payload: { deviceId: string, numOfOutputs: number }) => {
    console.log(payload)
    store.dispatch(DeviceManagerStoreActionTypes.setNumberOfOutputs, payload);
  })

  window.api.receive(IPC_CHANNELS.bluetooth.renderer.readFreqAvailability, (payload: { deviceId: string, freqConf: number }) => {
    console.log(payload)
    store.dispatch(DeviceManagerStoreActionTypes.setFreqAvailability, payload);
  })

  window.api.receive(IPC_CHANNELS.bluetooth.renderer.readAmpAvailability, (payload: { deviceId: string, ampConf: number }) => {
    console.log(payload)
    store.dispatch(DeviceManagerStoreActionTypes.setAmpAvailability, payload);
  })
  window.api.receive(IPC_CHANNELS.bluetooth.renderer.readFreqRange, (payload: { deviceId: string, freqInfo: FrequencyInformation }) => {
    console.log("Updatating freq range")
    console.log(payload)
    store.dispatch(DeviceManagerStoreActionTypes.setFreqInfo, payload);
  })
}