import * as Arrange from '/arrange/js/arrange.js'

let IS_PUBLIC = true
let CURRENT_PATH = '/'

const PATH_DIV = document.getElementById('path')
const LIST_DIV = document.getElementById('list')
const PREVIEW_IFRAME = document.getElementById('preview')
const PRIVATE_BUTTON = document.getElementById('privatebutton')
const PUBLIC_BUTTON = document.getElementById('publicbutton')
const UPLOAD_BUTTON = document.getElementById('uploadbutton')
const UPLOADFILE_INPUT = document.getElementById('uploadfile')
const UPLOAD_PROGRESS = document.getElementById('uploadprogress')

async function selectDirectoryInCurrentPath(name) {
    CURRENT_PATH += name + '/'
    await showCurrentDir()
}

async function selectFileInCurrentPath(name) {
    const userPath = IS_PUBLIC ? 'public' : localStorage.getItem('userid')
    if (name.endsWith('.3dp')) {
        PREVIEW_IFRAME.src = `3dp_editor.html?${userPath}${CURRENT_PATH}${name}`
    } else {
        PREVIEW_IFRAME.src = `/api/files/${userPath}${CURRENT_PATH}${name}`
    }
}

async function showCurrentDir() {
    LIST_DIV.innerHTML = ''
    PREVIEW_IFRAME.src = ''
    const functionToCall = IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile
    const userPath = IS_PUBLIC ? 'public' : localStorage.getItem('userid')
    if (CURRENT_PATH !== '/') {
        const parentDiv = document.createElement('div')
        parentDiv.classList.add('dir')
        const parentLink = document.createElement('a')
        parentLink.innerHTML = '..'
        parentLink.addEventListener('click', async () => {
            const pathParts = CURRENT_PATH.split('/')
            pathParts.splice(pathParts.length - 2, 1)
            CURRENT_PATH = pathParts.join('/')
            await showCurrentDir()
        })
        parentDiv.appendChild(parentLink)
        LIST_DIV.appendChild(parentDiv)
    }
    const dirContent = await (await functionToCall(CURRENT_PATH)).json() || []
    for (const entry of dirContent.sort((a, b) => a.name.localeCompare(b.name))) {
        const entryDiv = document.createElement('div')
        entryDiv.classList.add(entry.type)
        const entryLink = document.createElement('a')
        entryLink.href = `/api/files/${userPath}${CURRENT_PATH}${entry.name}`
        entryLink.innerHTML = entry.name
        entryLink.addEventListener('click', async (event) => {
            event.preventDefault()
            if (entry.type === 'dir') {
                await selectDirectoryInCurrentPath(entry.name)
            } else {
                await selectFileInCurrentPath(entry.name)
            }
        })
        entryDiv.appendChild(entryLink)
        const deleteButton = document.createElement('button')
        deleteButton.innerHTML = 'Löschen'
        deleteButton.addEventListener('click', async () => {
            const fullPath = CURRENT_PATH + entry.name
            if (!confirm(`Wirklich "${fullPath}" löschen?`)) return
            const functionToCall = IS_PUBLIC ? Arrange.deletePublicPath : Arrange.deletePrivatePath
            await functionToCall(fullPath)
            await showCurrentDir()
        })
        entryDiv.appendChild(deleteButton)
        LIST_DIV.appendChild(entryDiv)
    }
    PATH_DIV.innerHTML = CURRENT_PATH
}

PRIVATE_BUTTON.addEventListener('click', async () => {
    IS_PUBLIC = false
    CURRENT_PATH = '/'
    PRIVATE_BUTTON.setAttribute('disabled', 'disabled')
    PUBLIC_BUTTON.removeAttribute('disabled')
    await showCurrentDir()
})

PUBLIC_BUTTON.addEventListener('click', async () => {
    IS_PUBLIC = true
    CURRENT_PATH = '/'
    PRIVATE_BUTTON.removeAttribute('disabled')
    PUBLIC_BUTTON.setAttribute('disabled', 'disabled')
    await showCurrentDir()
})

document.getElementById('adddirectorybutton').addEventListener('click', async () => {
    const dirName = prompt('Verzeichnisname', 'Neues_Verzeichnis')
    if (!dirName) return
    const fixedDirName = dirName.replaceAll(/[^\p{L}\p{N}]/gu, '_')
    const functionToCall = IS_PUBLIC ? Arrange.createPublicPath : Arrange.createPrivatePath
    await functionToCall(CURRENT_PATH + fixedDirName)
    await showCurrentDir()
})

document.getElementById('addtextfilebutton').addEventListener('click', async () => {
    const fileName = prompt('Dateiname', 'Datei.txt')
    if (!fileName) return
    const fixedFileName = fileName.replaceAll(/[^\p{L}\p{N}.]/gu, '_')
    const functionToCall = IS_PUBLIC ? Arrange.postPublicFile : Arrange.postPrivateFile
    await functionToCall(CURRENT_PATH + '/' + fixedFileName, fixedFileName.endsWith('.3dp') ? `{
  "v": [
    [0,0,0],
    [1,0,0],
    [1,1,0],
    [0,1,0]
  ],
  "f": [
    [0,1,2],
    [0,2,3]
  ],
  "m": {
    "c": [100,50,10,0]
  }
}` : fixedFileName)
    await showCurrentDir()
})

UPLOAD_BUTTON.addEventListener('click', () => {
    UPLOADFILE_INPUT.click()
})

UPLOADFILE_INPUT.addEventListener('change', async () => {
    UPLOAD_BUTTON.setAttribute('disabled', 'disabled')
    UPLOAD_PROGRESS.style.display = 'block'
    const file = UPLOADFILE_INPUT.files[0]
    const functionToCall = IS_PUBLIC ? Arrange.uploadPublicFile : Arrange.uploadPrivateFile
    const fixedFileName = file.name.replaceAll(/[^\p{L}\p{N}]/gu, '_')
    await functionToCall(CURRENT_PATH + '/' + fixedFileName, file, (progress) => {
        UPLOAD_PROGRESS.value = progress
    })
    UPLOAD_PROGRESS.style.display = 'none'
    UPLOAD_BUTTON.removeAttribute('disabled')
    await showCurrentDir()
})

showCurrentDir()