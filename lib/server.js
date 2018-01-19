'use strict'
const express = require('express')
const getPort = require('get-port')

let server

exports.start = async assetsPath => {
  const port = await getPort()
  const app = express()

  app.use(express.static(assetsPath))

  return new Promise(resolve => {
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
