import { MutationTree, GetterTree, ActionTree, ActionContext } from "vuex";
import { RootState } from "@/renderer/store/store";
import { InteractionMode, User, Room } from "@sharedTypes/roomTypes";
import { useRoute, useRouter } from "vue-router";
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
  user: User;
  // isRecording: boolean,
  maxDuration: number;
  mode: InteractionMode;
  recordingNamePrefix: string;

  availableRooms: Room[];
};

export const state: State = {
  roomState: RoomState.Create,
  id: undefined,
  roomName: "",
  description: "",
  participants: [],
  user: { id: "", name: "", color: "" },
  // isRecording: false,
  maxDuration: 20000,
  mode: InteractionMode.Jamming,
  recordingNamePrefix: "",
  availableRooms: [],
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
  UPDATE_RECORD_MODE = "UPDATE_RECORD_MODE",
  UPDATE_MAX_DURATION_TACTON = "UPDATE_MAX_DURATION_TACTON",
  SET_AVAILABLE_ROOMS = "SET_AVAILABLE_ROOMS",
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
  [RoomMutations.UPDATE_RECORD_MODE](state: S, mode: InteractionMode): void;
  [RoomMutations.UPDATE_MAX_DURATION_TACTON](
    state: S,
    maxDuration: number,
  ): void;
  [RoomMutations.SET_AVAILABLE_ROOMS](state: S, rooms: Room[]): void;
};

export const mutations: MutationTree<State> & Mutations = {
  [RoomMutations.CHANGE_ROOM](state, props) {
    state.roomState = props.roomState;
    state.id = props.roomInfo.id;
    state.roomName = props.roomInfo.name;
    state.description = props.roomInfo.description;
    state.participants = props.roomInfo.participants;
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
};

/**
 * actions
 *
 */
export enum RoomSettingsActionTypes {
  enterRoom = "enterRoom",
  updateRoom = "updateRoom",
  setAvailableRoomList = "setAvailableRoomList",
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
}

export const actions: ActionTree<State, RootState> & Actions = {
  [RoomSettingsActionTypes.enterRoom](
    { commit },
    props: { room: Room; userId: string; participants: User[] },
  ) {
    const user = props.participants.find(
      (participant) => participant.id == props.userId,
    );

    if (user !== undefined)
      commit(RoomMutations.UPDATE_USER, {
        id: user.id,
        name: user.name,
        color: user.color,
      });

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
};

/**
 * Getters
 */
export type Getters = {
  roomTitle(state: State): string;
  userNameUpdated(state: State): boolean;
  userNameFromServer(state: State): User;
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
};
