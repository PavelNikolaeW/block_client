import cssConverter from './cssConverter'

class BlockCreator {
    constructor() {
        this.elements = new Map()
    }

    createElem(block, currentPath, parentId, color, depth, mode) {
        const blockElem = document.createElement("div");
        const nextColor = this.calculateColor(blockElem, block, color)

        blockElem.setAttribute('blockId', block.id)
        blockElem.setAttribute('id', currentPath)
        blockElem.setAttribute('parent', parentId)

        blockElem.setAttribute('x-on:mouseover.prevent.stop', 'handleMouseOver($el)')
        blockElem.setAttribute('x-on:mouseout.prevent.stop', 'handleMouseOut($el)')


        if (mode === 'default') {
            blockElem.setAttribute('x-on:click.prevent.stop', 'blockClick')
        }

        this.createContent(blockElem, block);

        blockElem.classList.add('block')

        return [blockElem, nextColor];
    }

    calculateColor(blockElem, block, color) {
        let hsl = []
        if (color === 'default_color' && block.color === 'default_color') {
            hsl = [210, 0, 50]
        } else if (block && block.color !== 'default_color' && block.color !== null) {
            hsl = block.color.split(',').map(n => parseInt(n))
        } else if (color !== 'default_color') {
            hsl = color
        }
        if (hsl[2] === 0 || hsl[2] === 100) {
            //     обрабатываем белый или черный цвет
        } else {
            if (hsl[1] === 100)
                hsl[1] = 0
            hsl[1] += 25
        }
        blockElem.setAttribute('hsl', `${hsl.join(',')}`)
        blockElem.style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`
        return hsl
    }

    createContent(blockElem, block) {
        const contentElem = document.createElement("div");

        contentElem.classList.add(...block.content_classList)
        cssConverter.generateStylesheet(block.content_classList)
        contentElem.innerHTML = `${block.text ? block.text : ''}`;
        blockElem.appendChild(contentElem)
        contentElem.setAttribute('contentBlock', '')
    }

    createEmptyElem(id, currentPath, parentId, color) {
        const blockEl = document.createElement('div')

        this.calculateColor(blockEl, null, color)

        blockEl.classList.add('block-ghost')
        blockEl.setAttribute('parent', parentId)
        blockEl.setAttribute('blockId', id)
        blockEl.setAttribute('id', currentPath)
        blockEl.setAttribute('x-on:mouseover.prevent.stop', 'handleMouseOverEmpty($el)')
        return blockEl
    }

    applyCssClasses() {
        cssConverter.applyCssClasses()
    }
}

const blockCreator = new BlockCreator()
export default blockCreator




