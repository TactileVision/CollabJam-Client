import RoomView from "../../feature/collabJamming/views/RoomView.vue";
import PlayGroundView from "../../feature/collabJamming/views/PlayGroundView.vue"
import SetupView from "../../feature/collabJamming/views/SetupView.vue"
import { RouteRecordRaw } from "vue-router";
import { RouterNames } from "@/app/router/Routernames";

/**
 * set the paths for the single components in the views folder
 * / default path
 */
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: RouterNames.ROOM,
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: RoomView,
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