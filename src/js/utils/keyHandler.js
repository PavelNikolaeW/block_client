import hotkeys from 'hotkeys-js';
import {dispatch} from "./functions";


const KEY_MAP = {
    A: 'addBlock',
    Ф: 'addBlock',
    D: 'removeBlock',
    В: 'removeBlock',
    C: 'copyLink',
    С: 'copyLink',
    P: 'pasteLink',
    З: 'pasteLink',
    M: 'moveBlock',
    Ь: 'moveBlock',
    B: 'back',
    И: 'back',
    ZOOMI: 'zoomIn',
    ZOOMO: 'zoomOut',
}

class KeyHandler {
    constructor() {
        this.isShiftPressed = false
        this.keyPressInterval

        this.zoomLevel = 100
        this.zoomScale = 50
    }

    init() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Shift' && !this.isShiftPressed) {
                this.handleShiftDown()
            } else if (event.key === 'Enter' && event.type === 'keydown') {
                dispatch('open-editor', {event})
            } else if (event.key === 'Escape' && event.type === 'keydown') {
                dispatch('close-editor')
            } else if (event.key === 'Backspace' && event.type === 'keydown') {
                dispatch('set-action', {action: 'removeBlock'})
                dispatch('control-panel-pres-btn', {action: 'removeBlock'})
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift' && this.isShiftPressed) {
                this.handleShiftUp()
            }
        });

        hotkeys('*', {'keyup': true, 'keydown': true}, (event, handler) => {
            const action = this._getAction(event.key)
            if (action === 'back' && event.type === 'keydown') {
                dispatch('open-previous-block')
            } else if (action && event.type === 'keydown') {
                dispatch('set-action', {action})
            } else if (action && event.type === 'keyup') {
                dispatch('set-action', {action: null})
            }
        });

        window.addEventListener('set-action', (event) => {
            const func = this[event.detail.action]

            if (func && typeof func === 'function') {
                func.bind(this)()
            }
            dispatch('reset-buttons')
        })
    }

    handleShiftDown(event, handler) {
        this.isShiftPressed = true;
        this.keyPressInterval = setInterval(() => {
            dispatch('set-action', {action: 'highlighted'})
        }, 100);
    }

    handleShiftUp(event, handler) {
        this.isShiftPressed = false;
        clearInterval(this.keyPressInterval);
        dispatch('set-action', {action: null})
    }


    zoomIn() {
        this.zoomLevel = this.zoomLevel + this.zoomScale
        this._setWidthAndHeight(this.zoomLevel)
        // dispatch('zoom-in', {zoomLevel: this.zoomLevel})
    }

    zoomOut() {
        this.zoomLevel = this.zoomLevel - this.zoomScale

        if (this.zoomLevel < 100) {
            this.zoomLevel = 100
        }
        this._setWidthAndHeight(this.zoomLevel)
        // dispatch('zoom-out', {zoomLevel: this.zoomLevel})
    }

    _setWidthAndHeight(zoomLevel) {
        const sectionEl = document.getElementById('default-section')
        sectionEl.style.width = `${zoomLevel}vw`
        sectionEl.style.height = `${zoomLevel}vh`
    }

    _getAction(key) {
        key = key
            .replace('+', 'ZOOMI')
            .replace('-', 'ZOOMO')
            .replace('_', 'ZOOMO')
            .toUpperCase()
        return KEY_MAP[key]
    }

}

const keyHandler = new KeyHandler();

export default keyHandler;
