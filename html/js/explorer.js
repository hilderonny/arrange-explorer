import * as Arrange from '/arrange/js/arrange.js'

let IS_PUBLIC = true
let CURRENT_PATH = ''

const LIST_DIV = document.getElementById('list')
const PREVIEW_IFRAME = document.getElementById('preview')
const PRIVATE_BUTTON = document.getElementById('privatebutton')
const PUBLIC_BUTTON = document.getElementById('publicbutton')
const DELETE_BUTTON = document.getElementById('deletebutton')

async function selectDirectoryInCurrentPath(name) {
    CURRENT_PATH += '/' + name
    await showCurrentDir()
}

async function selectFileInCurrentPath(name) {
    const userPath = IS_PUBLIC ? 'public' : localStorage.getItem('userid')
    PREVIEW_IFRAME.src = `/api/files/${userPath}/${CURRENT_PATH}/${name}`
}

async function showCurrentDir() {
    LIST_DIV.innerHTML = ''
    PREVIEW_IFRAME.src = ''
    const functionToCall = IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile
    if (CURRENT_PATH === '') {
        DELETE_BUTTON.setAttribute('disabled', 'disabled')
    } else {
        DELETE_BUTTON.removeAttribute('disabled')
        const parentDiv = document.createElement('div')
        parentDiv.innerHTML = '..'
        parentDiv.classList.add('dir')
        parentDiv.addEventListener('click', async () => {
            const pathParts = CURRENT_PATH.split('/')
            pathParts.pop()
            CURRENT_PATH = pathParts.join('/')
            await showCurrentDir()
        })
        LIST_DIV.appendChild(parentDiv)
    }
    const dirContent = await (await functionToCall(CURRENT_PATH)).json()
    for (const entry of dirContent.sort((a, b) => a.name.localeCompare(b.name))) {
        const div = document.createElement('div')
        div.innerHTML = entry.name
        div.classList.add(entry.type)
        div.addEventListener('click', async () => {
            if (entry.type === 'dir') {
                await selectDirectoryInCurrentPath(entry.name)
            } else {
                await selectFileInCurrentPath(entry.name)
            }
        })
        LIST_DIV.appendChild(div)
    }
}

PRIVATE_BUTTON.addEventListener('click', async () => {
    IS_PUBLIC = false
    CURRENT_PATH = ''
    PRIVATE_BUTTON.setAttribute('disabled', 'disabled')
    PUBLIC_BUTTON.removeAttribute('disabled')
    await showCurrentDir()
})

PUBLIC_BUTTON.addEventListener('click', async () => {
    IS_PUBLIC = true
    CURRENT_PATH = ''
    PRIVATE_BUTTON.removeAttribute('disabled')
    PUBLIC_BUTTON.setAttribute('disabled', 'disabled')
    await showCurrentDir()
})

showCurrentDir()