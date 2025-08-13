import { MutationTree, GetterTree, ActionTree, ActionContext } from "vuex";
import { RootState, useStore } from "@/renderer/store/store";
import { InteractionMode, User, Room } from "@sharedTypes/roomTypes";
import { IPC_CHANNELS } from "@/preload/IpcChannels";
import { toRaw } from "vue";
/**
 * Types
 *
 */

export enum RoomState {
  Create = "Create",
  Enter = "Enter",
  Configure = "Configure",
}

/**
 * state
 *
 */

export type State = {
  roomState: RoomState;
  id: string | undefined;
  roomName: string;
  description: string;
  participants: User[];
  mutedParticipants: Set<string>;
  user: User;
  // isRecording: boolean,
  maxDuration: number;
  mode: InteractionMode;
  recordingNamePrefix: string;
  availableRooms: Room[];
  availableCustomTags: string[];
  availableBodyTags: string[];
  availablePromptTags: string[];
  currentlyEditingUserId: string | null;
};

export const state: State = {
  roomState: RoomState.Create,
  id: undefined,
  roomName: "",
  description: "",
  participants: [],
  mutedParticipants: new Set(),
  user: { id: "", name: "", color: "", muted: false }, // isRecording: false,
  maxDuration: 10000,
  mode: InteractionMode.Jamming,
  recordingNamePrefix: "",
  availableRooms: [],
  availableCustomTags: [],
  availableBodyTags: [],
  availablePromptTags: [],
  currentlyEditingUserId: null,
};
/**
 * mutations
 *
 */
export enum RoomMutations {
  CHANGE_ROOM = "CHANGE_ROOM",
  UPDATE_ROOM_NAME = "CHANGE_ROOM_NAME",
  UPDATE_ROOM_DESCRIPTION = "UPDATE_ROOM_DESCRIPTION",
  UPDATE_ROOM_STATE = "UPDATE_ROOM_STATE",
  UPDATE_USER = "UPDATE_USER",
  UPDATE_USER_NAME = "UPDATE_USER_NAME",
  UPDATE_PARTICIPANTS = "UPDATE_PARTICIPANTS",
  UPDATE_PARTICIPANT = "UPDATE_PARTICIPANT",
  UPDATE_RECORD_MODE = "UPDATE_RECORD_MODE",
  UPDATE_MAX_DURATION_TACTON = "UPDATE_MAX_DURATION_TACTON",
  SET_AVAILABLE_ROOMS = "SET_AVAILABLE_ROOMS",
  SET_AVAILABLE_CUSTOM_TAGS = "SET_AVAILABLE_CUSTOM_TAGS",
  SET_AVAILABLE_BODY_TAGS = "SET_AVAILABLE_BODY_TAGS",
  SET_AVAILABLE_PROMPT_TAGS = "SET_AVAILABLE_PROMPT_TAGS",
  UPDATE_EDITING_USER = "UPDATE_EDITING_USER",
  CLEAR_ROOM_DATA = "CLEAR_ROOM_DATA",
}

export type Mutations<S = State> = {
  [RoomMutations.CHANGE_ROOM](
    state: S,
    props: { roomState: RoomState; roomInfo: Room },
  ): void;
  [RoomMutations.UPDATE_ROOM_NAME](state: S, roomName: string): void;
  [RoomMutations.UPDATE_ROOM_DESCRIPTION](state: S, description: string): void;
  [RoomMutations.UPDATE_ROOM_STATE](state: S, roomState: RoomState): void;
  [RoomMutations.UPDATE_USER](state: S, user: User): void;
  [RoomMutations.UPDATE_USER_NAME](state: S, userName: string): void;
  [RoomMutations.UPDATE_PARTICIPANTS](state: S, participants: User[]): void;
  [RoomMutations.UPDATE_PARTICIPANT](state: S, participant: User): void;
  [RoomMutations.UPDATE_RECORD_MODE](state: S, mode: InteractionMode): void;
  [RoomMutations.UPDATE_MAX_DURATION_TACTON](
    state: S,
    maxDuration: number,
  ): void;
  [RoomMutations.SET_AVAILABLE_ROOMS](state: S, rooms: Room[]): void;
  [RoomMutations.SET_AVAILABLE_CUSTOM_TAGS](state: S, tags: string[]): void;
  [RoomMutations.SET_AVAILABLE_BODY_TAGS](state: S, tags: string[]): void;
  [RoomMutations.SET_AVAILABLE_PROMPT_TAGS](state: S, tags: string[]): void;
  [RoomMutations.UPDATE_EDITING_USER](state: S, userId: string | null): void;
  [RoomMutations.CLEAR_ROOM_DATA](state: S): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [RoomMutations.CHANGE_ROOM](state, props) {
    state.roomState = props.roomState;
    state.id = props.roomInfo.id;
    state.roomName = props.roomInfo.name;
    state.description = props.roomInfo.description;
    state.participants = props.roomInfo.participants;
    state.mutedParticipants.clear();
    // state.isRecording = props.roomInfo.isRecording;
    state.maxDuration = props.roomInfo.maxDurationRecord;
    state.recordingNamePrefix = props.roomInfo.recordingNamePrefix;
  },
  [RoomMutations.UPDATE_ROOM_NAME](state, roomName) {
    state.roomName = roomName;
  },
  [RoomMutations.UPDATE_ROOM_DESCRIPTION](state, description) {
    state.description = description;
  },
  [RoomMutations.UPDATE_ROOM_STATE](state, roomState) {
    state.roomState = roomState;
  },
  [RoomMutations.UPDATE_USER](state, user) {
    state.user = user;
  },
  [RoomMutations.UPDATE_USER_NAME](state, userName) {
    state.user.name = userName;
  },
  [RoomMutations.UPDATE_PARTICIPANTS](state, participants) {
    state.participants = participants;
    participants
      .filter((participant) => participant.muted)
      .forEach((participant) => state.mutedParticipants.add(participant.id));
  },
  [RoomMutations.UPDATE_PARTICIPANT](state, participant) {
    const index = state.participants.findIndex(
      (other) => other.id === participant.id,
    );
    if (index !== -1) {
      state.participants[index] = participant;
      if (participant.muted) {
        state.mutedParticipants.add(participant.id);
      } else {
        state.mutedParticipants.delete(participant.id);
      }
    }
  },
  [RoomMutations.UPDATE_RECORD_MODE](state, mode) {
    state.mode = mode;
  },
  [RoomMutations.UPDATE_MAX_DURATION_TACTON](state, maxDuration) {
    state.maxDuration = maxDuration;
  },
  [RoomMutations.SET_AVAILABLE_ROOMS](state, rooms) {
    state.availableRooms = rooms;
  },
  [RoomMutations.SET_AVAILABLE_CUSTOM_TAGS](state, tags) {
    state.availableCustomTags = tags;
  },
  [RoomMutations.SET_AVAILABLE_BODY_TAGS](state, tags) {
    state.availableBodyTags = tags;
  },
  [RoomMutations.SET_AVAILABLE_PROMPT_TAGS](state, tags) {
    state.availablePromptTags = tags;
  },
  [RoomMutations.UPDATE_EDITING_USER](state, userId) {
    state.currentlyEditingUserId = userId;
  },
  [RoomMutations.CLEAR_ROOM_DATA](state) {
    state.id = undefined;
    state.recordingNamePrefix = "";
    state.roomName = "";
  },
};

/**
 * actions
 *
 */
export enum RoomSettingsActionTypes {
  enterRoom = "enterRoom",
  updateRoom = "updateRoom",
  setAvailableRoomList = "setAvailableRoomList",
  muteParticipant = "muteParticipant",
  unmuteParticipant = "unmuteParticipant",
  updateParticipantList = "updateParticipantList",
  updateEditingUserId = "updateEditingUserId",
  clearRoomData = "clearRoomData",
}

type AugmentedActionContext = {
  commit<K extends keyof Mutations>(
    key: K,
    payload: Parameters<Mutations[K]>[1],
  ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, "commit">;

export interface Actions {
  [RoomSettingsActionTypes.enterRoom](
    { commit }: AugmentedActionContext,
    payload: { room: Room; userId: string; participants: User[] },
  ): void;
  [RoomSettingsActionTypes.updateRoom](
    { commit }: AugmentedActionContext,
    payload: { room: Room; participants: User[] },
  ): void;
  [RoomSettingsActionTypes.setAvailableRoomList](
    { commit }: AugmentedActionContext,
    payload: { rooms: Room[] },
  ): void;
  [RoomSettingsActionTypes.muteParticipant](
    { commit }: AugmentedActionContext,
    payload: { participant: User },
  ): void;
  [RoomSettingsActionTypes.unmuteParticipant](
    { commit }: AugmentedActionContext,
    payload: { participant: User },
  ): void;
  [RoomSettingsActionTypes.updateParticipantList](
    { commit }: AugmentedActionContext,
    payload: { participants: User[] },
  ): void;
  [RoomSettingsActionTypes.updateEditingUserId](
    { commit }: AugmentedActionContext,
    payload: { userId: string | null },
  ): void;
  [RoomSettingsActionTypes.clearRoomData]({
    commit,
  }: AugmentedActionContext): void;
}

export const actions: ActionTree<State, RootState> & Actions = {
  [RoomSettingsActionTypes.enterRoom](
    { commit },
    props: { room: Room; userId: string; participants: User[] },
  ) {
    const user = props.participants.find(
      (participant) => participant.id == props.userId,
    );

    if (user !== undefined) commit(RoomMutations.UPDATE_USER, { ...user });

    commit(RoomMutations.CHANGE_ROOM, {
      roomState: RoomState.Enter,
      roomInfo: {
        id: props.room.id,
        name: props.room.name,
        description: props.room.description,
        participants: props.participants,
        maxDurationRecord: props.room.maxDurationRecord,
        recordingNamePrefix: props.room.recordingNamePrefix,
        mode: props.room.mode,
        currentRecordingTime: 0,
        currentlyEditingUser: null,
      },
    });

    commit(RoomMutations.UPDATE_PARTICIPANTS, props.participants);
  },
  [RoomSettingsActionTypes.updateRoom](
    { commit },
    props: { room: Room; participants: User[] },
  ) {
    console.log(props.room);
    commit(RoomMutations.CHANGE_ROOM, {
      roomState: RoomState.Enter,
      roomInfo: {
        id: props.room.id,
        name: props.room.name,
        description: props.room.description,
        participants: props.participants,
        // isRecording: props.room.isRecording,
        maxDurationRecord: props.room.maxDurationRecord,
        recordingNamePrefix: props.room.recordingNamePrefix,
        mode: props.room.mode,
        currentRecordingTime: 0,
        currentlyEditingUser: null,
      },
    });
    commit(RoomMutations.UPDATE_PARTICIPANTS, props.participants);
  },
  [RoomSettingsActionTypes.setAvailableRoomList](
    { commit },
    props: { rooms: Room[] },
  ) {
    commit(RoomMutations.SET_AVAILABLE_ROOMS, props.rooms);
  },
  [RoomSettingsActionTypes.muteParticipant](
    { commit },
    props: { participant: User },
  ) {
    const store = useStore();
    const outputChannel = store.state.tactonSettings.outputChannelState;
    const channelsToDisable: number[] = [];
    outputChannel.forEach(({ channelId, intensity, author }) => {
      if (author?.id === props.participant.id && intensity > 0) {
        channelsToDisable.push(channelId);
      }
    });
    // debugger;
    //TODO Change to websoecket API
    window.api.send(IPC_CHANNELS.bluetooth.main.writeAmplitudeBuffer, [
      {
        channelIds: channelsToDisable,
        intensity: 0,
        author: toRaw(props.participant),
      },
    ]);

    commit(RoomMutations.UPDATE_PARTICIPANT, {
      ...props.participant,
      muted: true,
    });
  },
  [RoomSettingsActionTypes.unmuteParticipant](
    { commit },
    props: { participant: User },
  ) {
    commit(RoomMutations.UPDATE_PARTICIPANT, {
      ...props.participant,
      muted: false,
    });
  },
  [RoomSettingsActionTypes.updateParticipantList](
    { commit },
    props: { participants: User[] },
  ) {
    commit(RoomMutations.UPDATE_PARTICIPANTS, props.participants);
  },
  [RoomSettingsActionTypes.updateEditingUserId](
    { commit },
    props: { userId: string | null },
  ) {
    commit(RoomMutations.UPDATE_EDITING_USER, props.userId);
  },
  [RoomSettingsActionTypes.clearRoomData]({ commit }: AugmentedActionContext) {
    commit(RoomMutations.CLEAR_ROOM_DATA, undefined);
  },
};

/**
 * Getters
 */
export type Getters = {
  roomTitle(state: State): string;
  userNameUpdated(state: State): boolean;
  userNameFromServer(state: State): User;
  canEditTacton(state: State): boolean;
};

export const getters: GetterTree<State, RootState> & Getters = {
  roomTitle: (state) => state.roomName + "#" + state.id,
  userNameUpdated: (state) => {
    const serverItem = state.participants.find(
      (participant) => participant.id == state.user.id,
    );
    if (serverItem == undefined) return false;

    return serverItem.name !== state.user.name;
  },
  userNameFromServer: (state) => {
    const serverItem = state.participants.find(
      (participant) => participant.id == state.user.id,
    );
    if (serverItem == undefined) return state.user;

    return serverItem;
  },
  canEditTacton: (state) => {
    return (
      state.currentlyEditingUserId == null ||
      state.currentlyEditingUserId == state.user.id
    );
  },
};
