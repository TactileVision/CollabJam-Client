import { createRouter, createWebHashHistory, Router } from "vue-router";
import routes from "./routes";
import PlayGroundView from "../../feature/collabJamming/views/PlayGroundView.vue";
import ChannelParameterView from "@/feature/channelParameter/views/ChannelParameterView.vue";
import SitemapView from "@/app/SitemapView.vue";
import DeviceDialog from "@/core/Ble/renderer/views/DeviceDialog.vue";
import SetupView from "../../feature/collabJamming/views/SetupView.vue";
import EntranceControlView from "@/feature/entranceControl/views/EntranceControlView.vue";
import FunnelingView from "@/feature/funnellingIllusion/views/FunnelingView.vue";
import RoomView from "../../feature/collabJamming/views/RoomView.vue";
import SaltationView from "@/feature/saltation/views/SaltationView.vue";
import AtmView from "@/feature/atm/views/AtmView.vue";
import { RouterNames } from "@/app/router/Routernames";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: RouterNames.DEVICES,
      component: DeviceDialog,
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
      component: SetupView,
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
      component: RoomView,
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
      component: PlayGroundView,
    },
  ],
});
