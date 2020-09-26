'use strict'
const path = require('path')
const os = require('os')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const resolveFrom = require('resolve-from')
const pkgDir = require('pkg-dir')

function resolvePackage(benchmarkPath, packageName) {
  // Try resolving the package relative to the benchmark file and
  // fallback to the react-benchmark's node_modules
  return (
    resolveFrom.silent(benchmarkPath, `${packageName}/package.json`) ||
    require.resolve(`${packageName}/package.json`)
  ).replace(/package\.json$/, '') // Get package's directory rather than it's filepath so webpack can do it's magic
}

async function resolveProjectRoot(benchmarkPath) {
  // Try resolving the project root from the benchmark file and fallback to the
  // user's home directory
  const projectRoot = await pkgDir(path.dirname(benchmarkPath))
  return projectRoot || os.homedir()
}

exports.compile = async (outputPath, benchmarkPath, debug) => {
  // Guess the project root directory so that babel can resolve it's config correctly
  const projectRoot = await resolveProjectRoot(benchmarkPath)

  const babelLoader = {
    loader: 'babel-loader',
    options: {
      cwd: projectRoot,
    },
  }

  return new Promise((resolve, reject) => {
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
        filename: '[name].js',
      },
      plugins: [new HtmlWebpackPlugin()],
      performance: {
        hints: false,
      },
      module: {
        noParse: [/node_modules\/benchmark\//], // Parsing benchmark causes it to break
        rules: [
          {
            test: /\.jsx?$/,
            exclude: (path) =>
              path.includes('node_modules') &&
              !path.includes('/react-benchmark/lib/'), // Don't exclude ourselves 😆
            use: [babelLoader],
          },
          {
            test: /\.tsx?$/,
            use: [
              babelLoader,
              {
                loader: 'ts-loader',
                options: {
                  compiler: resolvePackage(benchmarkPath, 'typescript'),
                  transpileOnly: true,
                  onlyCompileBundledFiles: true,
                  logLevel: 'error',
                },
              },
            ],
          },
        ],
      },
    }

    if (debug) {
      // Load existing source maps (from node_modules etc)
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        loader: 'source-map-loader',
        enforce: 'pre',
      })
      // Hack to fix webpack not loading the babel source maps for the
      // react-benchmark-test-component for some reason ¯\_(ツ)_/¯
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        loader: 'source-map-loader',
        enforce: 'post',
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
