import {
    Store as VuexStore,
    CommitOptions,
    DispatchOptions,
    Module,
} from 'vuex';

import { State as RootState } from '../../store';
import { actions } from './actions';
import { Mutations, mutations } from './mutations';
import { Actions } from "./actionTypes"
import { State, state } from './state';
import { Getters, getters } from './getters';

export type Store<S = State> = Omit<VuexStore<S>, 'getters' | 'commit' | 'dispatch'>
    & {
        commit<K extends keyof Mutations, P extends Parameters<Mutations[K]>[1]>(
            key: K,
            payload: P,
            options?: CommitOptions
        ): ReturnType<Mutations[K]>;
    } & {
        dispatch<K extends keyof Actions>(
            key: K,
            payload: Parameters<Actions[K]>[1],
            options?: DispatchOptions
        ): ReturnType<Actions[K]>;
    } & {
        getters: {
            [K in keyof Getters]: ReturnType<Getters[K]>
        };
    };

export const DirectInputModule: Module<State, RootState> = {
    state,
    getters,
    mutations,
    actions,
    // TODO: With namespaced option turned on, having problem how to use dispatch with action types...
    // But without it, a bigger store might have clashes in namings
    // namespaced: true,
};
