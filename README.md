# react-benchmark

[![Build Status](https://travis-ci.org/Rowno/react-benchmark.svg?branch=master)](https://travis-ci.org/Rowno/react-benchmark)
[![Dependency Status](https://david-dm.org/Rowno/react-benchmark/status.svg)](https://david-dm.org/Rowno/react-benchmark)

A tool for benchmarking the render performance of React components.

## Install

```sh
yarn global add react-benchmark
# or
npm install -g react-benchmark
```

## Usage

```
Usage
  $ react-benchmark <path>

Options
  <path>     Path to a JavaScript file that exports the function to be benchmarked.
  --version  Prints the package version.
  --help     Prints this message.

Examples
  $ react-benchmark benchmark.js
```

The `<path>` file should export a function that returns the component instance you want to benchmark. For example:

```js
import React from 'react'
import Component from './src'

export default function() {
  return <Component hello="world" />
}
```

## License

react-benchmark is released under the ISC license.

Copyright © 2018, Roland Warmerdam.
