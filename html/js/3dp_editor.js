import * as Arrange from '/arrange/js/arrange.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const FULL_FILE_PATH = location.search.substring(1)
const IS_PUBLIC = FULL_FILE_PATH.split('/')[0] === 'public'
const FILE_PATH = FULL_FILE_PATH.substring(FULL_FILE_PATH.indexOf('/'))
const EDITOR_TEXTAREA = document.getElementById('editor')
const PREVIEW_DIV = document.getElementById('preview')

const FILE_CONTENT = await (await (IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile)(FILE_PATH)).text()

EDITOR_TEXTAREA.value = FILE_CONTENT
EDITOR_TEXTAREA.addEventListener('input', () => {
    try {
        const data = JSON.parse(EDITOR_TEXTAREA.value)
        console.log(data)
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
const MESH = new THREE.Mesh(GEOMETRY, MATERIAL)
SCENE.add(MESH)
//updatePrimitive()

document.getElementById('savebutton').addEventListener('click', async () => {
    console.log(EDITOR_TEXTAREA.value, FILE_PATH)
    await (IS_PUBLIC ? Arrange.postPublicFile : Arrange.postPrivateFile)(FILE_PATH, EDITOR_TEXTAREA.value)
    alert('Gespeichert.')
})


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

function updatePrimitive() {
    const vertices = new Float32Array([
        0, 0, 0, // v0
        1, 0, 0, // v1
        1, 1, 0, // v2

        0, 0, 0, // v0
        1, 1, 0, // v1
        0, 1, 0, // v2

    ])
    // itemSize = 3 because there are 3 values (components) per vertex
    GEOMETRY.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    MATERIAL.color.setRGB(150, 60, 70)
}