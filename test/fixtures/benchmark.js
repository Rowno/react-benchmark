import React from 'react'
import PropTypes from 'prop-types'

console.warn('log message')

export default function Benchmark({ callback }) {
  return <div ref={callback}>Test</div>
}

Benchmark.propTypes = {
  callback: PropTypes.func.isRequired,
}
