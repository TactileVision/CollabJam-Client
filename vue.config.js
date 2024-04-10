
const path = require('path');

module.exports = {
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      customFileProtocol: "./",
      preload: 'src/preload.js',
      builderOptions: {
        productName: 'Collaborative Tacton Generator',
      },


    },
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  },
  pages: {
    index: {
      // entry for the page
      entry: 'src/background.js',
      title: 'Collaborative Tacton Generator',
    },
  },
  configureWebpack: {
    // target: 'electron-main',
    resolve: {
      fallback: {
        path: require.resolve("path-browserify")
      },
      alias: {
        "@sharedTypes": path.resolve(__dirname, 'src/shared/types/'),
        "@/*": path.resolve(__dirname, "src/*")

      },
      extensions: ["", ".ts", ".tsx", ".js"]
    },
  }
}