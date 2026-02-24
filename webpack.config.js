const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        main: './src/main.js',
        extensionPopupManager: './src/extensionPopupManager.js',
        background: './src/background.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', { targets: { chrome: '90', firefox: '90' } }],
                        ],
                    },
                },
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'index.html',
            chunks: ['extensionPopupManager'],
        }),
    ],
    resolve: {
        extensions: ['.js'],
    },
    optimization: {
        minimize: false,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                default: false,
                vendors: false,
            },
        },
        runtimeChunk: false,
    },
    devtool: 'source-map',
};
