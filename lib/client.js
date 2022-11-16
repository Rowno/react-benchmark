import benchmark from 'benchmark'
import lodash from 'lodash'
import ReactDOM from 'react-dom'
import React from 'react'
import TestComponent from 'react-benchmark-test-component'

// Hack to make benchmark work via webpack
const Benchmark = benchmark.runInContext({ _: lodash })
window.Benchmark = Benchmark

// Render an instance in the DOM before running the benchmark to make debugging easier
const _container = document.createElement('div')
const _root = ReactDOM.createRoot(_container)
_root.render(React.createElement(TestComponent, { callback: () => {} }, null))
document.body.append(_container)

const bench = new Benchmark({
  defer: true,
  async: true,
  delay: 0.3,
  minSamples: 20,
  fn(deferred) {
    const container = document.createElement('div')
    const root = ReactDOM.createRoot(container)
    root.render(
      React.createElement(
        TestComponent,
        {
          callback: () => {
            deferred.resolve()
          },
        },
        null
      )
    )
  },
  onCycle(e) {
    window.benchmarkProgress(JSON.stringify(e.target))
  },
  onComplete() {
    window.benchmarkComplete(JSON.stringify(bench))
  },
})

bench.run()
