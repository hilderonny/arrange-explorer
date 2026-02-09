import * as Arrange from '/arrange/js/arrange.js'

const FULL_FILE_PATH = location.search.substring(1)
const IS_PUBLIC = FULL_FILE_PATH.split('/')[0] === 'public'
const FILE_PATH = FULL_FILE_PATH.substring(FULL_FILE_PATH.indexOf('/'))
const EDITOR_TEXTAREA = document.getElementById('editor')
const PREVIEW_DIV = document.getElementById('preview')

const FILE_CONTENT = await (await (IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile)(FILE_PATH)).text()

EDITOR_TEXTAREA.value = FILE_CONTENT

console.log(IS_PUBLIC, FILE_PATH, FILE_CONTENT)

// ThreeJS initialisieren
const RENDERER = new THREE.WebGLRenderer( { antialias: true } )
RENDERER.setPixelRatio(window.devicePixelRatio)

const CAMERA = new THREE.PerspectiveCamera(60, 1, 1, 1000)
CAMERA.position.set(400, 200, 0)
CAMERA.add(new THREE.PointLight(0xEEEEEE))

const CONTROLS = new THREE.OrbitControls(CAMERA, RENDERER.domElement)
CONTROLS.enableDamping = true
CONTROLS.dampingFactor = 0.25
CONTROLS.rotateSpeed = 0.1
CONTROLS.panSpeed = 0.1
CONTROLS.screenSpacePanning = true
CONTROLS.minDistance = 5
CONTROLS.maxDistance = 100
CONTROLS.keys = { LEFT: 65, UP: 87, RIGHT: 68, BOTTOM: 83 }

const SCENE = new THREE.Scene()
SCENE.background = new THREE.Color(0xE6F1FF)
SCENE.add(new THREE.AmbientLight(0x222222))
SCENE.add(CAMERA)

RENDERER.setAnimationLoop(() => {
    CONTROLS.update()
    RENDERER.render(SCENE, CAMERA)
})

PREVIEW_DIV.appendChild(RENDERER.domElement)

window.addEventListener('resize', onWindowResize, false)

onWindowResize()

function onWindowResize() {
    RENDERER.setSize(100, 100) // Nur so wird die Größe des übergeordneten Elements richtig brechnet
    const width = RENDERER.domElement.parentNode.offsetWidth
    const height = RENDERER.domElement.parentNode.offsetHeight
    CAMERA.aspect = width / height
    CAMERA.updateProjectionMatrix()
    RENDERER.setSize(width, height)
}