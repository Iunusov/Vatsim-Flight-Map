var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
module.exports = {
	module : {
		loaders : [{
				test : /\.css$/,
				loader : 'style-loader!css-loader'
			}, {
				test : /\.png$/,
				loader : 'url-loader?limit=100000'
			}, {
				test : /\.jpg$/,
				loader : 'file-loader'
			}, {
				test : /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader : 'file-loader'
			}, {
				test : /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader : 'url-loader?limit=10000&mimetype=application/font-woff'
			}
		]
	},
	entry : {
		app : ['jquery', 'jquery-ui/ui/widgets/autocomplete', 'underscore', 'bootstrap', 'bootstrap/dist/css/bootstrap.css', 'jquery-ui/themes/base/autocomplete.css', 'jquery-ui/themes/base/core.css', 'jquery-ui/themes/base/menu.css', 'jquery-ui/themes/base/theme.css', './prod.js', './js/main.js']
	},
	output : {
		path : 'dist/',
		filename : '[name]_[chunkhash].js',
		publicPath : 'dist/'
	},
	plugins : [new webpack.ProvidePlugin({
			$ : 'jquery',
			jQuery : 'jquery',
			'window.jQuery' : 'jquery',
			'_' : 'underscore'
		}), new HtmlWebpackPlugin({
			template : './tpl/index.html',
			filename : '../index.html',
			inject : 'body',
		}), new ScriptExtHtmlWebpackPlugin({
			defaultAttribute : 'async'
		})],
};
