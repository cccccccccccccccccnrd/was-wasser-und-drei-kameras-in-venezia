const socket = new WebSocket('ws://localhost:1717')
const timeLeft = document.querySelector('#left .time')
const timeRight = document.querySelector('#right .time')
const agentPositionLeft = document.querySelector('#left .position')
const agentPositionRight = document.querySelector('#right .position')
const agentCountLeft = document.querySelector('#left .count')
const agentCountRight = document.querySelector('#right .count')

let state = {
  left: [],
  right: []
}

/* websocket handeling */
socket.addEventListener('message', event => {
  const poses = JSON.parse(event.data)
  evaluatePoses(poses)

  restartInterval()

  /* poses.forEach(pose => {
    visualize(pose.keypoints)
  }) */
})

function evaluatePoses (poses) {
  const width = 1280
  const overlap = 150

  const positions = poses.map(pose => Math.floor(pose.keypoints[0].position.x))

  const left = positions.filter(position => position < width / 2 + overlap)
  const right = positions.filter(position => position > width / 2 - overlap)

  console.log(left, right)

  state.left = left
  state.right = right

  agentCountLeft.innerText = JSON.stringify(left.length)
  agentPositionLeft.innerText = JSON.stringify(left)

  agentCountRight.innerText = JSON.stringify(right.length)
  agentPositionRight.innerText = JSON.stringify(right)
}

/* drawing data onto canvas */
function visualize (keypoints, scale = 1) {
  for (let i = 0; i <= 0; i++) {
    const keypoint = keypoints[i]

    if (keypoint.score < 0.1) {
      continue
    }

    const { y, x } = keypoint.position

    canvasCtx.beginPath()
    canvasCtx.arc(x * scale, y * scale, 8, 0, 2 * Math.PI)
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)'
    canvasCtx.fill()
  }
}

function restartInterval() {
  const duration = 5 * 1000 + 1000
  let time = duration

  const countdown = setInterval(() => {
    time = time - 10
    timeLeft.innerText = time
    timeRight.innerText = time
  }, 10)

  setTimeout(() => {
    timeLeft.innerText = '0'
    timeRight.innerText = '0'
    clearInterval(countdown)
  }, duration)
}