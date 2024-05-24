import {logPlugin} from "@babel/preset-env/lib/debug";

export default class Popup {
    constructor() {
        this.isOpen = false;
        this.title = '';
        this.message = '';
        this.confirmCallback = null;
    }

    init() {
        // устанавливает слушатели в init бля того что бы контекст выполнения уже был обернут в Proxy
        window.addEventListener('open-popup', event => {
            this.open(event.detail);
        });
    }

    open(config) {
        this.title = config.title || 'Подтверждение';
        this.message = config.message;
        this.confirmCallback = config.onConfirm
        this.isOpen = true;
    }

    close() {
        this.isOpen = false;
        this.title = '';
        this.message = '';
        this.confirmCallback = null;
    }

    confirmAction() {
        if (typeof this.confirmCallback === 'function') {
            this.confirmCallback();
        }
        this.close();
    }
}

