import SetupRoomView from "@/renderer/views/SetupRoomView.vue";
import CollaborationView from "@/renderer/views/CollaborationView.vue";
import FunnelingView from "@/renderer/views/FunnelingView.vue";
import SitemapView from "@/renderer/views/SitemapView.vue";
import AtmView from "@/renderer/views/AtmView.vue";
import EntranceControlView from "@/renderer/views/EntranceControlView.vue";
import SaltationView from "@/renderer/views/SaltationView.vue";
import DeviceDialog from "@/renderer/components/DeviceConnection.vue";
import ChannelParameterView from "@/renderer/views/ChannelParameterView.vue";
import { RouteRecordRaw } from "vue-router";
import { RouterNames } from "@/renderer/router/Routernames";

/**
 * set the paths for the single components in the views folder
 * / default path
 */
export const routes: Array<RouteRecordRaw> = [
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
    path: "/",
    name: RouterNames.DEVICES,
    component: DeviceDialog,
  },
  {
    path: "/funneling",
    name: RouterNames.FUNNELING,
    component: FunnelingView,
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
    component: SetupRoomView,
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
    path: "/playGround",
    name: RouterNames.PLAY_GROUND,
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: CollaborationView,
  },
];

export default routes;
