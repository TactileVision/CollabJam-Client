import { Store as VuexStore, CommitOptions, Module } from "vuex";

import { RootState } from "@/renderer/store/store";
import { state, State } from "./state";
import { mutations, Mutations } from "./mutations";

//build the store module
export type DisplayConfigStore<S = State> = Omit<VuexStore<S>, "commit"> & {
  commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
    key: K,
    payload: P,
    options?: CommitOptions,
  ): ReturnType<Mutations[K]>;
};

export const store: Module<State, RootState> = {
  state,
  mutations,
  // TODO: With namespaced option turned on, having problem how to use dispatch with action types...
  // But without it, a bigger store might have clashes in namings
  // namespaced: true,
};
