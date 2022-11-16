'use strict'
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const resolveFrom = require('resolve-from')
const reactScriptsConfig = require('react-scripts/config/webpack.config')

function resolvePackage(benchmarkPath, packageName) {
  // Try resolving the package relative to the benchmark file and
  // fallback to the react-benchmark's node_modules
  return (
    resolveFrom.silent(benchmarkPath, `${packageName}/package.json`) ||
    require.resolve(`${packageName}/package.json`)
  ).replace(/package\.json$/, '') // Get package's directory rather than it's filepath so webpack can do it's magic
}

exports.compile = async (outputPath, benchmarkPath, debug) => {
  const rules = reactScriptsConfig('production').module.rules

  const rulesWithOneOf = rules.find((rules) => rules.oneOf != null)
  // Remove the includes restriction
  rulesWithOneOf.oneOf.find(
    (rule) => rule.include != null && rule.options.babelrc === false
  ).include = undefined

  rulesWithOneOf.oneOf = rulesWithOneOf.oneOf.filter((rule) => {
    if (typeof rule.use?.[0]?.loader?.contains === 'function') {
      return rule.use[0].loader.contains('css') === false
    }
    return true
  })

  return new Promise((resolve, reject) => {
    /** @type {import('webpack').Configuration} */
    const config = {
      mode: debug ? 'development' : 'production',
      context: __dirname,
      amd: false,
      resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
          'react-benchmark-test-component': benchmarkPath,
          // Prevent duplicate react's from being bundled
          react: resolvePackage(benchmarkPath, 'react'),
          'react-dom': resolvePackage(benchmarkPath, 'react-dom'),
        },
      },
      entry: {
        bundle: path.join(__dirname, 'client.js'),
      },
      output: {
        path: outputPath,
      },
      plugins: [new HtmlWebpackPlugin(), new MiniCssExtractPlugin()],
      performance: {
        hints: false,
      },
      module: {
        noParse: [/node_modules\/benchmark\//], // Parsing benchmark causes it to break
        rules: [
          {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
          },
          ...rules,
        ],
      },
    }

    webpack(config, (err, stats) => {
      if (err || stats.hasErrors()) {
        return reject(err || stats.toJson().errors[0])
      }

      resolve()
    })
  })
}
