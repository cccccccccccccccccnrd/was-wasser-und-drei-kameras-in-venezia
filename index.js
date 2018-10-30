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

  const relay_01 = new five.Relay({
    pin: 10, 
    type: 'NC'
  })

  const relay_02 = new five.Relay({
    pin: 11, 
    type: 'NC'
  })

  /* global state */
  let state = {
    poses: [],
    relay_01: false,
    relay_02: false
  }

  /* communication to arduino */
  function communicate () {
    if (state.relay_01) {
      relay_01.open()
      relay_02.close()
    } else if (state.relay_02) {
      relay_01.close()
      relay_02.open()
    }
  }

  /* state manipulation through pose evaluation */
  function evaluatePoses () {
    // console.log(state)
    // console.log(state.poses)

    const width = 600

    const positions = state.poses.map(pose => {
      return Math.floor(pose.keypoints[0].position.x)
    })

    if (positions.length >= 2) {
      const distance = positions.reduce((a, b) => b - a)

      console.log(distance)

      if (Math.abs(Math.floor(distance)) > width / 4) {
        state.relay_01 = true
        state.relay_02 = false
  
        communicate()
      } else {
        state.relay_01 = false
        state.relay_02 = true
  
        communicate()
      }
    }


    /* const width = 600

     if (state.pose.keypoints[0].score < 0.3) {
      state.motor_1 = false
      state.motor_2 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > 0 && state.pose.keypoints[0].position.x < width / 2) {
      state.motor_1 = true
      state.motor_2 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > width / 2 && state.pose.keypoints[0].position.x < width) {
      state.motor_1 = false
      state.motor_2 = true

      communicate()
    } */
  }

  /* incoming pose estimation from streaming server */
  webSocketServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      webSocketServer.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })

      const poses = JSON.parse(message)

      state.poses = poses
      evaluatePoses()
    })
  })
})