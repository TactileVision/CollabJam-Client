const IPC_CHANNELS = {
    //channels to communicate with main process
    main: {
        actuator: "tactile-jam.main.actuator",
        changeScan: "tactile-jam.main.changeScan",
        connectDevice: "tactile-jam.main.connectDevice",
        disconnectDevice: "tactile-jam.main.disconnectDevice",
        copyToClipBoard: "tactile-jam.main.copyToClipBoard",
        modifyUserConfig: "tactile-jam.main.modifyUserConfig",
        saveUserName: "tactile-jam.main.saveUserName",
        saveKeyBoardButton: "tactile-jam.main.saveKeyBoardButton",
        logMessageInfos: "tactile-jam.main.logMessageInfos",
        saveTacton: "tactile-jam.main.saveTacton",
        getRecordedTacton: "tactile-jam.main.getRecordedTacton",
    },
    //channels to communicate with renderer process
    renderer: {
        actuator: "tactile-jam.renderer.devices",
        foundDevice: "tactile-jam.renderer.foundDevice",
        deviceStatusChanged: "tactile-jam.renderer.deviceStatusChanged",
        numberOfOutputsDiscovered: "tactile-jam.renderer.numberOfOutputsDiscovered",
        initConfig: "tactile-jam.renderer.initConfig",
    },

    bluetooth: {
        main: {
            writeCharacteristic: "collabjam.main.ble.writeAmplitudeCharacteristic",
            writeAmplitudeBuffer:"tactile-jam.main.writeAmplitudeBuffer",
            writeAllAmplitudeBuffers: "tactile-jam.main.writeAllAmplitudeBuffers",

        },
        renderer: {
            discoveredPeripheral: "collabjam.renderer.ble.discoveredPeripheral",
            connectedToDevice: "collabjam.renderer.ble.connectedToDevice",
            disconnectedFromDevice: "collabjam.renderer.ble.disconnectedFromDevice",
            readNumberOfOutputs: "collabjam.renderer.ble.readNumberOfOutputs",
            readAmpBuffer: "collabjam.renderer.ble.readAmpBuffer",
            readFreqBuffer: "collabjam.renderer.ble.readFreqBuffer",
            readAmpConfig: "collabjam.renderer.ble.readAmpConfig",
            readFreqConfig: "collabjam.renderer.ble.readFreqConfig"
        }
    }
};

export {
    IPC_CHANNELS,
};