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
        console.log(el)
        const block = this.allBlocks.get(el.getAttribute('blockid'))
        if (!block) {
            return
        }
        if (!parent)
            parent = this.allBlocks.get(el.getAttribute('parent'))

        this._removeGridClass(el)


        sizeManager.manager(el.offsetWidth / el.offsetHeight, block)
        el.classList.add(...block.classList)
        cssConverter.generateStylesheet(block.classList)
        if (parent && parent.children_position[block.id]) {
            el.classList.add(...parent.children_position[block.id])
            cssConverter.generateStylesheet(parent.children_position[block.id])
        }

        el.childNodes.forEach(child => {
            if (child.hasAttribute('blockId')) {
                this.initBlockEl(child, block)
            }
        })
        cssConverter.applyCssClasses()
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