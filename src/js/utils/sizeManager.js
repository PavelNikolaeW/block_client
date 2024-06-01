import {findLCM, findNearestRoots} from './functions'
import gridSpaceChecker from "./gridSpaceChecker";

class SizeManager {

    manager(aspectRatio, block) {
        // const freeSpace = gridSpaceChecker.checkBlockSpace(block)
        if (typeof this[block.layout] === 'function' )
            this.schema = this.calcScheme(aspectRatio)
            // console.log(this.schema, aspectRatio)
            this[block.layout](block)
    }

    calcScheme(aspectRatio) {
        if (0.8 <= aspectRatio && aspectRatio <= 1.2) { // почти квадрат
            return 'square'
        } else if (1.2 < aspectRatio && aspectRatio <= 2) { // немного вытянутый по горизонтали
            return  'horizontal'
        } else if (0.5 <= aspectRatio && aspectRatio < 0.8) { // немного вытянутый по вертикали
            return 'vertical'
        } else if (aspectRatio > 2) {  // сильно вытянутый по горизонтали
            return 'horizontalLong'
        } else if (aspectRatio < 0.5) { // сильно вытянутый по вертикали
            return 'verticalLong'
        }
    }


    custom(block) {
        const gridSize = Math.ceil(Math.sqrt(block.children.length))
        this._setBlockGrid(block, gridSize, gridSize)
        this._setContentPosition(block, gridSize, gridSize)
    }

    default(block) {
        if (this.schema === 'horizontal' || this.schema === 'square') {
            const [row, col] = this._calculateBlocksLayout(block.children.length) // без учета контента
            // console.log(row, col, block.id)
            this._setBlockGrid(block, row, col)
            this._setChildrenPosition(block, row, col)
            this._setContentPosition(block, row, col)
        } else if (this.schema  === 'verticalLong' || this.schema  === 'vertical' ) {
            this.vertical(block)
        } else if (this.schema === 'horizontalLong') {
            this.horizontal(block)
        } else if (this.schema === 'square') {
            console.log('todo square')
        }
    }

    horizontal(block) {
        const col = block.children.length
        this._setBlockGrid(block, 1, col)
        this._setContentPosition(block, 1, col)

        for (let i = 0; i < col; i++) {
            const id = block.children[i]
            block.children_position[id] = [
                `grid-column_span`,
                `grid_row_2`
            ]
        }
    }

    vertical(block) {
        const row = block.children.length
        this._setBlockGrid(block, row, 1)
        this._setContentPosition(block, row, 1)

        let rowCounter = 2
        for (let i = 0; i < row; i++) {
            const id = block.children[i]
            block.children_position[id] = [
                `grid-column_1`,
                `grid-row_${rowCounter++}`
            ]
        }
    }

    table(block) {
        const gridSize = Math.ceil(Math.sqrt(block.children.length))
        this._setBlockGrid(block, gridSize, gridSize)
        this._setContentPosition(block, gridSize, gridSize)

        let childIndex = 0;
        let currentRow = 2; // Инициализация счетчика строк, начиная со второй строки

        // Переменная для определения количества колонок, занимаемых каждым дочерним элементом
        const columnsPerChild = 1;

        // Итерация по каждой позиции дочернего элемента в объекте
        for (let i = 0; i < block.children.length; i++) {
            const id = block.children[i]
            // Проверка, нужно ли переходить на новую строку
            if (childIndex !== 0 && childIndex % gridSize === 0) {
                currentRow++;
                childIndex = 0;
            }

            // Вычисление начальной и конечной колонок для текущего дочернего элемента
            let startCol = childIndex * columnsPerChild + 1;
            let endCol = startCol + columnsPerChild;

            // Назначение стилей сетки для дочернего элемента
            block.childrenPosition[id] = {
                'grid': {
                    'column': `${startCol}/${endCol}`,
                    'row': `${currentRow}`
                }
            }
            childIndex++;
        }
    }

    _setContentPosition(block, row, col) {
        block.content_classList = block.content_classList.map(className => {
            if (className.startsWith('grid-column')) {
                return `grid-column_1_sl_${col + 1}`
            } else if (className.startsWith('grid-row')) {
                return `grid-row_auto`
            }
            return className
        })
    }

    _setBlockGrid(block, row, col) {

        block.classList = block.classList.map(className => {
            if (className.startsWith('grid-template-columns')) {
                return `grid-template-columns_${'1fr__'.repeat(Math.max(col, 1))}`
            } else if (className.startsWith('grid-template-rows')) {
                return `grid-template-rows_auto__${'1fr__'.repeat(row)}`
            }
            return className
        })
    }

    /**
     * Распределяет дочерние элементы блока по сетке, основываясь на заданном количестве строк и колонок.
     *
     * @param {Object} block - объект блока, содержащий дочерние элементы.
     * @param {number} row - количество строк, на которые нужно распределить элементы.
     * @param {number} col - общее количество колонок в сетке.
     */
    _setChildrenPosition(block, row, col) {
        // Общее количество дочерних элементов
        const totalChildren = block.children.length;
        // Максимальное количество блоков в одной строке
        const maxBlocksInRow = Math.ceil(totalChildren / row);
        // Минимальное количество блоков в последней строке
        const minBlocksInRow = totalChildren - (maxBlocksInRow * (row - 1));

        let childIndex = 0;
        let currentRow = 2; // Начинаем со второй строки, так как первая занята текстовым контентом
        row++;
        for (let i = 0; i < totalChildren; i++) {
            const id = block.children[i]
            if (childIndex !== 0 && childIndex % maxBlocksInRow === 0) {
                currentRow++; // Переход на новую строку
                childIndex = 0; // Сброс счетчика блоков в текущей строке
            }

            let columnsPerChild;
            if (currentRow < row) {
                // Определение количества колонок на блок в обычных строках
                columnsPerChild = Math.floor(col / maxBlocksInRow);
            } else {
                // Определение количества колонок на блок в последней строке
                columnsPerChild = Math.floor(col / minBlocksInRow);
            }

            // Начальная и конечная колонки для текущего дочернего элемента
            let startCol = childIndex * columnsPerChild + 1;
            let endCol = startCol + columnsPerChild;

            // Назначение дочернему элементу места в сетке
            if (!Array.isArray(block.children_position[id])) {
                block.children_position[id] = ['grid-column', 'grid-row']
            }
            block.children_position[id] = block.children_position[id].map(classNmae => {
                if (classNmae.startsWith('grid-column')) {
                    return `grid-column_${startCol}__${endCol}`;
                } else if (classNmae.startsWith('grid-row')) {
                    return `grid-row_${currentRow}`;
                }
                return classNmae;
            })

            childIndex++; // Инкремент индекса в текущей строке
        }
    }

    /**
     * Вычисляет расположение блоков для заданного числа,
     * @param {number} number - Количество блоков для расчета расположения блоков.
     * @returns {Array} Массив, содержащий размеры для ряда и столбца.
     */
    _calculateBlocksLayout(number) {
        let [row, col] = findNearestRoots(number);
        if (row * col === number) {
            return [row, col];
        }

        const blocksInRow = number / row;
        const maxBlocksInRow = Math.ceil(blocksInRow);
        const minBlocksInRow = number - ((row - 1) * maxBlocksInRow);

        const lcm = findLCM(minBlocksInRow, maxBlocksInRow); // Находим НОК для minBlocksInRow и maxBlocksInRow

        col = Math.max(col, lcm); // Начинаем с максимального из col или lcm

        // Используем НОК для определения подходящего col
        while (col % minBlocksInRow !== 0 || col % maxBlocksInRow !== 0) {
            col += lcm; // Увеличиваем col на НОК, гарантируя, что новое значение будет кратно обоим числам
        }

        return [row, col];
    }
}

const sizeManager = new SizeManager()

export default sizeManager
