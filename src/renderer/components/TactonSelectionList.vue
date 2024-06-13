<template>
  <v-sheet elevation="0" class="mr-2 pa-4">
    <h6 class="text-h6">Tactons</h6>
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
    <v-switch
      v-model="filteredView"
      :disabled="store.state.tactonPlayback.tactons.length == 0"
      hide-details
      label="Show Favorites only"
      color="primary"
    ></v-switch>
  </v-sheet>
  <!-- MARK: Tacton List -->
  <v-virtual-scroll :height="windowHeight - 196" :items="sortByPrefix()">
    <template #default="{ item, index: groupIndex }">
      <v-expansion-panels :key="groupIndex">
        <v-expansion-panel :elevation="'0'">
          <v-expansion-panel-title
            :class="groupIndex === selectedPrefixgroupId ? 'text-primary' : ''"
          >
            <v-chip
              prepend-icon="mdi-waveform"
              class="ma-2"
              color="primary"
              size="x-small"
            >
              {{ item.tactons.length }}
            </v-chip>
            {{ item.prefix }}
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
                v-for="tacton of item.tactons"
                :disabled="store.state.roomSettings.mode != 1"
                :key="tacton.uuid"
                class="non-selectable show-buttons-on-hover"
                :active="tacton === selection"
                selectable="true"
                @click="selectTacton(tacton, groupIndex)"
              >
                <template #prepend>
                  <v-list-item-action>
                    <v-btn
                      size="small"
                      :icon="
                        tacton.metadata.favorite
                          ? 'mdi-star'
                          : 'mdi-star-outline'
                      "
                      variant="plain"
                      @click="toggleFavorite(tacton)"
                    >
                    </v-btn>
                  </v-list-item-action>
                </template>

                <v-list-item-title>
                  {{ tacton.metadata.name }} {{ tacton.metadata.iteration }}
                </v-list-item-title>

                <v-list-item-subtitle class="py-2">
                  <v-chip size="small" v-show="!hasMetadata(tacton)">
                    <v-icon
                      size=""
                      icon="mdi-file-document-remove-outline"
                    ></v-icon>
                    No details
                  </v-chip>
                  <v-chip v-show="hasMetadata(tacton)">
                    <v-icon
                      size=""
                      icon="mdi-file-document-check-outline"
                    ></v-icon>
                    details
                  </v-chip>
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
    </template>
  </v-virtual-scroll>

  <!-- </v-sheet> -->
  <!--MARK: TactonMetadataDialog-->
  <v-dialog width="800px" v-model="showEditMetadata">
    <v-card>
      <v-form v-model="metadataForm">
        <v-card-title>
          <v-text-field
            label="Name"
            v-model="tactonTitle"
            variant="underlined"
            :rules="[rules.required, rules.charLimit]"
            :hint="hint.name"
          ></v-text-field>
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Duration"
                :model-value="`${(calculateDuration(optionsTacton!) / 1000).toFixed(2)} s`"
                variant="underlined"
                readonly
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field
                label="Recording Date"
                :model-value="
                  Intl.DateTimeFormat('default', { dateStyle: 'long' }).format(
                    new Date(optionsTacton!.metadata.recordDate),
                  )
                "
                variant="underlined"
                readonly
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-combobox
                v-model="tactonPrompt"
                variant="underlined"
                label="Prompt"
                :hint="hint.prompt"
                :items="availablePromptTags"
                chips
              ></v-combobox>
            </v-col>

            <v-col cols="12">
              <v-textarea
                label="Intention"
                v-model="tactonIntention"
                :hint="hint.intention"
                variant="underlined"
                auto-grow
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-textarea
                label="Notes"
                v-model="tactonNotes"
                :hint="hint.notes"
                variant="underlined"
                auto-grow
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-combobox
                v-model="selectedCustomTags"
                variant="underlined"
                label="Custom Tags"
                :items="availableCustomTags"
                :hint="hint.customTags"
                multiple
                chips
              ></v-combobox>
            </v-col>

            <v-col cols="12">
              <v-autocomplete
                :items="bodyTags"
                :hint="hint.bodyTags"
                variant="underlined"
                label="Body Tags"
                auto-select-first
                multiple
                return-object
                v-model="selectedBodyTags"
                chips
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
            :disabled="!metadataForm"
            color="primary"
            text="Save"
            variant="tonal"
            @click="saveNewMetadata()"
          ></v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
  <!--MARK: TactonOptionsDialog-->
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
                prepend-icon="mdi-file-document-outline"
                text="Metadata"
                @click="openMetadataMenu()"
              >
              </v-btn>
            </v-list-item>
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
:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}

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
</style>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useStore } from "@/renderer/store/store";
import { TactonPlaybackActionTypes } from "@/renderer/store/modules/collaboration/tactonPlayback/tactonPlayback";
import { WebSocketAPI } from "@/main/WebSocketManager";
import { InteractionMode, Room } from "@sharedTypes/roomTypes";
import { Tacton, TactonMetadata } from "@sharedTypes/tactonTypes";
import { ChangeTactonMetadata } from "@sharedTypes/websocketTypes";

const charLimit = 20;
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
      rooms: null as null | Room[],
      //optionsMenu
      metadataForm: false,
      tactonTitle: "",
      tactonNotes: "",
      tactonIntention: "",
      tactonPrompt: null as string | null,
      selectedBodyTags: [] as string[],
      selectedCustomTags: [] as string[],
      // list of previously used customTags user can choose from
      // rules for validating input
      rules: {
        required: (value: string) => !!value || "Field is required",
        charLimit: (value: string) =>
          value.length <= charLimit ||
          `Input is limited to ${charLimit} characters`,
      },
      hint: {
        name: "Please provide a name for this tacton. Note, if the same name already exists, a number is automatically added at the end.",
        prompt:
          "Please select or type the prompt-id you designed for. We provide a list of prompt separately.",
        intention:
          "Please write briefly what you intend to express or represent with this tacton. For instance, have you focused on a particular aspect of the prompt.",
        notes:
          "You can add further notes here. For example, how you would like to develop the tacton further, or if you want to share further details on the actuator arrangement.",
        customTags: "Select or add tags to classify tactons.",
        bodyTags:
          "Select one or more tags to indicate where you placed the actuators.",
      },
      windowHeight: window.innerHeight,
      selectedPrefixgroupId: null as null | number,
    };
  },
  computed: {
    currentTacton(): Tacton | null {
      return this.store.state.tactonPlayback.currentTacton;
    },
    currentTactonMetadata(): TactonMetadata | null {
      if (this.store.state.tactonPlayback.currentTacton == undefined) {
        return null;
      }
      return this.store.state.tactonPlayback.currentTacton?.metadata;
    },
    availableCustomTags(): string[] {
      return this.store.state.roomSettings.availableCustomTags;
    },
    availablePromptTags(): string[] {
      return this.store.state.roomSettings.availablePromptTags;
    },
    bodyTags(): string[] {
      return this.store.state.roomSettings.availableBodyTags;
    },
  },
  watch: {
    currentTacton(tacton) {
      if (tacton == null) {
        this.selection = null;
        this.selectedPrefixgroupId = -1;
      } else {
        this.selection = tacton;

        // TODO only get this list once on startup
        const groupedTactons = this.sortByPrefix();

        let id = 0;
        for (let group of groupedTactons) {
          if (group.tactons.indexOf(tacton) > -1) {
            break;
          }
          id++;
        }
        this.selectedPrefixgroupId = id;

        this.updateComponentMetadata(tacton.metadata);
      }
    },
    currentTactonMetadata(metadata) {
      if (metadata != null) {
        this.updateComponentMetadata(metadata);
      }
    },
  },
  methods: {
    ref,
    selectTacton(tacton: Tacton, groupId: number) {
      this.selection = tacton;
      this.store.dispatch(TactonPlaybackActionTypes.selectTacton, tacton.uuid);
      this.selectedPrefixgroupId = groupId;
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
    updateComponentMetadata(metadata: TactonMetadata) {
      this.tactonIntention = metadata.intention;
      this.tactonNotes = metadata.notes;

      if (metadata.prompt == "") {
        this.tactonPrompt = null;
      } else {
        this.tactonPrompt = metadata.prompt;
      }
      this.selectedBodyTags = metadata.bodyTags;
      this.selectedCustomTags = metadata.customTags;
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

      const o = Object.keys(prefixMap).map((prefix) => ({
        prefix,
        tactons: prefixMap[prefix],
      }));
      o.sort((a, b) =>
        a.prefix > b.prefix ? 1 : b.prefix > a.prefix ? -1 : 0,
      );

      return o;
    },
    hasMetadata(tacton: Tacton) {
      return (
        tacton.metadata.bodyTags.length !== 0 ||
        tacton.metadata.customTags.length !== 0 ||
        tacton.metadata.notes !== "" ||
        tacton.metadata.prompt !== "" ||
        tacton.metadata.intention != ""
      );
    },
    openOptionsMenu(tacton: Tacton) {
      this.isMovingTacton = false;
      this.optionsTacton = tacton;
      this.showTactonMenu = true;
    },
    moveTacton(room: Room) {
      console.log(
        "moving ",
        this.optionsTacton?.metadata.name,
        " to ",
        room.name,
      );

      if (
        this.store.state.roomSettings.id == null ||
        this.optionsTacton == undefined
      ) {
        console.log(
          "Error, can't move tacton because current roomid or tacton to move are null/undefined ",
        );
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
    openMetadataMenu() {
      if (this.optionsTacton === null) return;

      // TODO load current metaData of this.selection
      this.tactonTitle = this.optionsTacton.metadata.name;

      // close options dialog
      this.showTactonMenu = false;
      // open metadata menu
      this.showEditMetadata = true;
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
      // console.log("new tactonTitle: ", this.tactonTitle);
      // console.log("new notes: ", this.tactonNotes);
      // console.log("new customTags: ", this.selectedCustomTags);
      // console.log("new bodyTags: ", this.selectedBodyTags);

      //TODO save new Metadata
      WebSocketAPI.changeTactonMetadata({
        metadata: {
          name: this.tactonTitle,
          iteration: this.optionsTacton.metadata.iteration,
          bodyTags: this.selectedBodyTags,
          customTags: this.selectedCustomTags,
          notes: this.tactonNotes,
          prompt: this.tactonPrompt == null ? "" : this.tactonPrompt,
          intention: this.tactonIntention,
          recordDate: this.optionsTacton.metadata.recordDate,
          favorite: this.optionsTacton.metadata.favorite,
        },
        roomId: this.store.state.roomSettings.id,
        tactonId: this.optionsTacton.uuid,
      });

      this.showEditMetadata = false;
    },
    onResize() {
      this.windowHeight = window.innerHeight;
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener("resize", this.onResize);
    });
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
  },
});
</script>
