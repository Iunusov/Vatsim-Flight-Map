var webpack = require('webpack');
var path = require('path');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

module.exports = {
	entry : {
		app : ['./prod.js', './js/main.js', 'jquery', 'underscore', 'jquery-ui/ui/widgets/autocomplete', 'bootstrap/dist/css/bootstrap.css', 'jquery-ui/themes/base/core.css', 'jquery-ui/themes/base/menu.css', 'jquery-ui/themes/base/theme.css', 'jquery-ui/themes/base/autocomplete.css'],
	},
	output : {
		path : path.resolve(__dirname, 'dist'),
		filename : '[name]_[chunkhash].js',
		publicPath : '/dist'
	},
	optimization : {
		splitChunks : {
			cacheGroups : {
				commons : {
					test : /[\\/]node_modules[\\/]/,
					name : "vendor",
					chunks : "all"
				}
			}
		}
	},
	module : {
		rules : [{
				test : /\.css$/,
				loaders : ["style-loader", "css-loader"]
			}, {
				test : /\.(png)$/i,
				loader : 'url-loader?limit=100000'
			},
			{
				test: /\.html$/,
				use: [ {loader: 'html-loader',}],
			}]
	},
	plugins : [new webpack.ProvidePlugin({
			$ : "jquery",
			jQuery : "jquery",
			"window.jQuery" : "jquery'",
			"window.$" : "jquery",
			Popper : ['popper.js', 'default']
		}), new HtmlWebpackPlugin({
			template : './tpl/index.html',
			filename : '../index.html',
			inject : 'body',
		}), new ScriptExtHtmlWebpackPlugin({
			defaultAttribute : 'defer'
		})],
};
