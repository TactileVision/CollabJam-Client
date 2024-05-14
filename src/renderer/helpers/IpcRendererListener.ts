import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { useStore } from "@/renderer/store/store";
import {
  GeneralSettingsActionTypes,
  VibrotactileDevice,
} from "@/renderer/store/modules/generalSettings/generalSettings";
import { PlayGroundMutations } from "@/renderer/store/modules/collaboration/playGround/types";
import { CustomSettings } from "@/main/FileManager/initSettings";
import { RoomMutations } from "@/renderer/store/modules/collaboration/roomSettings/roomSettings";
import {
  DeviceManagerStoreActionTypes,
  FrequencyInformation,
  PeripheralInformation,
  TactileDisplay,
} from "../store/modules/DeviceManager/DeviceManagerStore";
import { writeAmplitudeToAllChannels } from "./TactileDisplayActions";

const store = useStore();
/**
 * initiate listener from the main process
 */
export const initIpcRendererListener = () => {
  window.api.receive(
    IPC_CHANNELS.renderer.foundDevice,
    (device: VibrotactileDevice) => {
      console.log("Found device");
      store.dispatch(GeneralSettingsActionTypes.addNewDevice, device);
    },
  );
  window.api.receive(
    IPC_CHANNELS.renderer.deviceStatusChanged,
    (device: VibrotactileDevice) => {
      store.dispatch(GeneralSettingsActionTypes.updateDeviceStatus, device);
    },
  );

  window.api.receive(
    IPC_CHANNELS.renderer.numberOfOutputsDiscovered,
    (payload: { deviceId: string; numOfOutputs: number }) => {
      store.dispatch(GeneralSettingsActionTypes.setNumberOfOutPuts, payload);
    },
  );

  window.api.receive(
    IPC_CHANNELS.renderer.initConfig,
    (setting: CustomSettings) => {
      store.commit(PlayGroundMutations.BULK_GRID_UPDATE, setting.profiles);
      store.commit(RoomMutations.UPDATE_USER_NAME, setting.userName);
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.discoveredPeripheral,
    (peripheral: PeripheralInformation) => {
      store.dispatch(
        DeviceManagerStoreActionTypes.discoveredPeripheral,
        peripheral,
      );
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.connectedToDevice,
    (peripheral: TactileDisplay) => {
      store.dispatch(
        DeviceManagerStoreActionTypes.addConnectedDisplay,
        peripheral,
      );
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.disconnectedFromDevice,
    (data: { uuid: string }) => {
      store.dispatch(
        DeviceManagerStoreActionTypes.removeDisconnectedDisplay,
        data.uuid,
      );
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.readNumberOfOutputs,
    (payload: { deviceId: string; numOfOutputs: number }) => {
      console.log(payload);
      store.dispatch(DeviceManagerStoreActionTypes.setNumberOfOutputs, payload);
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.readFreqAvailability,
    (payload: { deviceId: string; freqConf: number }) => {
      console.log(payload);
      store.dispatch(
        DeviceManagerStoreActionTypes.setFreqAvailability,
        payload,
      );
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.readAmpAvailability,
    (payload: { deviceId: string; ampConf: number }) => {
      console.log(payload);
      store.dispatch(DeviceManagerStoreActionTypes.setAmpAvailability, payload);
    },
  );

  window.api.receive(
    IPC_CHANNELS.bluetooth.renderer.readFreqRange,
    (payload: { deviceId: string; freqInfo: FrequencyInformation }) => {
      store.dispatch(DeviceManagerStoreActionTypes.setFreqInfo, payload);
    },
  );

  window.api.receive(IPC_CHANNELS.renderer.windowWillClose, () => {
    store.state.deviceManager.connectedTactileDisplays.forEach((d) => {
      writeAmplitudeToAllChannels(d, 0);
    });
    store.state.deviceManager.connectedTactileDisplays.forEach((d) => {
      window.api.send(IPC_CHANNELS.main.disconnectDevice, {
        deviceId: d.info.id,
      });
    });
  });
};
