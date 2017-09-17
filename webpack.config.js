var path = require('path');
var nodeExternals = require('webpack-node-externals');

var libraryName = 'ngx-translate-parser-plural-select';
var outputFile = libraryName + '.js';


var config = {
	entry: [
		path.join(__dirname, 'index')
	],
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, '/dist'),
		filename: outputFile,
		library: libraryName,
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		loaders: [
			{ test: /\.ts$/, loader: 'ts-loader', exclude: [/node_modules/, /dist/, /tests/] }
		]
	},
	resolve: {
		extensions: ['.ts', '!.spec.ts']
	},
	externals: [nodeExternals()]
};

module.exports = config;
