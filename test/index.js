import test from 'ava'
import Benchmark from '..'

test('runs benchmark', async t => {
  const benchmark = new Benchmark()
  const result = await benchmark.run('test/fixtures/benchmark.js')
  t.truthy(result.stats)
  t.truthy(result.times)
  t.truthy(result.hz)
})
