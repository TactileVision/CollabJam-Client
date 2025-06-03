import { Container, Application } from "pixi.js";
import { Store, useStore } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import "pixi.js/unsafe-eval";
export const pixiApp: Application = new Application();
export const staticContainer: Container = new Container();
export const dynamicContainer: Container = new Container();

/**
 * Initialises the Pixi-Canvas
 */
export async function initPixiApp(): Promise<void> {
  const store: Store = useStore();
  // Init app
  await pixiApp.init({
    background: "#ffffff",
    antialias: true,
  });

  const wrapper: HTMLElement | null = document.getElementById("timelineCanvas");
  if (wrapper == null) {
    console.error("timeline-wrapper not found");
    return;
  }

  console.log(window.innerHeight);
  console.log(wrapper.getBoundingClientRect());
  const height = window.innerHeight - wrapper.getBoundingClientRect().top - 50;

  pixiApp.renderer.resize(wrapper.clientWidth, height);

  pixiApp.canvas.style.position = "absolute";
  pixiApp.canvas.style.right = "0";
  pixiApp.canvas.style.top = "0";

  wrapper.appendChild(pixiApp.canvas);

  pixiApp.stage.addChild(staticContainer);
  pixiApp.stage.addChild(dynamicContainer);

  observeWrapperResize((width: number): void => {
    if (pixiApp.renderer.width !== width) {
      const boundingRect: DOMRect = wrapper.getBoundingClientRect();
      store.dispatch(
        TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET,
        boundingRect.x,
      );
      store.dispatch(
        TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET,
        boundingRect.top,
      );
      pixiApp.renderer.resize(width, height);
      pixiApp.render();
    }
  }, wrapper);

  const boundingRect: DOMRect = wrapper.getBoundingClientRect();
  store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET, boundingRect.x);
  store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET, boundingRect.top);
}

/**
 * Installs a ResizeObserver on a given HTMLElement, to resize Pixi-Canvas accordingly
 * @param callback The callback-function that will be executed, when resizing occurs
 * @param wrapper HTMLElement, that will be watched. If not explicitly defined, the basic canvas wrapper ist observed.
 */
export function observeWrapperResize(
  callback: (width: number, height: number) => void,
  wrapper?: HTMLElement | null,
): void {
  if (wrapper == null) {
    wrapper = document.getElementById("timelineCanvas");
    if (!wrapper) {
      console.error("timeline-wrapper not found");
      return;
    }
  }

  const observer: ResizeObserver = new ResizeObserver((): void => {
    callback(wrapper.clientWidth, wrapper.clientHeight);
  });
  observer.observe(wrapper);
}

let resizeTimeout: number | undefined;
/**
 * Installs a ResizeObserver on the timeline-wrapper, to resize Pixi-Canvas accordingly
 * @param callback The callback-function that will be executed, when resizing occurs
 * @param delay The delay (in ms), used for debouncing
 */
export function debouncedObserveWrapperResize(
  callback: (width: number, height: number) => void,
  delay: number = 100,
): void {
  const wrapper: HTMLElement | null = document.getElementById("timelineCanvas");
  if (!wrapper) {
    console.error("timeline-wrapper not found");
    return;
  }

  const observer: ResizeObserver = new ResizeObserver((): void => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout((): void => {
      callback(wrapper.clientWidth, wrapper.clientHeight);
    }, delay);
  });
  observer.observe(wrapper);
}
