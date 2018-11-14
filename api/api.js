const socket = new WebSocket('ws://192.168.2.98:1717')
const api = document.querySelector('#api')


let keys = []
let state = {
  left: [],
  right: []
}

/* websocket handeling */
socket.addEventListener('message', event => {
  const poses = JSON.parse(event.data)

  evaluatePoses(poses)
})


/* evaluating poses and api response */
function evaluatePoses (poses) {
  const width = 1280
  const overlap = 150

  const positions = poses.map(pose => Math.floor(pose.keypoints[0].position.x))

  const left = positions.filter(position => position < width / 2 + overlap)
  const right = positions.filter(position => position > width / 2 - overlap)

  console.log(left, right)

  state.left = left
  state.right = right

  api.innerText = JSON.stringify(state, null, 2)
}