import * as Arrange from '/arrange/js/arrange.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const FULL_FILE_PATH = location.search.substring(1)
const IS_PUBLIC = FULL_FILE_PATH.split('/')[0] === 'public'
const FILE_PATH = FULL_FILE_PATH.substring(FULL_FILE_PATH.indexOf('/'))
const EDITOR_TEXTAREA = document.getElementById('editor')
const PREVIEW_DIV = document.getElementById('preview')
const TEXTURE_LOADER = new THREE.TextureLoader()

const FILE_CONTENT = await (await (IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile)(FILE_PATH)).text()

EDITOR_TEXTAREA.value = FILE_CONTENT
EDITOR_TEXTAREA.addEventListener('input', () => {
    try {
        updatePrimitive()
    } catch {}
})

// ThreeJS initialisieren
const RENDERER = new THREE.WebGLRenderer( { antialias: true } )
RENDERER.setPixelRatio(window.devicePixelRatio)

const CAMERA = new THREE.PerspectiveCamera(60, 1, 1, 1000)
CAMERA.position.set(0, 5, 5)
CAMERA.add(new THREE.PointLight(0xEEEEEE))

const CONTROLS = new OrbitControls(CAMERA, RENDERER.domElement)

const SCENE = new THREE.Scene()
SCENE.background = new THREE.Color(0xE6F1FF)
SCENE.add(new THREE.AmbientLight(0x222222))
SCENE.add(CAMERA)

RENDERER.setAnimationLoop(() => {
    CONTROLS.update()
    RENDERER.render(SCENE, CAMERA)
})

PREVIEW_DIV.appendChild(RENDERER.domElement)

const GEOMETRY = new THREE.BufferGeometry()
const MATERIAL = new THREE.MeshLambertMaterial()
MATERIAL.transparent = true
const MESH = new THREE.Mesh(GEOMETRY, MATERIAL)
SCENE.add(MESH)

document.getElementById('savebutton').addEventListener('click', async () => {
    await (IS_PUBLIC ? Arrange.postPublicFile : Arrange.postPrivateFile)(FILE_PATH, EDITOR_TEXTAREA.value)
    alert('Gespeichert.')
})


window.addEventListener('resize', onWindowResize, false)

onWindowResize()
updatePrimitive()

function onWindowResize() {
    RENDERER.setSize(100, 100) // Nur so wird die Größe des übergeordneten Elements richtig brechnet
    const width = RENDERER.domElement.parentNode.offsetWidth
    const height = RENDERER.domElement.parentNode.offsetHeight
    CAMERA.aspect = width / height
    CAMERA.updateProjectionMatrix()
    RENDERER.setSize(width, height)
}

async function updatePrimitive() {
    const jsonData = JSON.parse(EDITOR_TEXTAREA.value)
    const vertices = jsonData?.v
    const faces = jsonData?.f
    const faceVertices = []
    const facUVs = []
    for (const face of faces) {
        for (const vertex of face) {
            faceVertices.push(...vertices[vertex.v])
            if (vertex.uv) {
                facUVs.push(...vertex.uv)
            }
        }
    }
    // Siehe https://threejs.org/manual/#en/custom-buffergeometry
    GEOMETRY.setAttribute('position', new THREE.BufferAttribute(new Float32Array(faceVertices), 3))
    const color = jsonData?.m?.c
    MATERIAL.color.setRGB(color[0], color[1], color[2])
    MATERIAL.opacity = (255 - color[3]) / 255
    if (jsonData?.m?.t) {
        GEOMETRY.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(facUVs), 2))
        MATERIAL.map = await TEXTURE_LOADER.loadAsync(jsonData.m.t)
        MATERIAL.needsUpdate = true
    }
}