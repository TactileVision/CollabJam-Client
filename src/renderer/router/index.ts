import { createRouter, createWebHashHistory } from "vue-router";
import CollaborationView from "@/renderer/views/CollaborationView.vue";
import ChannelParameterView from "@/renderer/views/ChannelParameterView.vue";
import SitemapView from "@/renderer/views/SitemapView.vue";
import DeviceConnection from "@/renderer/components/DeviceConnection.vue";
import SetupRoomView from "@/renderer/views/SetupRoomView.vue";
import EntranceControlView from "@/renderer/views/EntranceControlView.vue";
import FunnelingView from "@/renderer/views/FunnelingView.vue";
import SaltationView from "@/renderer/views/SaltationView.vue";
import AtmView from "@/renderer/views/AtmView.vue";
import { RouterNames } from "@/renderer/router/Routernames";
import ListRoomsView from "../views/ListRoomsView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: RouterNames.DEVICES,
      component: DeviceConnection,
    },
    {
      path: "/sitemap",
      name: RouterNames.SITEMAP,
      component: SitemapView,
    },
    {
      path: "/channels",
      name: RouterNames.CHANNEL_PARAMETER,
      component: ChannelParameterView,
    },
    {
      path: "/door",
      name: RouterNames.DOOR,
      component: EntranceControlView,
    },
    {
      path: "/setup",
      name: RouterNames.SETUP,
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: SetupRoomView,
    },
    {
      path: "/atm",
      name: RouterNames.ATM,
      component: AtmView,
    },
    {
      path: "/saltation",
      name: RouterNames.SALTATION,
      component: SaltationView,
    },
    {
      path: "/rooms",
      name: RouterNames.ROOM,
      component: ListRoomsView,
    },
    {
      path: "/funneling",
      name: RouterNames.FUNNELING,
      component: FunnelingView,
    },
    {
      path: "/playGround",
      name: RouterNames.PLAY_GROUND,
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: CollaborationView,
    },
  ],
});
