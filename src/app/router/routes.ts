import RoomView from "../../feature/collabJamming/views/RoomView.vue";
import PlayGroundView from "../../feature/collabJamming/views/PlayGroundView.vue"
import SetupView from "../../feature/collabJamming/views/SetupView.vue"
import FunnelingView from "@/feature/funnellingIllusion/views/FunnelingView.vue"
import SitemapView from "@/app/SitemapView.vue"
import AtmView from "@/feature/atm/views/AtmView.vue"
import EntranceControlView from "@/feature/entranceControl/views/EntranceControlView.vue"
import SaltationView from "@/feature/saltation/views/SaltationView.vue"
import DeviceDialog from "@/core/Ble/views/components/DeviceSection.vue"
import ChannelParameterView from "@/feature/channelParameter/views/ChannelParameterView.vue"
import { RouteRecordRaw } from "vue-router";
import { RouterNames } from "@/app/router/Routernames";

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
    component: ChannelParameterView
  },
  {
    path: "/door",
    name: RouterNames.DOOR,
    component: EntranceControlView
  },
  {
    path: "/",
    name: RouterNames.DEVICES,
    component: DeviceDialog
  },
  {
    path: "/funneling",
    name: RouterNames.FUNNELING,
    component: FunnelingView
  },
  {
    path: "/atm",
    name: RouterNames.ATM,
    component: AtmView
  },
  {
    path: "/saltation",
    name: RouterNames.SALTATION,
    component: SaltationView
  },
  {
    path: "/rooms",
    name: RouterNames.ROOM,
    component: RoomView
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
    path: "/playGround",
    name: RouterNames.PLAY_GROUND,
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: PlayGroundView,
  },
]


export default routes