import fs from "fs";
// const path = require('path');
import path from "path";
import { app } from "electron";
import { initSettings, CustomSettings } from "./initSettings";
import { sendMessageToRenderer } from "@/main/IpcController/IpcMainController";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { InputBinding } from "@sharedTypes/InputDetection/InputBindings";
import { isApiError } from "../ErrorType";

//Manager to handle all user configurations and save them locally
class SettingManager {
  readonly pathSettings: string;
  customSettings: CustomSettings;
  readonly errorReading: number = 0;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.pathSettings = path.join(
      userDataPath,
      "configCollaborativeTacton.json",
    );
    this.customSettings = initSettings;
    this.sendSettings();
  }

  sendSettings() {
    const readSuccessfully = this.readSettings();

    if (readSuccessfully == false) this.initConfigFile();

    sendMessageToRenderer(
      IPC_CHANNELS.renderer.initConfig,
      this.customSettings,
    );
  }

  private initConfigFile() {
    try {
      fs.writeFileSync(this.pathSettings, JSON.stringify(initSettings));
    } catch (err) {
      console.log(err);
    }
  }

  private readSettings(): boolean {
    try {
      const data = fs.readFileSync(this.pathSettings, { encoding: "utf8" });
      this.customSettings = JSON.parse(data);
      return true;
    } catch (err) {
      if (isApiError(err)) {
        console.log(err);
      }
      return false;
    }
  }

  private writeFile() {
    fs.writeFile(
      this.pathSettings,
      JSON.stringify(this.customSettings),
      (err) => {
        if (err) {
          console.log(err);
        }
      },
    );
  }

  updateUserName(userName: string) {
    this.customSettings.userName = userName;
    this.writeFile();
  }

  updateBinding(profileUid: string, binding: InputBinding) {
    const profileIndex = this.customSettings.profiles.findIndex(
      (profile) => profile.uid === profileUid,
    );
    if (profileIndex !== -1) {
      const index = this.customSettings.profiles[
        profileIndex
      ].bindings.findIndex(
        (storedBinding) => storedBinding.uid === binding.uid,
      );
      if (index == -1) {
        this.customSettings.profiles[profileIndex].bindings.push(binding);
      } else {
        this.customSettings.profiles[profileIndex].bindings[index] = binding;
      }
    }

    this.writeFile();
  }
}

export default SettingManager;
