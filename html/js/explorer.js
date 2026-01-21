import * as Arrange from '/arrange/js/arrange.js'

let IS_PUBLIC = true
let CURRENT_PATH = '/'

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
    console.log(CURRENT_PATH, name)
    const userPath = IS_PUBLIC ? 'public' : localStorage.getItem('userid')
    PREVIEW_IFRAME.src = `/api/files/${userPath}${CURRENT_PATH}${name}`
}

async function showCurrentDir() {
    LIST_DIV.innerHTML = ''
    PREVIEW_IFRAME.src = ''
    const functionToCall = IS_PUBLIC ? Arrange.getPublicFile : Arrange.getPrivateFile
    if (CURRENT_PATH !== '/') {
        const parentDiv = document.createElement('div')
        parentDiv.classList.add('dir')
        const parentLabel = document.createElement('label')
        parentLabel.innerHTML = '..'
        parentLabel.addEventListener('click', async () => {
            const pathParts = CURRENT_PATH.split('/')
            pathParts.splice(pathParts.length - 2, 1)
            CURRENT_PATH = pathParts.join('/')
            await showCurrentDir()
        })
        parentDiv.appendChild(parentLabel)
        LIST_DIV.appendChild(parentDiv)
    }
    const dirContent = await (await functionToCall(CURRENT_PATH)).json() || []
    for (const entry of dirContent.sort((a, b) => a.name.localeCompare(b.name))) {
        const entryDiv = document.createElement('div')
        entryDiv.classList.add(entry.type)
        const entryLabel = document.createElement('label')
        entryLabel.innerHTML = entry.name
        entryLabel.addEventListener('click', async () => {
            if (entry.type === 'dir') {
                await selectDirectoryInCurrentPath(entry.name)
            } else {
                await selectFileInCurrentPath(entry.name)
            }
        })
        entryDiv.appendChild(entryLabel)
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