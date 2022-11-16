const test = require('ava')
const ReactBenchmark = require('..')

test('runs benchmark', async (t) => {
  t.plan(10)

  let hasProgressed = false
  const reactBenchmark = new ReactBenchmark()

  reactBenchmark.on('webpack', () => {
    t.pass('webpack event')
  })
  reactBenchmark.on('server', () => {
    t.pass('server event')
  })
  reactBenchmark.on('chrome', () => {
    t.pass('chrome event')
  })
  reactBenchmark.on('start', () => {
    t.pass('start event')
  })
  reactBenchmark.on('progress', (benchmark) => {
    if (!hasProgressed) {
      hasProgressed = true
      t.truthy(benchmark.stats)
      t.truthy(benchmark.times)
    }
  })
  reactBenchmark.on('console', (log) => {
    if (log.type !== 'warning') {
      return
    }
    t.deepEqual(log, {
      type: 'warning',
      text: 'log message',
    })
  })

  const result = await reactBenchmark.run('test/fixtures/benchmark.js')
  t.truthy(result.stats)
  t.truthy(result.times)
  t.truthy(result.hz)
})

test('supports jsx', async (t) => {
  const reactBenchmark = new ReactBenchmark()
  const result = await reactBenchmark.run('test/fixtures/benchmark.jsx')
  t.truthy(result.stats)
})

test('supports typescript', async (t) => {
  const reactBenchmark = new ReactBenchmark()
  const result = await reactBenchmark.run('test/fixtures/benchmark.tsx')
  t.truthy(result.stats)
})
