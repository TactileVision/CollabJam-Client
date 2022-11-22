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
  }
}
