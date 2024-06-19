










import uiRender from '../utils/uiRender'
import api from './../utils/api'
import {dispatch} from "../utils/functions";
import editorText from "../utils/editorText";
import blockInit from "../utils/block"

export default class DefaultMode {
    constructor() {
        this.api = api

        this.firstBlock = null
        this.allBlocks = {}
        this.rootId = null
        this.section = document.getElementById('default-section')

        this.currenActiveBlockEl = null
        this.openedBlocks = []
        this.highlightedList = new Set();
        this.copylinkBlockId = []
    }

    init() {
        window.addEventListener('control-panel-pres-btn', (e) => {
            if (this.highlightedList.size !== 0) {
                const elements = Array.from(this.highlightedList)
                    .map(el => document.getElementById(el))
                    .filter(el => el !== null)

                elements.forEach(el => {
                    el.classList.remove('block-highlighted')
                })
                this[e.detail.action](elements)
                this.highlightedList.clear()
            } else if (this.currenActiveBlockEl) {
                this[e.detail.action]([this.currenActiveBlockEl])
            }
            dispatch('reset-buttons')
        })

        window.addEventListener('block-element-updated', (e) => {
            this.blockInit = blockInit.setAllBlocks(this.allBlocks)
            e.detail.elements.forEach(el => {
                if (el.id === this.openedBlocks.at(-1)) {
                    el.classList.add('block-full-screen')
                }
                this.blockInit.initBlockEl(el)
            })
        })

        window.addEventListener('blocks-loaded', (event) => {
            if (this.$store.gdata.appMode === 'default') {
                this.allBlocks = event.detail.blocks
                this.blockInit = blockInit.setAllBlocks(this.allBlocks)
                this.firstBlock = event.detail.firstBlock
                this.rootId = this.firstBlock.id
                const blockElem = uiRender.defaultMode(this.allBlocks, this.firstBlock);
                this.section.textContent = ''
                this.section.appendChild(blockElem)
            }
        });

        window.addEventListener('open-editor', (event) => {
            this.openEditor(event.detail.event)
        })

        window.addEventListener('close-editor', (event) => {
            this.$store.gdata.isOpenMde = false
            editorText.closeEditor()
        })

        window.addEventListener('open-previous-block', () => {
            console.log('lel')
            this.openPreviousBlock()
        })
    }

    openEditor(event) {
        if (event.shiftKey) {
            return
        }
        if (event.ctrlKey && this.$store.gdata.isOpenMde) {
            this.$store.gdata.isOpenMde = false
            editorText.closeEditor()
            return
        }
        if (this.$store.gdata.isOpenMde) {
            return;
        }
        if (this.currenActiveBlockEl) {
            this.$store.gdata.isOpenMde = true
            const block = this.allBlocks.get(this.currenActiveBlockEl.getAttribute('blockId'))
            editorText.initMde(this.currenActiveBlockEl, block)
        }
    }

    blockClick(e) {
        const action = this.$store.gdata.action
        const blockEl = this._findParentWithAttribute(e.target, 'blockId')

        if (action && this[action] !== undefined) {
            this[action]([blockEl])
        } else {
            this.openBlockFullScreen(blockEl)
        }
        dispatch('reset-buttons')
    }


    openPreviousBlock(e) {
        console.log(this.openedBlocks)
        if (this.openedBlocks.length > 0) {
            const currentOpened = document.getElementById(this.openedBlocks.pop())
            currentOpened.classList.remove('block-full-screen')
            this.blockInit.initBlockEl(currentOpened)
            const previousEl = document.getElementById(this.openedBlocks.at(-1))
            if (previousEl) {
                previousEl.classList.add('block-full-screen')
                this.blockInit.initBlockEl(previousEl)
            }
        }
    }

    openBlockFullScreen(blockEl) {
        const blockPath = blockEl.getAttribute('id')
        const currentOpened = document.getElementById(this.openedBlocks.at(-1))

        if (blockPath == this.rootId) return

        if (currentOpened) {
            currentOpened.classList.remove('block-full-screen')
            this.blockInit.initBlockEl(currentOpened)
        }
        if (this.openedBlocks.at(-1) === blockPath) {
            this.openedBlocks.pop()
            if (this.openedBlocks.length > 0) {
                const previousEl = document.getElementById(this.openedBlocks.at(-1))
                previousEl.classList.add('block-full-screen')
                this.blockInit.initBlockEl(previousEl)
            }
        } else {
            this.openedBlocks.push(blockPath)
            blockEl.classList.add('block-full-screen')
            this.blockInit.initBlockEl(blockEl)
        }
    }

    openLinkOnBlock(path) {
        const blockEl = document.getElementById(path)
        if (blockEl) {
            this.openBlockFullScreen(blockEl)
        } else {
            //     todo проверить блок в базе
        }
    }

    addBlock(elements) {
        elements.forEach(blockEl => {
            const block = this.allBlocks.get(blockEl.getAttribute('blockId'))

            api.createBlock()
                .then(res => {
                    if (res.status === 201) {
                        const child = res.data

                        block.children.push(child.id)
                        child.paths = [blockEl.getAttribute('id') + ',' + child.id]
                        this.allBlocks.set(`${child.id}`, child)
                        api.setBlock(block.id, block)
                    }
                }).catch(err => {
                console.log(err)
            })
        })
    }

    removeBlock(elements) {
        console.log(elements)
        if (elements.includes(this.rootId)) {
            dispatch('open-popup', {
                'title': 'Корневой блок удалить нельзя',
            })
            return
        }
        const message = this._createDeleteMessage(elements)
        const allBlocks = this.allBlocks

        const _removeBlock = async () => {
            elements.forEach(blockEl => {
                const block = allBlocks.get(blockEl.getAttribute('blockId'))
                const parent = allBlocks.get(blockEl.getAttribute('parent'))
                const copyParent = JSON.parse(JSON.stringify(parent));

                parent.children = parent.children.filter(id => id != block.id)
                delete parent.children_position[block.id]

                // sizeManager.manager(parent)

                this.api.deleteBlock(block.id, {'parent': parent, 'child': block})
                    .then(res => {
                        if (res.status === 204) {
                            console.log('block удален')
                            dispatch('update-block', {block: parent})
                        } else {
                            console.log('блок не удален')
                            allBlocks.set(`${copyParent.id}`, copyParent)
                        }
                    }).catch(err => {
                    console.log('блок не удален')
                    console.log(err)
                })
            })
        }

        dispatch('open-popup', {
            'title': 'Подтвердите удаление блока',
            'message': message,
            onConfirm: _removeBlock
        })

    }

    moveBlock(elements) {
        const idList = []

        elements.forEach(el => {
            idList.push(el.getAttribute('blockId'))
        })
        console.log(idList)
        console.log(this.currenActiveBlockEl)
    }

    copyBlock() {
        //     todo
    }

    pasteBlock() {
        //     todo
    }

    copyLink(elements) {
        elements.forEach(blockEl => {
            this.copylinkBlockId.push(parseInt(blockEl.getAttribute('blockId')))
        })
    }

    pasteLink(elements) {
        elements.forEach(blockEl => {
            const block = this.allBlocks.get(blockEl.getAttribute('blockId'))

            if (block) {
                if (block.children.some(id => this.copylinkBlockId.includes(id))) {
                    // todo сделать подсказку в интерфейсе
                    console.log('нельзя добавлять одинаковые блоки на один уровень')
                } else {
                    block.children = [...block.children, ...this.copylinkBlockId]
                    this.api.setBlock(block.id, block)
                }
            }
        })
        this.copylinkBlockId = []
    }

    copyPath(elements) {
        const pathList = []

        elements.forEach(blockEl => {
            pathList.push(blockEl.getAttribute('id'))
        })

        navigator.clipboard.writeText(pathList.join(' '))
            .then(() => {
                console.log(pathList);
            }).catch(err => {
            console.error('Не удалось скопировать текст: ', err);
        });
    }

    highlighted(elements) {
        const el = elements[0]

        el.classList.toggle('block-highlighted')
        if (this.highlightedList.has(el.id)) {
            this.highlightedList.delete(el.id)
        } else {
            this.highlightedList.add(el.id)
        }
    }

    handleMouseOverEmpty(el) {
        const blockId = el.getAttribute('blockId')
        const parentId = el.getAttribute('parent')
        if (this.allBlocks.has(blockId)) {
            dispatch('update-block', {block: this.allBlocks.get(parentId)})
            return
        }
        this.api.getBlock(blockId)
            .then(res => {
                if (res.status === 200) {
                    Object.entries(res.data).forEach((entry) => {
                        this.allBlocks.set(entry[0], entry[1])
                    })
                    dispatch('update-block', {block: this.allBlocks.get(parentId)})
                }
            })
            .catch(err => {
                console.log(err)
            })
    }

    handleMouseOver(el) {
        this.currenActiveBlockEl = el

        if (this.currenActiveBlockEl !== null)
            this.currenActiveBlockEl.classList.add('block-active')
    }

    handleMouseOut(el) {
        if (this.currenActiveBlockEl !== null)
            this.currenActiveBlockEl.classList.remove('block-active')

        this.currenActiveBlockEl = null
    }

    _findParentWithAttribute(el, attributeName = 'blockId') {
        while (el && el !== document.documentElement) {
            if (el.hasAttribute(attributeName)) {
                return el;
            }
            el = el.parentElement;
        }
        return null; // Возвращает null, если элемент с заданным атрибутом не найден
    }

    _createDeleteMessage(elements) {
        if (elements.length === 1) {
            const block = this.allBlocks.get(elements[0].getAttribute('blockId'))
            return block.children.length ? `У блока ${block.children.length} детей.` : 'Удалить блок?'
        }
        if (elements.length > 1) {
            return `Удалить блоки ${elements.map(el => el.getAttribute('blockId'))} ?`
        }

    }
}