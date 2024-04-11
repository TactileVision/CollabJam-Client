<template>
  <!-- <v-navigation-drawer expand-on-hover rail> -->
  <v-navigation-drawer>
    <v-list
      :disabled="store.state.generalSettings.currentView == routes.PLAY_GROUND"
    >
      <v-list-subheader>Jamming</v-list-subheader>
      <v-list-item
        @click="go(routes.ROOM)"
        link
        title="CollabJam"
      ></v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Illusions</v-list-subheader>
      <v-list-item
        @click="go(routes.FUNNELING)"
        link
        title="Funneling Illusion"
      ></v-list-item>
      <v-list-item
        @click="go(routes.ATM)"
        link
        title="Apparent Tactile Motion"
      ></v-list-item>
      <v-list-item
        @click="go(routes.SALTATION)"
        link
        title="Saltation"
      ></v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Use Case Demos</v-list-subheader>
      <v-list-item
        @click="go(routes.DOOR)"
        link
        title="Door entrance signal"
      ></v-list-item>
      <v-divider></v-divider>

      <v-list-subheader>Device Settings</v-list-subheader>
      <v-list-item
        @click="go(routes.DEVICES)"
        title="Tactile Display List"
      ></v-list-item>
      <v-list-item
        @click="go(routes.CHANNEL_PARAMETER)"
        link
        title="Test Channel Parameter"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { routes } from "@/app/router/routes";
import { router } from "@/app/router";
import { RouterNames } from "@/app/router/Routernames";
import { useStore } from "vuex";
export default defineComponent({
  name: "Sidebar",
  data() {
    return {
      store: useStore(),
      routeEntries: routes,
      routes: RouterNames,
    };
  },
  methods: {
    go(route: RouterNames) {
      const r = this.routeEntries.find((e) => e.name == route);
      if (r == null) return;
      router.push(r.path);
    },
  },
});
</script>
