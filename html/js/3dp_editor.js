import * as Arrange from '/arrange/js/arrange.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const FULL_FILE_PATH = location.search.substring(1)
const IS_PUBLIC = FULL_FILE_PATH.split('/')[0] === 'public'
const FILE_PATH = FULL_FILE_PATH.substring(FULL_FILE_PATH.indexOf('/'))
const TEXTURE_LOADER = new THREE.TextureLoader()

// ThreeJS initialisieren
const RENDERER = new THREE.WebGLRenderer( { antialias: true } )
RENDERER.setPixelRatio(window.devicePixelRatio)

const CAMERA = new THREE.PerspectiveCamera(60, 1, .1, 1000)
CAMERA.position.set(0, 5, 5)

const FLASH_LIGHT = new THREE.PointLight(0xEEEEEE)
FLASH_LIGHT.position.set(0, 0, 0)
CAMERA.add(FLASH_LIGHT)

const CONTROLS = new OrbitControls(CAMERA, RENDERER.domElement)

const SCENE = new THREE.Scene()
SCENE.background = new THREE.Color(0xE6F1FF)
// SCENE.add(new THREE.AmbientLight(0x222222))
SCENE.add(CAMERA)

RENDERER.setAnimationLoop(() => {
    CONTROLS.update()
    RENDERER.render(SCENE, CAMERA)
})

const GEOMETRY = new THREE.BufferGeometry()
const MATERIAL = new THREE.MeshLambertMaterial()
MATERIAL.transparent = true
const MESH = new THREE.Mesh(GEOMETRY, MATERIAL)
SCENE.add(MESH)

const POINTS_GEOMETRY = new THREE.BufferGeometry()
const POINTS_MATERIAL = new THREE.PointsMaterial( { color: 0xFF0000, size: 2, sizeAttenuation: false })
const POINTS = new THREE.Points(POINTS_GEOMETRY, POINTS_MATERIAL)
SCENE.add(POINTS)

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    RENDERER.setSize(100, 100) // Nur so wird die Größe des übergeordneten Elements richtig brechnet
    const width = RENDERER.domElement.parentNode.offsetWidth
    const height = RENDERER.domElement.parentNode.offsetHeight
    CAMERA.aspect = width / height
    CAMERA.updateProjectionMatrix()
    RENDERER.setSize(width, height)
}

async function updatePrimitive(fileContent) {
    // Siehe https://threejs.org/manual/#en/custom-buffergeometry
    MATERIAL.map = null
    const vertices = []
    const faceVertices = []
    const faceNormals = []
    const facUVs = []
    for (const line of fileContent.split("\n")) {
        const lineType = line[0]
        const lineContent = line.substring(1)
        if (lineType === 'v') {
            vertices.push(lineContent.split(',').map(v => parseFloat(v)))
        } else if (lineType === 'f') {
            for (const vertex of lineContent.split(';')) {
                const [vertexIndex, vertexDetails] = vertex.split('=')
                const [normals, uvs] = vertexDetails.split('/')
                faceVertices.push(...vertices[parseInt(vertexIndex)])
                faceNormals.push(...normals.split(',').map(n => parseFloat(n)))
                facUVs.push(...uvs.split(',').map(uv => parseFloat(uv)))
            }
        } else if (lineType === 'c') {
            const [r, g, b, a] = lineContent.split(',').map(c => parseInt(c))
            MATERIAL.color.setRGB(r, g, b)
            MATERIAL.opacity = (255 - a) / 255
        } else if (lineType === 't') {
            GEOMETRY.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(facUVs), 2))
            MATERIAL.map = await TEXTURE_LOADER.loadAsync(lineContent)
        }
    }
    GEOMETRY.setAttribute('position', new THREE.BufferAttribute(new Float32Array(faceVertices), 3))
    GEOMETRY.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(faceNormals), 3))
    MATERIAL.needsUpdate = true
    updatePoints(vertices)
}

function updatePoints(vertices) {
    const flatVertices = []
    for (const vertex of vertices) {
        flatVertices.push(...vertex)
        POINTS_GEOMETRY.setAttribute('position', new THREE.Float32BufferAttribute(flatVertices, 3));
    }
}

const vueApp = {
    data() {
        return {
            color: undefined,
            faces: [],
            fileContent: undefined,
            texture: undefined,
            vertices: [],
        }
    },
    async mounted() {
        this.fileContent = await (await (IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile)(FILE_PATH)).text()
        this.parseFileContent()
        this.$refs.threeJsContainer.appendChild(RENDERER.domElement)
        onWindowResize()
        updatePrimitive(this.fileContent)
    },
    methods: {
        generateFileContent() {

        },
        handleEditorInput() {
            updatePrimitive(this.fileContent)
        },
        parseFileContent() {
            this.vertices = []
            this.faces = []
            for (const line of this.fileContent.split("\n")) {
                const lineType = line[0]
                const lineContent = line.substring(1)
                if (lineType === 'v') {
                    const vertexCoords = lineContent.split(',')
                    this.vertices.push({ x: parseFloat(vertexCoords[0]), y: parseFloat(vertexCoords[1]), z: parseFloat(vertexCoords[2]) })
                } else if (lineType === 'f') {
                    const faceVertices = []
                    for (const vertex of lineContent.split(';')) {
                        const faceVertex = {
                            index: undefined, 
                            normal: {}, 
                            uv: {}
                        }
                        const [vertexIndex, vertexDetails] = vertex.split('=')
                        faceVertex.index = vertexIndex
                        const [normals, uvs] = vertexDetails.split('/')
                        const normalCoords = normals.split(',')
                        faceVertex.normal.x = parseFloat(normalCoords[0])
                        faceVertex.normal.y = parseFloat(normalCoords[1])
                        faceVertex.normal.z = parseFloat(normalCoords[2])
                        const uvCoords = uvs.split(',')
                        faceVertex.uv.x = parseFloat(uvCoords[0])
                        faceVertex.uv.y = parseFloat(uvCoords[1])
                        faceVertices.push(faceVertex)
                    }
                    this.faces.push(faceVertices)
                } else if (lineType === 'c') {
                    // const [r, g, b, a] = lineContent.split(',').map(c => parseInt(c))
                    // MATERIAL.color.setRGB(r, g, b)
                    // MATERIAL.opacity = (255 - a) / 255
                } else if (lineType === 't') {
                    // GEOMETRY.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(facUVs), 2))
                    // MATERIAL.map = await TEXTURE_LOADER.loadAsync(lineContent)
                }
            }
        },
        async save() {
            await (IS_PUBLIC ? Arrange.postPublicFile : Arrange.postPrivateFile)(FILE_PATH, this.fileContent)
            alert('Gespeichert.')
        },
        updatePreview() {
            console.log('updatePreview')
        }
    }
}

Vue.createApp(vueApp).mount('body')