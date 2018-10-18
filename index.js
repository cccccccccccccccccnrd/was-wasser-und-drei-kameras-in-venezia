const express = require('express')
const WebSocket = require('ws')

const five = require('johnny-five')
const board = new five.Board({
  port: 'COM5'
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
board.on('ready', () => {
  const relay = new five.Relay({
    pin: 3,
    type: 'NC'
  })

  /* global state */
  let state = {
    pose: {},
    relay: false
  }

  /* communication to arduino */
  function communicate () {
    if (state.relay) {
      relay.open()
    } else {
      relay.close()
    }
  }

  /* state manipulation through pose evaluation */
  function evaluatePose () {
    if (state.pose.keypoints[10].score > 0.2) {
      state.relay = true
      communicate()
    } else {
      state.relay = false
      communicate()
    }
  }

  /* incoming pose estimation from streaming server */
  webSocketServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      webSocketServer.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })

      const pose = JSON.parse(message)

      state.pose = pose
      evaluatePose()
    })
  })
})