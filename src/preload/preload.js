import { contextBridge, ipcRenderer } from "electron";

const isValidChannel = (element, channel) => {
  if (typeof channel === "string" || channel instanceof String) {
    return channel.includes(element);
  }
  return false;
};

contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    // whitelist channels
    //send to the main
    const validChannels = ["tactile-jam.main", "collabjam.main"];
    const isValid = validChannels.some((el) => isValidChannel(el, channel));

    if (isValid == true) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    //get messages from main
    const validChannels = ["collabjam.renderer", "tactile-jam.renderer"];
    const isValid = validChannels.some((el) => isValidChannel(el, channel));

    if (isValid == true) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
