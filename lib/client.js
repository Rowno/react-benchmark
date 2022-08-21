import benchmark from 'benchmark'
import lodash from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import testComponent from 'react-benchmark-test-component'

// Hack to make benchmark work via webpack
const Benchmark = benchmark.runInContext({ _: lodash })
window.Benchmark = Benchmark

let container = document.createElement('div')

const bench = new Benchmark({
  defer: true,
  async: true,
  fn(deferred) {
    container.remove()
    container = document.createElement('div')
    document.body.append(container)
    const handleReady = () => {
      if (process.env.IS_ON_READY_ENABLED !== 'true') {
        return
      }
      deferred.resolve()
    }
    ReactDOM.render(
      React.createElement(testComponent, {
        onReady: process.env.IS_ON_READY_ENABLED ? handleReady : undefined,
      }),
      container,
      () => {
        if (process.env.IS_ON_READY_ENABLED === 'true') {
          return
        }
        deferred.resolve()
      }
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
