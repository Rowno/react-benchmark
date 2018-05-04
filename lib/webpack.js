'use strict'
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

exports.compile = (outputPath, benchmarkPath, debug) => {
  return new Promise((resolve, reject) => {
    const config = {
      mode: debug ? 'development' : 'production',
      context: __dirname,
      resolve: {
        alias: {
          'react-benchmark-test-component': benchmarkPath,
          // Prevent duplicate react's from being bundled
          // TODO: alias the user's react module
          react: require.resolve('react'),
          'react-dom': require.resolve('react-dom')
        }
      },
      entry: {
        bundle: path.join(__dirname, 'client.js')
      },
      output: {
        path: outputPath,
        filename: '[name].js'
      },
      plugins: [new HtmlWebpackPlugin()],
      performance: {
        hints: false
      },
      module: {
        noParse: [/node_modules\/benchmark\//], // Parsing benchmark causes it to break
        rules: [
          {
            test: /\.js$/,
            exclude: path =>
              path.includes('node_modules') &&
              !path.includes('/react-benchmark/lib/'), // Don't exclude ourselves 😆
            loader: 'babel-loader'
          }
        ]
      }
    }

    if (debug) {
      // Load existing source maps (from node_modules etc)
      config.module.rules.push({
        test: /\.js$/,
        loader: 'source-map-loader',
        enforce: 'pre'
      })
      // Hack to fix webpack not loading the babel source maps for the
      // react-benchmark-test-component for some reason ¯\_(ツ)_/¯
      config.module.rules.push({
        test: /\.js$/,
        loader: 'source-map-loader',
        enforce: 'post'
      })
      config.devtool = 'cheap-module-inline-source-map'
    }

    webpack(config, (err, stats) => {
      const info = stats.toJson()

      if (err || stats.hasErrors()) {
        return reject(err || info.errors[0])
      }

      resolve()
    })
  })
}
