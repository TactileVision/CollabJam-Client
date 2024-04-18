import noble, { Peripheral } from "@abandonware/noble";
import {
  isKnownService,
  knownServices,
  knownServiceUuids,
} from "./BleServices";
import DeviceManager from "./BlePeripheralConnectionManager";
import { sendMessageToRenderer } from "@/main/IpcController/IpcMainController";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { TactileDisplay } from "@/renderer/store/modules/DeviceManager/DeviceManagerStore";
import { pingDisplayViaNode } from "@/main/BleTactileDisplays/TactileDisplayCharacteristicWriter";

/**
 * generell methods to establish a ble connection
 * methods get used by the device manager
 */
let blueToothState = "";

noble.on("stateChange", (state: string) => {
  blueToothState = state;
});

noble.on("discover", function (peripheral: Peripheral) {
  // console.log(peripheral);
  // console.log(peripheral.advertisement.serviceUuids);
  // console.log(
  //   "[Bluetooth] Found:" +
  //     !isKnownService(peripheral.advertisement.serviceUuids),
  // );
  // service not supporter, dont list as device
  console.log("[Bluetooth] Found perihperal");
  console.log(peripheral.advertisement.serviceUuids);
  if (!isKnownService(peripheral.advertisement.serviceUuids)) return;
  console.log("[Bluetooth] is compatible");
  DeviceManager.addDevice(peripheral);
});

export const startBluetoothScan = () => {
  if (blueToothState === "poweredOn") {
    // clear list
    console.log("[Bluetooth] Starting Scan");
    // start scan
    noble.startScanning(knownServiceUuids, false, (error?: Error) => {
      if (!error) return;
      throw error;
    });
    // noble.startScanningAsync(knownServiceUuids, true);
  } else {
    throw new Error("Bluetooth state is not ready");
  }
};

export const stopBluetoothScan = () => {
  console.log("[Bluetooth] Stop Scan");
  console.log(blueToothState);
  noble.stopScanning();
};

const setOnCharacteristicsDiscover = (
  device: Peripheral,
  service: noble.Service,
) => {
  service.once("characteristicsDiscover", (characteristics) => {
    if (characteristics.length <= 0) {
      console.log("[Bluetooth] No characteristics found");
      // disconnect, since we dont know anything about that device
      DeviceManager.disconnectDevice(device.uuid);
      return;
    }

    const s = knownServices.find(
      (knownService) => knownService.service.uuid === service.uuid,
    );

    characteristics.forEach((characteristic) => {
      if (s !== undefined) {
        for (const key in s.characteristics) {
          if (s.characteristics[key].uuid === characteristic.uuid) {
            if (
              Object.prototype.hasOwnProperty.call(
                s.characteristics[key],
                "callbacks",
              )
            ) {
              // call all defined functions of callbacks in the service file for the connected device
              if (
                s.characteristics[key] !== undefined &&
                s.characteristics[key].callbacks !== undefined
              ) {
                s.characteristics[key]!.callbacks!.forEach((setOnFn) => {
                  // console.log("inside of callback");
                  setOnFn(device.id, characteristic);
                });
              }
            }
            // Descovering descriptors caused crashes on macintosh
            // characteristic.once("descriptorsDiscover", (descriptors) => {
            // console.log(descriptors)
            // descriptors.forEach((d) =>{
            //     d.readValue((error, data)=>{
            //         // console.log("decriptor read")
            //         // console.log(data)
            //         // console.log(error)
            //     })
            // })
            // });
            characteristic.discoverDescriptors();
          }
        }
      }
    });

    pingDisplayViaNode(device, 500);
  });
};

const discoverServices = (device: Peripheral) => {
  device.discoverServices(knownServiceUuids, (err, services) => {
    console.log(
      `[Bluetooth][${device!.id}]: ${services.length} service(s) found.`,
    );
    if (err !== null || services.length == 0) {
      throw Error();
    }
    services.forEach((service) => {
      // Let each service add its specific event callbacks, callbacks are stored in service object, in callback array

      setOnCharacteristicsDiscover(device, service);
      service.discoverCharacteristics();
    });
  });
};

export const connectBlutetoothDevice = (device: Peripheral) => {
  // setup events
  device.once("connect", async () => {
    console.log(
      `[Bluetooth][${device.id}]: ${device.advertisement.localName} connected`,
    );
    const d: TactileDisplay = {
      info: {
        id: device.id,
        name: device.advertisement.localName,
        rssi: device.rssi,
        connectionState: device.state,
      },
      numOfOutputs: 0,
      outputParameter: [],
      freqInformation: { fMin: 0, fMax: 0, fResonance: 0 },
    };
    DeviceManager.updateConnectedDevice(device);
    sendMessageToRenderer(IPC_CHANNELS.bluetooth.renderer.connectedToDevice, d);
    discoverServices(device);
  });
  device.once("disconnect", () => {
    console.log(
      `[Bluetooth][${device.id}]: ${device.advertisement.localName} disconnected`,
    );
    DeviceManager.updateConnectedDevice(device);
  });

  console.log(`[Bluetooth][${device.id}]: trying to connect`);
  // connect to device
  device.connect();
};

export const disconnectBlutetoothDevice = (device: Peripheral) => {
  device.disconnect();
};
