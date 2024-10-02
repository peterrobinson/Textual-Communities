var _ = require('lodash')
  , webpack = require('webpack')
  , ResolverPlugin = webpack.ResolverPlugin
  , ProvidePlugin = webpack.ProvidePlugin
  , IgnorePlugin = webpack.IgnorePlugin
//  , ExtractTextPlugin = require("extract-text-webpack-plugin")
  , path = require('path')
  , clientRoot = path.resolve(__dirname)
  , bowerRoot = path.resolve(clientRoot, '..', 'bower_components')
  , nodeRoot = path.resolve(clientRoot, '..', 'node_modules')
  , devtool = 'eval-source-map'
  , debug = true
  , MiniCssExtractPlugin = require("mini-css-extract-plugin")
;

switch (process.env.NODE_ENV) {
  case 'production':
    devtool = '#source-map';
    debug = false;
    break;
  case 'development':
   	devtool = 'eval-source-map';
	debug = true;
    break;
}

var config = {
  context: clientRoot,
  mode: "development",
  entry: {
    app: path.join(clientRoot, 'app/boot.js'),
    vendor: path.join(clientRoot, 'app/app.component.js'),
//	t: path.join(clientRoot, 'app/t.js'),  
  },
  output: {
    path: path.join(clientRoot, 'dist'),
    filename: '[name].bundle.js',
    devtoolModuleFilenameTemplate(info) {
     return `file:///${info.absoluteResourcePath.replace(/\\/g, '/')}`;
   },
  },
  externals: {
    jquery: 'jQuery',
    rxjs: 'Rx',
    lodash: '_',
    bson: 'bson',
    'codemirror/lib/codemirror': 'CodeMirror',
    'codemirror/mode/xml/xml': false,
  },
  module: {
    rules: [
      {
        test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=image/jpg&prefix=dist/"
      }, {
        test: /\.jpg(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=image/jpg&prefix=dist/"
      }, {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=application/font-woff&prefix=dist/"
      }, {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=application/font-woff&prefix=dist/"
      }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=application/octet-stream&prefix=dist/"
      }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=application/vnd.ms-fontobject&prefix=dist/"
      }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: "url?limit=1000&minetype=image/svg+xml&prefix=dist/"
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
    	test: /\.less$/,
		use: [
		  "style-loader",
		  "css-loader",
		  {
			loader: "less-loader",
			options: {
			  lessOptions: {
	//			javascriptEnabled: true,
			  },
			}, 
		  },
		],
	  },
    ], /*,
    noParse: [
    ] */
  },
  resolve: {
 /*   root: [clientRoot], */
    modules: [clientRoot, 'web_modules', 'node_modules', 'bower_components', ],
    fallback: {
		"fs": false,
		"tls": false,
		"net": false,
		"path": false,
		"zlib": false,
		"http": false,
		"https": false,
		"stream": false,
		"crypto": false,
		"crypto-browserify": false, //if you want to use this module also don't forget npm i crypto-browserify 
	  },
    alias: {
      bower: bowerRoot,
      node: nodeRoot,
    },
  },
  plugins: [
/*    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor', filename: 'vendor.bundle.js',
      chunks: ['app'],
      minChunks: function(module, count) {
        return module.resource && module.resource.indexOf(clientRoot) === -1;
      }
      }), */
     new MiniCssExtractPlugin(), 
  ],
  devtool: devtool,
};

var compiler = webpack(config);

if (process.env.NODE_ENV === 'development') {
  compiler.watch({
    aggregateTimeout: 300,
    poll: 1000,
  }, handleError);
} else {
 compiler.watch({
    aggregateTimeout: 300,
    poll: 1000,
  }, handleError);
  //compiler.run(handleError);
}

function handleError(err, stats) {
  console.log(stats.toString({
    colors: true,
    cached: false,
  }));
}

//this should replace ExtractTextPlugin
