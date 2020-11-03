var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
var exec = require('child_process').exec;
module.exports = {
    entry: {
        app: ['./prod.js', './js/main.js', 'jquery', 'underscore', 'jquery-ui/ui/widgets/autocomplete', 'bootstrap/dist/css/bootstrap.css', 'jquery-ui/themes/base/core.css', 'jquery-ui/themes/base/menu.css', 'jquery-ui/themes/base/theme.css', 'jquery-ui/themes/base/autocomplete.css', 'mapbox-gl/dist/mapbox-gl.css', 'details-polyfill'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]_[chunkhash].js',
        publicPath: '/dist'
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all"
                }
            }
        }
    },
    module: {
        rules: [{
                test: /\.css$/,
                use: [{
                        loader: "style-loader"
                    }, {
                        loader: "css-loader"
                    }
                ]
            }, {
                test: /\.(png)$/i,
                loader: 'url-loader'
            }, {
                test: /\.html$/,
                use: [{
                        loader: 'html-loader',
                    }
                ],
            }
        ]
    },
    plugins: [new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery'",
            "window.$": "jquery",
            Popper: ['popper.js', 'default']
        }), new HtmlWebpackPlugin({
            template: './tpl/index.html',
            filename: '../index.html',
            inject: 'body',
        }), new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer'
        }), {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                    exec('cd vatsim_parser; ./parse.php', (err, stdout, stderr) => {
                        if (stdout)
                            process.stdout.write(stdout);
                        if (stderr)
                            process.stderr.write(stderr);
                    });
                });
            }
        }
    ],
};
