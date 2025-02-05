<template>
  <v-container class="playDialog" @keydown="enterNewKey" tabindex="-1">
    <v-row justify="center">
      <v-col cols="2" align-self="center" style="margin-top: 10px">
        Name
      </v-col>
      <v-col cols="7">
        <v-text-field
          variant="underlined"
          hide-details="auto"
          v-model="name"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-row justify="center" style="margin-bottom: 10px">
      <v-col cols="2" align-self="center"> Key </v-col>
      <v-col cols="7">
        <v-row no-gutters>
          <v-col cols="7" align-self="center">
            <div>
              {{ inputName }}
            </div>
            <div class="errorField" v-if="keyIsTaken">
              The Key is already taken.
            </div>
            <div class="errorField" v-if="!keyIsTaken && keyIsRequired">
              You have to enter a key.
            </div>
          </v-col>
          <v-col cols="5" style="display: flex; justify-content: flex-end">
            <v-btn elevation="2" color="primary" @click="startKeyDetection">
              <v-progress-circular
                v-if="isKeyDetecting"
                indeterminate
                color="red"
                :size="20"
              ></v-progress-circular>
              <div style="padding: 5px">Detect</div>
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="2" align-self="center"> Intensity </v-col>
      <v-col cols="7">
        <v-row no-gutters class="slider">
          <v-slider
            v-model="intensity"
            step="0.1"
            max="1"
            min="0"
            hide-details
            style="margin: 0px"
          />
          <div style="margin-left: 20px">
            {{ `${intensity * 100} %` }}
          </div>
        </v-row>
      </v-col>
    </v-row>
    <v-row justify="center" style="margin-top: 10px">
      <v-col cols="2" align-self="center"> Color </v-col>
      <v-col cols="7">
        <v-row style="justify-content: space-between" no-gutters>
          <v-col cols="1" v-for="(item, index) in colors" :key="index">
            <span
              class="dot"
              :style="[
                item == colorButtons
                  ? { backgroundColor: item, border: 'solid 0.11em' }
                  : { backgroundColor: item },
              ]"
              @click="colorButtons = item"
            ></span>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row class="pa-3">
      <div class="listChannels">
        <v-card
          v-for="(item, index) in channelActive"
          :key="index"
          class="actuator"
          @click="updateChannel(item, index)"
          :style="{ backgroundColor: colorActuator(index) }"
        >
          {{ index + 1 }}
        </v-card>
      </div>
    </v-row>
    <v-row no-gutters class="pa-3">
      <v-btn elevation="2" color="primary" @click="$emit('closeDialog')">
        Cancel
      </v-btn>
      <v-spacer />
      <v-btn
        elevation="2"
        color="primary"
        style="margin-right: 20px"
        v-if="keyButtonId !== undefined"
        @click="deleteButton"
      >
        Delete
      </v-btn>
      <v-btn elevation="2" color="primary" @click="modifyButton">
        Confirm
      </v-btn>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.playDialog {
  background-color: white;
  min-width: 90%;
  align-items: center;
  border-radius: 20px;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
}

.playDialog:focus {
  outline: none;
}

.dot {
  height: 30px;
  width: 30px;
  border-radius: 50%;
  display: inline-block;
  cursor: pointer;
}

.listChannels {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;

  .actuator {
    justify-content: center;
    align-items: center;
    display: flex;
    min-width: 80px;
    min-height: 80px;
  }
}

.errorField {
  font-size: 0.8em;
  color: red;
}

.slider {
  justify-content: center;
  align-items: center;
}
</style>

<script lang="ts">
import { GeneralMutations } from "@/renderer/store/modules/generalSettings/generalSettings";
import {
  PlayGroundActionTypes,
  PlayGroundMutations,
} from "@/renderer/store/modules/collaboration/playGround/types";
import { useStore } from "@/renderer/store/store";
import { RouterNames } from "@/renderer/router/Routernames";
import { defineComponent } from "vue";
import { lightenDarkenColor, defaultColors } from "@/renderer/plugins/colors";
import { createInputDetection } from "@/main/Input/InputDetection";
import { InputEvent } from "@/main/Input/InputDetection/types";
import {
  UserInput,
  UserInputType,
  KeyInput,
} from "@/main/Input/InputDetection/InputDetection";
import {
  InputBinding,
  isIntensityAction,
  isActuatorAction,
} from "@/main/Input/InputDetection/InputBindings";
import getInputName from "@/main/Input/InputDetection/getInputName";
import {
  StateProfile,
  state,
} from "@/renderer/store/modules/collaboration/playGround/playGround";

export default defineComponent({
  name: "CollaborationDialog",
  emits: ["closeDialog"],
  props: {
    keyButtonId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      store: useStore(),
      isKeyDetecting: false,
      keyIsTaken: false,
      keyIsRequired: false,
      name: "",
      key: "",
      input: null as UserInput | null,
      profile: null as StateProfile | null,
      intensity: 1,
      colorButtons: defaultColors[1],
      channelActive: new Array(0).fill(false),
      colors: defaultColors,
      detection: createInputDetection({
        onInput: (e) => this.onDetectionInput(e),
      }),
    };
  },
  mounted() {
    //console.log("this.keyButtonId: " +this.keyButtonId);
    this.store.commit(
      GeneralMutations.CHANGE_VISIBILE_VIEW,
      RouterNames.PLAY_GROUND_DIALOG,
    );

    /**
      set the number of maximum activeChannels
    */
    this.channelActive = new Array(5).fill(false);

    /**
    set channels active, if the area button get modified
    */
    if (this.keyButtonId == undefined) {
      this.profile = state.profiles[0];
      return;
    }
    const result = this.store.getters.getKeyButton(this.keyButtonId);
    if (result == undefined) return;
    const { profile, binding } = result;
    this.profile = profile;

    //insert values in dialog of found button
    if (binding.name !== undefined) this.name = binding.name;

    if (binding.inputs.length > 0) this.input = binding.inputs[0];
    this.colorButtons = binding.color;

    const intensityAction = binding.actions.find(isIntensityAction);
    if (intensityAction) this.intensity = intensityAction.intensity;

    const channels = binding.actions
      .filter(isActuatorAction)
      .map((action) => action.channel);
    channels.forEach((channel) => {
      this.channelActive[channel] = true;
    });
  },
  computed: {
    colorActuator() {
      return (index: number) => {
        if (this.channelActive[index])
          return lightenDarkenColor(this.colorButtons, -100);
        return this.colorButtons;
      };
    },
    inputName(): string | undefined {
      if (!this.input) return;
      return getInputName(this.input);
    },
  },
  methods: {
    updateChannel(currentState: boolean, index: number) {
      this.channelActive[index] = !currentState;
    },
    stopKeyDetection() {
      //stop the key detection ;
      this.isKeyDetecting = false;
      this.detection.stop();
    },
    startKeyDetection() {
      if (this.isKeyDetecting) return;
      this.isKeyDetecting = true;
      this.detection.start();
      setTimeout(this.stopKeyDetection, 5000);
    },
    enterNewKey(e: KeyboardEvent) {
      //check if user want to enter key
      if (!this.isKeyDetecting) return;

      const keyInput: KeyInput = {
        type: UserInputType.Key,
        key: e.key.toUpperCase(),
      };

      this.input = keyInput;
      this.onUserInput();
    },
    onDetectionInput(e: InputEvent) {
      this.input = e.input;
      this.onUserInput();
    },
    onUserInput() {
      this.keyIsRequired = false;

      if (
        this.input &&
        this.profile &&
        this.store.getters.isInputAlreadyTaken(
          this.keyButtonId,
          this.profile,
          this.input,
        )
      ) {
        this.keyIsTaken = true;
        return;
      }

      this.keyIsTaken = false;
      this.isKeyDetecting = false;
      this.stopKeyDetection();
    },
    deleteButton() {
      if (this.keyButtonId == undefined) return;
      if (!this.profile) return;

      this.store.commit(PlayGroundMutations.DELETE_ITEM_FROM_GRID, {
        uid: this.keyButtonId,
        profileUid: this.profile.uid,
      });
      this.$emit("closeDialog");
    },
    modifyButton() {
      if (!this.input || !this.profile) {
        this.keyIsRequired = true;
        return;
      }

      if (this.keyIsTaken) return;

      const channels: number[] = [];
      this.channelActive.forEach((isActive, index) => {
        if (isActive) channels.push(index);
      });

      const binding: Omit<InputBinding, "uid" | "position"> = {
        inputs: [{ ...this.input }],
        name: this.name,
        color: this.colorButtons,
        actions: channels.map((channel) => ({
          type: "trigger_actuator",
          channel,
          intensity: this.intensity,
        })),
      };

      if (this.keyButtonId == undefined) {
        this.store.dispatch(PlayGroundActionTypes.addButtonToGrid, {
          profile: this.profile,
          binding,
        });
        this.$emit("closeDialog");
      } else {
        console.log("updating ", this.profile, binding, this.keyButtonId);
        this.store.dispatch(PlayGroundActionTypes.updateKeyButton, {
          id: this.keyButtonId,
          profileUid: this.profile.uid,
          props: binding,
        });
        this.$emit("closeDialog");
      }
    },
  },
});
</script>
