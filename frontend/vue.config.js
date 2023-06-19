const path = require('path');

module.exports = {
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      builderOptions: {
        productName: 'Collaborative Tacton Generator',
        extraResources: [
          {
            "from": "./src/protobuf/",
            "to": "extraResources",
            "filter": [
              "**/*"
            ]
          }],
      },


    },
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  },
  pages: {
    index: {
      // entry for the page
      entry: 'src/main.js',
      title: 'Collaborative Tacton Generator',
    },
  },
  configureWebpack: {
    resolve: {
      alias: {
        "@sharedTypes" : path.resolve(__dirname, '../shared/')
      },
      extensions: ["", ".ts", ".tsx", ".js"]
    },
  }
}
