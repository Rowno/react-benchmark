'use strict'
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

exports.compile = (outputPath, benchmarkPath, debug) => {
  return new Promise((resolve, reject) => {
    const plugins = [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(debug ? 'development' : 'production'),
        },
      }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new HtmlWebpackPlugin(),
    ]

    if (!debug) {
      plugins.push(new webpack.optimize.UglifyJsPlugin({sourceMap: true}))
    }

    webpack(
      {
        devtool: 'source-map',
        context: __dirname,
        resolve: {
          alias: {
            'react-benchmark-test-component': benchmarkPath,
            // Prevent duplicate react's from being bundled
            // TODO: alias the user's react module
            react: require.resolve('react'),
            'react-dom': require.resolve('react-dom'),
          },
        },
        entry: {
          bundle: path.join(__dirname, 'client.js'),
        },
        output: {
          path: outputPath,
          filename: '[name].js',
        },
        plugins,
        module: {
          noParse: [/node_modules\/benchmark\//], // Parsing benchmark causes it to break
          rules: [
            {
              test: /\.js$/,
              exclude: path =>
                path.includes('node_modules') &&
                !path.includes('/react-benchmark/lib/'), // Don't exclude ourselves 😆
              loader: 'babel-loader',
            },
          ],
        },
      },
      (err, stats) => {
        const info = stats.toJson()

        if (stats.hasWarnings()) {
          console.warn(info.warnings)
        }

        if (err || stats.hasErrors()) {
          return reject(err || info.errors[0])
        }

        resolve()
      }
    )
  })
}
