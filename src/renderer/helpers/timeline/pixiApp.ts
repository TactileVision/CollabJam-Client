import { Application, Container, Graphics } from "pixi.js";
import { Store, useStore } from "@/renderer/store/store";
import { TimelineActionTypes } from "@/renderer/store/modules/timeline/actions";
import "pixi.js/unsafe-eval";
import config from "@/renderer/helpers/timeline/config";

let pixiApp: Application;
let dynamicContainer: Container;
let staticContainer: Container;
let liveContainer: Container;
let lockContainer: Container;
let resizeObserver: ResizeObserver;
let line: Graphics;

/**
 * Initialises the Pixi-Canvas
 */
export async function createPixiApp(): Promise<void> {
  pixiApp = new Application();
  dynamicContainer = new Container();
  staticContainer = new Container();
  liveContainer = new Container();
  lockContainer = new Container();
  line = new Graphics();

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
    window.innerHeight - wrapper.getBoundingClientRect().top;

  // create canvas
  pixiApp.renderer.resize(wrapper.clientWidth, height);
  pixiApp.canvas.style.position = "absolute";
  pixiApp.canvas.style.right = "0";
  pixiApp.canvas.style.top = "0";

  // add canvas to wrapper
  wrapper.appendChild(pixiApp.canvas);

  // setup line
  line.moveTo(0, config.sliderHeight);
  line.lineTo(0, height);
  line.stroke({ width: 2, color: "rgba(255,147,58,1)" });
  line._zIndex = 0;
  line.visible = false;

  // add elements to canvas
  staticContainer.addChild(line);

  // setup backdrop
  // TODO load trackCount dynamically
  const backdrop: Graphics = new Graphics();
  backdrop.rect(
    0,
    config.sliderHeight + config.componentPadding,
    config.leftPadding,
    config.trackHeight * 4,
  );
  backdrop.fill("#ffffff");

  pixiApp.stage.addChild(dynamicContainer);
  pixiApp.stage.addChild(backdrop);
  pixiApp.stage.addChild(staticContainer);
  pixiApp.stage.addChild(liveContainer);
  pixiApp.stage.addChild(lockContainer);
  // TODO if only the height is changed, this observer will not fire, as the wrapper_element hast zero height

  const resizeCallback = (): void => {
    if (pixiApp == undefined) return;
    if (pixiApp.renderer.width === wrapper.clientWidth) return;

    const boundingRect: DOMRect = wrapper.getBoundingClientRect();
    store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET, boundingRect.x);
    store.dispatch(
      TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET,
      boundingRect.top,
    );
    store.dispatch(
      TimelineActionTypes.UPDATE_CANVAS_WIDTH,
      wrapper.clientWidth,
    );

    const newWidth: number = wrapper.clientWidth;
    const currentWidth: number = pixiApp.renderer.width;

    if (currentWidth !== newWidth) {
      animateResize(currentWidth, newWidth, height, 250);
    }
  };

  resizeObserver = new ResizeObserver(debounce(resizeCallback, 200));
  resizeObserver.observe(wrapper);

  const boundingRect: DOMRect = wrapper.getBoundingClientRect();
  store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_X_OFFSET, boundingRect.x);
  store.dispatch(TimelineActionTypes.UPDATE_WRAPPER_Y_OFFSET, boundingRect.top);
  store.dispatch(TimelineActionTypes.UPDATE_CANVAS_WIDTH, wrapper.clientWidth);
}

function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delayMs);
  };
}

/*
 * Interpolates between two widths.
 * Currently height is fixed anyway.
 * */
function animateResize(
  from: number,
  to: number,
  height: number,
  duration: number,
) {
  const start = performance.now();

  function frame(now: number) {
    const progress = Math.min((now - start) / duration, 1);

    // Ease-Out
    const eased = 1 - Math.pow(1 - progress, 3);

    const currentWidth = from + (to - from) * eased;

    pixiApp.renderer.resize(currentWidth, height);
    pixiApp.render();

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
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
export function getLockContainer(): Container {
  return lockContainer;
}
export function getLine(): Graphics {
  return line;
}
