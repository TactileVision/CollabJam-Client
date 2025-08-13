<template>
  <v-container class="playGroundView ma-0" ref="container" tabindex="-1">
    <v-row>
      <v-col id="TactonGraphWrapperHeight" class="TactonGraphWrapperWrapper">
        <TheTimeline></TheTimeline>
      </v-col>
    </v-row>
    <v-dialog
      v-model="CollaborationDialog"
      max-width="50%"
      class="tesing"
      @click:outside="closeDialog"
    >
      <CollaborationDialog
        @close-dialog="closeDialog"
        :key-button-id="idOfEditableButton"
      />
    </v-dialog>
  </v-container>
</template>

<style scoped lang="scss">
.playGroundView {
  display: flex;
  height: 90%;
  min-width: 100%;
  max-width: 100%;
  padding: 0;
}
.playGroundView:focus {
  outline: none;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
// import ParticipantSettings from "@/renderer/components/ParticipantSettings.vue";
import CollaborationDialog from "./CollaborationDialog.vue";
import { GeneralMutations } from "@/renderer/store/modules/generalSettings/generalSettings";
import { RouterNames } from "@/renderer/router/Routernames";
import { useStore } from "@/renderer/store/store";
import { PlayGroundMutations } from "@/renderer/store/modules/collaboration/playGround/types";
import TactonSelectionList from "@/renderer/components/TactonSelectionList.vue";
import TheTimeline from "@/renderer/components/TheTimeline.vue";

export default defineComponent({
  name: "CollaborationBody",
  components: {
    TheTimeline,
    TactonSelectionList,
    CollaborationDialog,
  },
  data() {
    return {
      store: useStore(),
      CollaborationDialog: false,
      idOfEditableButton: "",
      isMounted: false,
      toggleInputDevices: false,
    };
  },
  mounted() {
    //set the focus to the gui, so key down and up is working
    this.store.commit(PlayGroundMutations.UPDATE_EDIT_MDOE, false);
  },
  methods: {
    closeDialog() {
      this.CollaborationDialog = false;
      this.store.commit(
        GeneralMutations.CHANGE_VISIBILE_VIEW,
        RouterNames.PLAY_GROUND,
      );
      // set the focus again, so key down and up is working
      // const container: object = this.$refs.container as object;
      // this.$nextTick(() => (container.$el as HTMLDivElement).focus());
    },
    startDialog(id: string) {
      //console.log("startDialog: " + id);
      this.store.commit(
        GeneralMutations.CHANGE_VISIBILE_VIEW,
        RouterNames.PLAY_GROUND_DIALOG,
      );
      this.idOfEditableButton = id;
      this.CollaborationDialog = true;
    },
  },
});
</script>
