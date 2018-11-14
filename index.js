const express = require('express')
const WebSocket = require('ws')

const five = require('johnny-five')
const board = new five.Board({
  port: 'COM6'
})

/* stream server setup */
const streamServerSettings = {
  port: 3000,
  staticPath: 'stream'
}
const streamServer = express()

streamServer.use(express.static(streamServerSettings.staticPath))
streamServer.listen(streamServerSettings.port)
console.log('streaming server is running on http://localhost:' + streamServerSettings.port)

/* visualization server setup */
const visualizationServerSettings = {
  port: 3001,
  staticPath: 'visualization'
}
const visualizationServer = express()

visualizationServer.use(express.static(visualizationServerSettings.staticPath))
visualizationServer.listen(visualizationServerSettings.port)
console.log('visualization server is running on http://localhost:' + visualizationServerSettings.port)

/* websocket server setup */
const webSocketServer = new WebSocket.Server({ port: 1717 })

/* initialize arduino board */
board.on('ready', function() {
  const relay_01 = new five.Relay({
    pin: 9,
    type: 'NC'
  })

  const relay_02 = new five.Relay({
    pin: 10,
    type: 'NC'
  })

  /* global state */
  let state = {
    poses: [],
    left: [],
    right: []
  }

  /* communication to arduino */
  function communicate () {
    const duration = 4000

    if (state.left.length === 0 && state.right.length === 0) {
      return
    } else if (state.left.length === 0) {
      relay_01.open()

      setTimeout(() => {
        relay_01.close()
      }, duration)
    } else if (state.right.length === 0) {
      relay_02.open()

      setTimeout(() => {
        relay_02.close()
      }, duration)
    } else {
      relay_01.open()
      relay_02.open()

      setTimeout(() => {
        relay_01.close()
      }, duration)

      setTimeout(() => {
        relay_02.close()
      }, duration)
    }
  }

  /* state manipulation through pose evaluation */
  function evaluatePoses () {
    const width = 1280
    const overlap = 150

    const positions = state.poses.map(pose => Math.floor(pose.keypoints[0].position.x))

    const left = positions.filter(position => position < width / 2 + overlap)
    const right = positions.filter(position => position > width / 2 - overlap)

    console.log(left, right)

    state.left = left
    state.right = right

    communicate()
  }

  /* incoming pose estimation from streaming server */
  webSocketServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      webSocketServer.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })
  
      state.poses = JSON.parse(message)
      evaluatePoses()
    })
  })
})
