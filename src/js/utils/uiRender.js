import blockCreator from './blockCreator';
import {dispatch} from "./functions";

class UiRender {

    constructor() {
        this.allBlocks = null
        window.addEventListener('update-block', (event) => {
            this.blockUpdate(event.detail.block)
        })
    }

    defaultMode(blocks, firstBlock) {
        this.allBlocks = blocks
        const blockElement = this.render(firstBlock, {parentId: 0})
        blockCreator.applyCssClasses()
        dispatch('block-element-updated', {elements: [blockElement]})
        return blockElement
    }

    /**
     * Обновляет элементы блока на странице
     * @param block из этого блока построится элемент
     */
    blockUpdate(block) {
        const copies = document.querySelectorAll(`[blockId="${block.id}"]`)
        const config = {}
        const newElements = []
        console.log(copies)

        copies.forEach(el => {
            const parentNode = el.parentNode
            const parent = this.allBlocks.get(parentNode.getAttribute('blockId'))

            if (parentNode.tagName !== 'SECTION') {
                config.color = parentNode.getAttribute('hsl').split(',').map(Number)
                config.parentId = parent.id
                config.blockPath = parentNode.getAttribute('id')
            } else {
                config.color = block.color
                config.parentId = 0
            }

            const newEl = this.render(block, config)

            if (parent) {
                newEl.classList.add(...parent.children_position[block.id])
            }
            parentNode.replaceChild(newEl, el)
            newElements.push(newEl)
        })
        dispatch('block-element-updated', {elements: newElements})

        blockCreator.applyCssClasses()
    }

    render(block, {
        maxDepth = 10,
        depth = 0,
        blockPath = null,
        color = 'default_color',
        parentId = 0,
        mode = 'default'
    }) {
        if (depth > maxDepth) {
            return;
        }
        const currentPath = blockPath ? `${blockPath},${block.id}` : `${block.id}`
        const [blockElem, nextColor] = blockCreator.createElem(block, currentPath, parentId, color, depth, mode);

        if (block.children) {
            const fragment = document.createDocumentFragment();

            block.children.forEach(childId => {
                const nextBlock = this.allBlocks.get(`${childId}`)
                let childBlock = null

                if (nextBlock) {
                    childBlock = this.render(
                        nextBlock,
                        {
                            maxDepth,
                            depth: depth + 1,
                            color: [...nextColor],
                            blockPath: currentPath,
                            parentId: block.id,
                            mode: mode
                        }
                    );
                }
                if (!childBlock) {
                    childBlock = blockCreator.createEmptyElem(
                        childId,
                        currentPath,
                        block.id,
                        [...nextColor],
                    )
                }

                fragment.appendChild(childBlock);
            });
            blockElem.appendChild(fragment);
        }
        return blockElem;
    }
}

const uiRender = new UiRender();
export default uiRender;
