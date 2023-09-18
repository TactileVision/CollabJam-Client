<template>
  <v-card class="mx-auto pa-1 keyButton" max-width="100" min-width="100" min-height="100" @click="handleMouse(false)"
    @mouseleave="handleMouseLeave()" @mousedown="handleMouse(true)" v-bind:style="{ backgroundColor: colorActuator }">
    <v-card-text style="padding: 1px" class="keyButton">
      <v-row no-gutters>
        {{ binding.name }}
        <v-spacer />
        <div>{{ intensity }}%</div>
      </v-row>
      <v-row no-gutters class="cardMainRow">
        <div>{{ inputName }}</div>
      </v-row>
    </v-card-text>
    <v-card-actions style="padding: 2px; min-height: 0">
      <v-row align="center" no-gutters justify="center">
        {{ listChannels() }}
        <v-spacer />
        <v-icon class="mr-1" small v-if="store.state.playGround.inEditMode">
          mdi-pencil
        </v-icon>
      </v-row>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.keyButton {
  display: flex;
  flex-direction: column;
  -webkit-user-select: none;
  /* Safari */
  -moz-user-select: none;
  /* Firefox */
  -ms-user-select: none;
  /* IE10+/Edge */
  user-select: none;
  /* Standard */
}

.cardMainRow {
  flex-grow: 1;
  margin: 0;
  justify-content: center;
  align-items: center;
  font-size: 2em;
  font-weight: bold;
}
</style>

<script lang="ts">
import { useStore } from "@/app/store/store";
import { defineComponent } from "@vue/runtime-core";
import { isActuatorAction, isIntensityAction } from "@/core/Input/InputDetection/types/InputBindings";
import getInputName from "@/core/Input/InputDetection/getInputName";
import { lightenDarkenColor } from "@/app/lib/colors";
import { PlayGroundActionTypes } from "@/feature/collabJamming/store/playGround/types";
import { StateInputBinding, StateProfile } from "@/feature/collabJamming/store/playGround/playGround";

export default defineComponent({
  name: "KeyBoardButton",
  data() {
    return {
      store: useStore(),
      buttonPressed: false,
    };
  },
  props: {
    binding: {
      type: Object as () => StateInputBinding,
      required: true,
    },
    profile: {
      type: Object as () => StateProfile,
      required: true,
    },
    isMoved: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["updateisMoved", "editButton"],
  computed: {
    colorActuator() {
      if (this.binding.activeTriggers > 0)
        return lightenDarkenColor(this.binding.color, -100);
      return this.binding.color;
    },
    inputName() {
      return getInputName(this.binding.inputs[0]);
    },
    intensity() {
      const intensityAction = this.binding.actions.find(isIntensityAction);
      if (intensityAction) {
        return intensityAction.intensity * 100;
      } else {
        return '-';
      }
    }
  },
  methods: {
    handleMouseLeave() {
      if (!this.buttonPressed) return;
      if (!this.store.state.playGround.inEditMode) {
        this.buttonPressed = false;
        this.store.dispatch(PlayGroundActionTypes.deactivateKey, {
          profile: this.profile,
          input: this.binding.inputs[0]
        });
      }
    },
    handleMouse(mouseDown: boolean) {
      if (this.isMoved) {
        //moving card is finished, reset variable
        this.$emit("updateisMoved", false);
        return;
      }

      if (this.store.state.playGround.inEditMode) {
        if (!mouseDown) {
          //the button wanted to be edit
          this.$emit("editButton", this.binding.uid);
        }
      } else {
        if (mouseDown) {
          //button clicked
          this.buttonPressed = true;
          this.store.dispatch(PlayGroundActionTypes.activateKey, {
            profile: this.profile,
            input: this.binding.inputs[0],
            value: 1,
            wasActive: false,
          });
        } else {
          if (this.buttonPressed) {
            this.buttonPressed = false;
            this.store.dispatch(PlayGroundActionTypes.deactivateKey, {
              profile: this.profile,
              input: this.binding.inputs[0],
            });
          }
        }
      }
    },
    listChannels(): string {
      let channelList = "[";
      const channels = this.binding.actions.filter(isActuatorAction).map(action => action.channel);

      channels.forEach((channel: number, index: number) => {
        channelList += channel + 1;
        if (index !== channels.length - 1) channelList += ", ";
      });
      channelList += "]";
      return channelList;
    },
  },
});
</script>
