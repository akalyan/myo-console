var path = require('path');
var webpack = require('webpack');

module.exports = {
  resolve: {
    root: [path.join(__dirname, "app", "bower_components")],
    alias: {
      jquery: 'jquery/dist/jquery',
      datgui: 'dat-gui/build/dat.gui',
      bootstrap: 'bootstrap/dist/js/bootstrap',
      d3: 'd3/d3',
      ramda: 'ramda/ramda',
      react: 'react/react-with-addons',
      rx: 'rxjs/dist/rx.all',
      threejs: 'threejs/build/three',
      threejscontrols: 'threejs-controls/controls/OrbitControls'
    },
    extensions: [
      '',
      '.js', '.coffee',
      '.html', '.jade',
      '.css', '.styl', '.scss', '.less'
    ]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
    )
  ],
  entry: {
    playground: './app/scripts/playground.js',
    threed: './app/scripts/three-d.js'
  },
  output: {
    path: './app/build',
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.js$/, loader: "jsx-loader" },
      { test: /\.jsx$/, loader: "jsx-loader?insertPragma=React.DOM" }
    ]
  }
};
