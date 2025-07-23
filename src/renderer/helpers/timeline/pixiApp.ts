import { Application, Container, Graphics } from "pixi.js";
import { Store, useStore } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import "pixi.js/unsafe-eval";

let pixiApp: Application;
let dynamicContainer: Container;
let staticContainer: Container;
let liveContainer: Container;
let resizeObserver: ResizeObserver;
let overlay: Graphics;
let animationFrameId: number | null = null;

/**
 * Initialises the Pixi-Canvas
 */
export async function createPixiApp(): Promise<void> {
  pixiApp = new Application();
  dynamicContainer = new Container();
  staticContainer = new Container();
  liveContainer = new Container();
  overlay = new Graphics();

  // Init app
  await pixiApp.init({
    background: "#ffffff",
    antialias: true,
  });

  const store: Store = useStore();

  const wrapper: HTMLElement | null = document.getElementById("timelineCanvas");
  if (wrapper == null) {
    console.error("timeline-wrapper not found");
    return;
  }

  const height: number =
    window.innerHeight - wrapper.getBoundingClientRect().top - 50;

  // create canvas
  pixiApp.renderer.resize(wrapper.clientWidth, height);
  pixiApp.canvas.style.position = "absolute";
  pixiApp.canvas.style.right = "0";
  pixiApp.canvas.style.top = "0";

  // add canvas to wrapper
  wrapper.appendChild(pixiApp.canvas);

  // setup overlay-element
  overlay.rect(0, 0, wrapper.clientWidth, height);

  overlay.fill("rgba(0, 0, 0, 0.1)");
  overlay.interactive = false;
  overlay.visible = false;

  // add elements to canvas
  pixiApp.stage.addChild(staticContainer);
  pixiApp.stage.addChild(dynamicContainer);
  pixiApp.stage.addChild(liveContainer);
  pixiApp.stage.addChild(overlay);

  // TODO if only the height is changed, this observer will not fire, as the wrapper_element hast zero height
  resizeObserver = new ResizeObserver((): void => {
    if (pixiApp == undefined) return;
    if (pixiApp.renderer.width !== wrapper.clientWidth) {
      if (animationFrameId != null) return;

      animationFrameId = requestAnimationFrame(() => {
        const boundingRect: DOMRect = wrapper.getBoundingClientRect();
        store.dispatch(
          TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET,
          boundingRect.x,
        );
        store.dispatch(
          TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET,
          boundingRect.top,
        );
        store.dispatch(
          TimelineActionTypes.UPDATE_CANVAS_WIDTH,
          wrapper.clientWidth,
        );
        overlay.width = wrapper.clientWidth;
        pixiApp.renderer.resize(wrapper.clientWidth, height);
        pixiApp.render();
      });
      animationFrameId = null;
    }
  });
  resizeObserver.observe(wrapper);

  const boundingRect: DOMRect = wrapper.getBoundingClientRect();
  store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET, boundingRect.x);
  store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET, boundingRect.top);
  store.dispatch(TimelineActionTypes.UPDATE_CANVAS_WIDTH, wrapper.clientWidth);
}
export function clearPixiApp(): void {
  if (pixiApp == undefined) return;
  pixiApp.destroy({ removeView: true }, { children: true });
  resizeObserver.disconnect();
}
export function getPixiApp(): Application {
  return pixiApp;
}
export function getDynamicContainer(): Container {
  return dynamicContainer;
}
export function getStaticContainer(): Container {
  return staticContainer;
}
export function getLiveContainer(): Container {
  return liveContainer;
}
export function toggleOverlay(isVisible: boolean): void {
  overlay.visible = isVisible;
}
