'use strict'
const express = require('express')
const getPort = require('get-port')

let server

exports.start = assetsPath => {
  return new Promise(async resolve => {
    const port = await getPort()
    const app = express()

    app.use(express.static(assetsPath))
    server = app.listen(port, () => resolve(port))
  })
}

exports.stop = () => {
  return new Promise(resolve => {
    if (server) {
      server.close(() => {
        server = null
        resolve()
      })
    } else {
      resolve()
    }
  })
}
