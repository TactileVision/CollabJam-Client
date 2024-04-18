// vite.config.js
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import tsconfigPaths from "vite-tsconfig-paths";
import renderer from "vite-plugin-electron-renderer";
import eslintPlugin from "@nabla/vite-plugin-eslint";

import electron from "vite-plugin-electron/simple";
import { defineConfig } from "vite";
import pkg from "./package.json";
// import { build } from "vite-plugin-electron";
export default defineConfig(({ command }) => {
  const isServe = command === "serve";
  const isBuild = command === "build";
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    build: {
      rollupOptions: {},
    },
    plugins: [
      tsconfigPaths(),
      vue(),
      vuetify(),
      renderer(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          // entry: 'electron/main/index.ts',
          entry: "src/main/background.ts",
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App",
              );
            } else {
              startup();
            }
          },
          vite: {
            plugins: [tsconfigPaths()],
            resolve: {
              // alias: {
              //   "@": resolve(__dirname, "/src"),
              //   "@sharedTypes": resolve(__dirname, "./src/shared/types/*"),
              // },
            },
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist_electron",

              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons,
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          // input: 'electron/preload/index.ts',
          input: "src/preload/preload.js",
          vite: {
            build: {
              sourcemap: sourcemap ? "inline" : undefined, // #332
              minify: isBuild,
              outDir: "dist_electron/preload",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {},
                ),
              },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {},
      }),
      eslintPlugin(),
    ],
  };
});
