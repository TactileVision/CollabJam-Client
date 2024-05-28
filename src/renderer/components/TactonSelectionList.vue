<template>
  <h5 class="text-h5">Tactons</h5>
  <div style="margin-top: 16px">
    <span class="overline">Save as: </span>
    <span>
      <strong> {{ store.state.roomSettings.recordingNamePrefix }}</strong>
    </span>
    <v-btn
      variant="text"
      @click="showEditPrefix = !showEditPrefix"
      color="primary"
    >
      {{ showEditPrefix ? "Close" : "Edit" }}
    </v-btn>
  </div>
  <div v-if="showEditPrefix" class="editPrefix">
    <v-text-field
      v-model="editPrefixText"
      id="edit-prefix-input"
      type="text"
      label="Enter prefix"
      hide-details
      variant="outlined"
      class="mb-2"
    ></v-text-field>
    <v-btn
      block
      :disabled="
        editPrefixText == '' ||
        editPrefixText == store.state.roomSettings.recordingNamePrefix
      "
      @click="updatePrefix"
      color="primary"
    >
      Save
    </v-btn>
  </div>
  <!-- </v-sheet> -->

  <!-- MARK: Tacton List -->
  <v-switch
    v-model="filteredView"
    :disabled="store.state.tactonPlayback.tactons.length == 0"
    hide-details
    label="Show Favorites only"
    color="primary"
  ></v-switch>
  <v-expansion-panels>
    <v-expansion-panel v-for="group of sortByPrefix()" :elevation="'0'">
      <v-expansion-panel-title>
        <v-chip
          prepend-icon="mdi-waveform"
          class="ma-2"
          color="primary"
          size="x-small"
        >
          {{ group.tactons.length }}
        </v-chip>
        {{ group.prefix }}
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-list
          lines="one"
          :selected="selectedItems"
          color="primary"
          density="compact"
        >
          <v-list-item
            style="padding-left: 0"
            v-for="tacton of group.tactons"
            :disabled="store.state.roomSettings.mode != 1"
            :key="tacton.uuid"
            class="non-selectable show-buttons-on-hover"
            :active="tacton === selection"
            @click=""
          >
            <template #prepend>
              <v-list-item-action>
                <v-btn
                  :icon="
                    tacton.metadata.favorite ? 'mdi-star' : 'mdi-star-outline'
                  "
                  variant="plain"
                  @click="toggleFavorite(tacton)"
                >
                </v-btn>
              </v-list-item-action>
            </template>

            <v-list-item-title @click="handleLeftClickOnTacton(tacton)">
              {{ tacton.metadata.name }}
              {{ tacton.metadata.iteration }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{
                `${(calculateDuration(tacton) / 1000).toFixed(2)} s    ${tacton.metadata.recordDate}`
              }}
            </v-list-item-subtitle>

            <template #append>
              <v-list-item-action>
                <div class="show-on-hover">
                  <v-btn
                    :icon="'mdi-dots-vertical'"
                    variant="plain"
                    @click="openOptionsMenu(tacton)"
                  >
                  </v-btn>
                </div>
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
  <!-- </v-sheet> -->
  <!--MARK: TactonMetadataDialog-->
  <v-dialog width="800px" v-model="showEditMetadata">
    <v-card>
      <v-card-title>
        <v-text-field v-model="tactonTitle" variant="underlined"></v-text-field>
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4" sm="6">
            <v-text-field
              label="Duration"
              :model-value="`${(calculateDuration(selection!) / 1000).toFixed(2)} s`"
              variant="underlined"
              readonly
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="4" sm="6">
            <v-text-field
              label="RecordDate"
              :model-value="
                Intl.DateTimeFormat('default', { dateStyle: 'long' }).format(
                  new Date(selection!.metadata.recordDate),
                )
              "
              variant="underlined"
              readonly
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-textarea
              label="Description"
              v-model="tactonDescription"
              variant="underlined"
              auto-grow
            ></v-textarea>
          </v-col>

          <v-col cols="12">
            <v-combobox
              v-model="selectedCustomTags"
              variant="underlined"
              label="CustomTags"
              :items="customTags"
              multiple
            ></v-combobox>
          </v-col>

          <v-col cols="12">
            <v-autocomplete
              :items="
                Object.keys(bodyTags).filter((item) => {
                  return isNaN(Number(item));
                })
              "
              variant="underlined"
              label="BodyTags"
              auto-select-first
              multiple
              return-object
              v-model="selectedBodyTags"
            ></v-autocomplete>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text="Close"
          variant="plain"
          @click="showEditMetadata = false"
        ></v-btn>
        <v-btn
          color="primary"
          text="Save"
          variant="tonal"
          @click="saveNewMetadata()"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!--MARK: MoveTactonDialog-->
  <v-dialog width="300px" v-model="showTactonMenu">
    <v-card>
      <!--OptionTitleSlide-->
      <div v-show="!isMovingTacton">
        <v-card-title>Options</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-btn
                color="primary"
                variant="tonal"
                class="w-100"
                prepend-icon="mdi-trash-can-outline"
                text="Delete"
                @click="deleteTacton()"
              >
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn
                color="primary"
                variant="tonal"
                class="w-100"
                prepend-icon="mdi-content-copy"
                text="Clone"
                @click="cloneTacton()"
              >
              </v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn
                color="primary"
                variant="tonal"
                class="w-100"
                prepend-icon="mdi-arrow-left-bottom"
                text="Move"
                @click="isMovingTacton = true"
              >
              </v-btn>
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
      <!--MoveTactonSlide-->
      <div v-show="isMovingTacton">
        <v-card-title>{{
          "Move " + optionsTacton?.metadata.name + " to"
        }}</v-card-title>
        <v-card-text>
          <v-list lines="one" color="primary" density="compact">
            <v-list-item
              style="width: 100%"
              v-for="room of store.state.roomSettings.availableRooms.filter(
                (r) => {
                  return r.id !== store.state.roomSettings.id;
                },
              )"
              :key="room.id"
              :title="room.name"
              @click="moveTacton(room)"
            >
            </v-list-item>
          </v-list>
        </v-card-text>
      </div>
      <v-divider></v-divider>
      <!--Exit Menu-->
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text="Close"
          variant="plain"
          @click="showTactonMenu = false"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.non-selectable {
  user-select: none;
}

.show-buttons-on-hover:hover .show-on-hover {
  opacity: 100%;
}

.show-on-hover {
  opacity: 0;
  transition: 0.5s;
}

// #prefix-input {
//   border-style: solid;
// }
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/renderer/store/store";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { WebSocketAPI } from "@/main/WebSocketManager";
import { InteractionMode, Room } from "@sharedTypes/roomTypes";
import { Tacton } from "@sharedTypes/tactonTypes";
import { ChangeTactonMetadata } from "@sharedTypes/websocketTypes";
import WebsocketToggle from "./WebsocketToggle.vue";

enum BodyTags {
  Head,
  LeftShoulder,
  RightShoulder,
  LeftUpperArm,
  LeftForearm,
  LeftHand,
  RightUpperArm,
  RightForeArm,
  RightHand,
  Torso,
  LeftThigh,
  LeftLowerLeg,
  RightThigh,
  RightLowerLeg,
}
export default defineComponent({
  name: "TactonSelectionList",
  // props: {},
  data() {
    return {
      store: useStore(),
      showEditPrefix: false,
      editPrefixText: "",
      filteredView: false,
      selection: null as null | Tacton,
      selectedItems: [], // don't know why this has to exist,
      showEditMetadata: false,
      showTactonMenu: false,
      optionsTacton: null as null | Tacton,
      isMovingTacton: false,
      bodyTags: BodyTags,
      rooms: null as null | Room[],
      //optionsMenu
      tactonTitle: "",
      tactonDescription: "",
      selectedBodyTags: [],
      selectedCustomTags: [],
      // list of previously used customTags user can choose from
      customTags: ["Workshop", "SampleCustomTag"],
    };
  },
  computed: {
    currentTacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
  },
  watch: {
    currentTacton(tacton) {
      if (tacton == null) {
        this.selection = null;
      } else {
        this.selection = tacton;
      }
    },
  },
  methods: {
    selectTacton(tacton: Tacton) {
      this.selection = tacton;
      this.store.dispatch(TactonPlaybackActionTypes.selectTacton, tacton.uuid);
    },
    calculateDuration(tacton: Tacton): number {
      let d = 0;
      tacton.instructions.forEach((t) => {
        if ("wait" in t) {
          const w = t;
          d += w.wait.miliseconds;
        }
      });
      return d;
    },
    updatePrefix() {
      console.log(this.editPrefixText);
      WebSocketAPI.updateTactonFilenamePrefix({
        roomId: this.store.state.roomSettings.id || "",
        prefix: this.editPrefixText,
      });
      return;
    },
    toggleFavorite(tacton: Tacton) {
      // const m: TactonMetadata = {
      //   name: tacton.metadata.name,
      //   // iteration: tacton.metadata.iteration,
      //   favorite: !tacton.metadata.favorite,
      //   recordDate: tacton.metadata.recordDate,
      // };
      tacton.metadata.favorite = !tacton.metadata.favorite;
      if (this.store.state.roomSettings.id != undefined) {
        const payload: ChangeTactonMetadata = {
          roomId: this.store.state.roomSettings.id,
          tactonId: tacton.uuid,
          metadata: tacton.metadata,
        };
        WebSocketAPI.changeTactonMetadata(payload);
      }
    },
    shouldDisplay(tacton: Tacton) {
      if (!this.filteredView) return true;
      return tacton.metadata.favorite;
    },
    getTactons() {
      if (this.filteredView) {
        return this.store.state.tactonPlayback.tactons.filter((t) => {
          return this.shouldDisplay(t);
        });
      }
      return this.store.state.tactonPlayback.tactons;
    },
    getModeString(mode: InteractionMode) {
      switch (mode) {
        case InteractionMode.Jamming:
          return "Jamming";
        case InteractionMode.Recording:
          return "Recording";
        case InteractionMode.Playback:
          return "Playback";
        default:
          return "Unkwown";
      }
    },
    openOptionsMenu(tacton: Tacton) {
      this.isMovingTacton = false;
      this.optionsTacton = tacton;
      this.showTactonMenu = true;
    },
    handleLeftClickOnTacton(tacton: Tacton) {
      if (this.selection === tacton) {
        // TODO load current metaData of this.selection
        this.tactonTitle = this.selection.metadata.name;

        // open metadata menu
        this.showEditMetadata = true;
      } else {
        // load and select
        this.selectTacton(tacton);
        this.optionsTacton = tacton;
      }
    },
    sortByPrefix(): { prefix: string; tactons: Tacton[] }[] {
      const tactons: Tacton[] = this.getTactons();
      const prefixMap: { [key: string]: Tacton[] } = {};

      tactons.forEach((t: Tacton) => {
        // remove last two chars to get prefix
        // const prefix = t.metadata.name.slice(0, -2);
        const prefix = t.metadata.name;
        if (!prefixMap[prefix]) {
          //add new prefix
          prefixMap[prefix] = [];
        }
        prefixMap[prefix].push(t);
      });

      console.log(
        Object.keys(prefixMap).map((prefix) => ({
          prefix,
          tactons: prefixMap[prefix],
        })),
      );
      return Object.keys(prefixMap).map((prefix) => ({
        prefix,
        tactons: prefixMap[prefix],
      }));
    },
    moveTacton(room: Room) {
      console.log(
        `moving ${this.optionsTacton?.metadata.name} ${this.store.state.roomSettings.roomName} to  ${room.name} `,
      );
      if (
        this.store.state.roomSettings.id == undefined ||
        this.optionsTacton?.uuid == undefined
      ) {
        return;
      }
      //TODO move tacton to room
      WebSocketAPI.moveTacton(
        this.store.state.roomSettings.id,
        room.id,
        this.optionsTacton?.uuid,
      );
      this.optionsTacton = null;
      this.showTactonMenu = false;
    },
    deleteTacton() {
      console.log("deleting ", this.optionsTacton?.metadata.name);

      if (
        this.optionsTacton != null &&
        this.store.state.roomSettings.id != undefined
      ) {
        WebSocketAPI.deleteTacton(
          this.optionsTacton?.uuid,
          this.store.state.roomSettings.id,
        );
      }
      this.optionsTacton = null;
      this.showTactonMenu = false;
    },
    cloneTacton() {
      console.log("cloning ", this.optionsTacton?.metadata.name);

      if (
        this.optionsTacton != null &&
        this.store.state.roomSettings.id != undefined
      ) {
        //TODO delete tacton
        console.log("Duplicating tacton");
        WebSocketAPI.duplicateTacton(
          this.optionsTacton?.uuid,
          this.store.state.roomSettings.id,
        );
      }
      this.optionsTacton = null;
      this.showTactonMenu = false;
    },
    saveNewMetadata() {
      console.log("SAVING METADATA");
      console.log(this.optionsTacton);
      console.log(this.store.state.roomSettings.id);

      if (
        this.optionsTacton == null ||
        this.store.state.roomSettings.id == null
      )
        return;
      console.log("new tactonTitle: ", this.tactonTitle);
      console.log("new description: ", this.tactonDescription);
      console.log("new customTags: ", this.selectedCustomTags);
      console.log("new bodyTags: ", this.selectedBodyTags);

      //TODO save new Metadata
      WebSocketAPI.changeTactonMetadata({
        metadata: {
          name: this.tactonTitle,
          iteration: this.optionsTacton.metadata.iteration,
          bodyTags: this.selectedBodyTags,
          customTags: this.selectedCustomTags,
          description: this.tactonDescription,
          recordDate: this.optionsTacton.metadata.recordDate,
          favorite: this.optionsTacton.metadata.favorite,
        },
        roomId: this.store.state.roomSettings.id,
        tactonId: this.optionsTacton.uuid,
      });

      this.showEditMetadata = false;
    },
  },
});
</script>
