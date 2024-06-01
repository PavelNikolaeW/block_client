import cssConverter from "./cssConverter";
import sizeManager from "./sizeManager";

/**
 * Класс для инициализации блоков
 */
class BlockInit {
    constructor() {
        this.allBlocks = {}
    }

    setAllBlocks(allBlocks) {
        this.allBlocks = allBlocks
        return this
    }

    initBlockEl(el, parent = null) {
        const block = this.allBlocks.get(el.getAttribute('blockid'))
        const content = el.querySelector('[contentblock]')

        if (!block || !el) {
            return
        }
        if (!parent) {
            parent = this.allBlocks.get(el.getAttribute('parent'))
        }
        this._removeGridClass(el)

        if (parent && parent.children_position[block.id]) {
            // todo у блока родителя может быть разное соотношение сторон, а мы храним один вариант
            el.classList.add(...parent.children_position[block.id])
            cssConverter.generateStylesheet(parent.children_position[block.id])
        }

        requestAnimationFrame(() => {
            sizeManager.manager(el.offsetWidth / el.offsetHeight, block)

            if (content !== null) {
                this._removeGridClass(content)
                content.classList.add(...block.content_classList)
                cssConverter.generateStylesheet(block.content_classList)
            }

            el.classList.add(...block.classList)
            cssConverter.generateStylesheet(block.classList)
            cssConverter.applyCssClasses()
            el.childNodes.forEach(child => {
                if (child.hasAttribute('blockId')) {
                    this.initBlockEl(child, block)
                }
            })
        })
    }

    _removeGridClass(el) {
        const classes = []
        el.classList.forEach(cl => {
            if (cl.includes('grid')) {
                classes.push(cl)
            }
        })
        el.classList.remove(...classes)
    }
}

const blockInit = new BlockInit();

export default blockInit