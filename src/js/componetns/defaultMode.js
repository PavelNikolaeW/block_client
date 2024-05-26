import uiRender from '../utils/uiRender'
import api from './../utils/api'
import sizeManager from "../utils/sizeManager";
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
    }

    init() {
        window.addEventListener('block-element-updated', (e) => {
            this.blockInit = blockInit.setAllBlocks(this.allBlocks)
            this.setBlockAttribute(e.detail.elements)
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
                dispatch('block-element-updated', {elements: [blockElem]})
            }
        });
        window.addEventListener('keydown', (event) => {
            if (event.key && typeof(this[`handlePressKey${event.key.toUpperCase()}`]) === 'function' && this.currenActiveBlockEl) {
                const block = this.allBlocks.get(this.currenActiveBlockEl.getAttribute('blockId'))
                this[`handlePressKey${event.key.toUpperCase()}`](event, block)
            }
        });
    }

    setBlockAttribute(elements) {
        elements.forEach(el => {
            // const block = this.allBlocks.get(el.getAttribute('blockId'))
            this.blockInit.initBlockEl(el)
            // console.log(block.properties['js'])
            // console.log(block)
        })
    }

    handlePressKeyENTER(event, block) {
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
        this.$store.gdata.isOpenMde = true
        editorText.initMde(this.currenActiveBlockEl, block)
    }

    blockClick(e) {
        const action = this.$store.gdata.action
        const blockEl = this._findParentWithAttribute(e.target, 'blockId')

        if (action && this[action] !== undefined) {
            this[action](blockEl)
        } else {
            this.openBlockFullScreen(blockEl)
        }
        dispatch('reset-buttons')
    }

    openBlockFullScreen(blockEl) {
        const blockPath = blockEl.getAttribute('id')
        const currentOpened = document.getElementById(this.openedBlocks.at(-1))
        if (currentOpened) {
            currentOpened.classList.remove('block-full-screen')
            this.blockInit.initBlockEl(blockEl)
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

    addBlock(blockEl) {
        const block = this.allBlocks.get(blockEl.getAttribute('blockId'))
        api.createBlock().then(res => {
            if (res.status === 201) {
                const child = res.data
                block.children.push(child.id)
                // sizeManager.manager(block)
                child.paths = [blockEl.getAttribute('id') + ',' + child.id]
                this.allBlocks.set(`${child.id}`, child)
                api.setBlock(block.id, block)
            }
        }).catch(err => {
            console.log(err)
        })
    }

    removeBlock(blockEl) {
        if (blockEl.getAttribute('blockId') == this.rootId) {
            dispatch('open-popup', {
                'title': 'Этот блок удалить нельзя',
            })
            return
        }
        const block = this.allBlocks.get(blockEl.getAttribute('blockId'))
        const parent = this.allBlocks.get(blockEl.getAttribute('parent'))
        const message = block.children.length ? `У блока ${block.children.length} детей.` : 'Удалить блок?'
        const allBlocks = this.allBlocks

        const _removeBlock = async () => {
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

        }
        dispatch('open-popup', {
            'title': 'Подтвердите удаление блока',
            'message': message,
            onConfirm: _removeBlock
        })

    }

    copyLink(blockEl) {
        this.copylinkBlockId = parseInt(blockEl.getAttribute('blockId'))
    }

    pasteLink(blockEl) {
        const block = this.allBlocks.get(blockEl.getAttribute('blockId'))
        if (block) {
            if (block.children.includes(this.copylinkBlockId)) {
                // todo сделать подсказку в интерфейсе
                console.log('нельзя добавлять одинаковые блоки на один уровень')
            } else {
                block.children.push(this.copylinkBlockId)
                // sizeManager.manager(block)
                this.api.setBlock(block.id, block)

            }
        }
    }

    copyPath(blockEl) {
        const path = blockEl.getAttribute('id')
        navigator.clipboard.writeText(path).then(() => {
            console.log('Текст скопирован в буфер обмена');
        }).catch(err => {
            console.error('Не удалось скопировать текст: ', err);
        });
    }

    handleMouseOverEmpty(el) {
        const blockId = el.getAttribute('blockId')
        this.api.getBlock(blockId)
            .then(res => {
                if (res.status === 200) {
                    Object.entries(res.data).forEach((entry) => {
                        this.allBlocks.set(entry[0], entry[1])
                    })
                    dispatch('update-block', {block: this.allBlocks.get(blockId)})
                }
            })
            .catch(err => {
                console.log(err)
            })
    }

    handleMouseOver(el) {
        this.currenActiveBlockEl = el
        if (this.currenActiveBlockEl !== null)
            this.currenActiveBlockEl.classList.add('blockActive')
        if (this.currenActiveBlockEl.hasAttribute('incomplete')) {
            this.api.getBlock(this.currenActiveBlockEl.getAttribute('blockId'))
                .then(res => {
                    if (res.status === 200) {
                        dispatch('load-blocks', {blocks: res.data, triggerBlock: this.currenActiveBlockEl})
                        return res
                    }
                })
        }
    }

    handleMouseOut(el) {
        if (this.currenActiveBlockEl !== null)
            this.currenActiveBlockEl.classList.remove('blockActive')
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
}