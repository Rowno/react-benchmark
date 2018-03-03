import test from 'ava'
import Benchmark from '..'

test('runs benchmark', async t => {
  const benchmark = new Benchmark()

  benchmark.on('webpack', () => {
    console.log('Compiling bundle')
  })

  benchmark.on('server', () => {
    console.log('Starting server')
  })

  benchmark.on('chrome', () => {
    console.log('Starting Chrome')
  })

  benchmark.on('start', () => {
    console.log('Starting benchmark')
  })

  benchmark.on('progress', benchmark => {
    console.log('run', benchmark.stats.sample.length)
  })

  const result = await benchmark.run('test/fixtures/benchmark.js')
  t.truthy(result.stats)
  t.truthy(result.times)
  t.truthy(result.hz)
})
