import api from './../utils/api'
import {dispatch} from "../utils/functions";


export default class ControlPanel {
    constructor() {
        this.api = api


        this.zoomLevel = 100
        this.zoomScale = 50
    }

    init() {
        this.sectionEl = document.getElementById('default-section')


        window.addEventListener('reset-buttons', (e) => {
            this.$store.gdata.action = null
        })

        window.addEventListener('control-panel-pres-btn', e => {
            const action = e.detail.action
            if (action && this[action]) {
                this[action]()
                dispatch('reset-buttons')            }
        })

    }

    logout() {
        this.$store.gdata.isAuth = false
        this.api.logout()
    }

    zoomIn() {
        this.zoomLevel = parseFloat((this.zoomLevel + this.zoomScale).toFixed(2))
        this._setWidthAndHeight(this.zoomLevel)
        dispatch('zoom-in', {zoomLevel: this.zoomLevel})
    }

    zoomOut() {
        this.zoomLevel = parseFloat((this.zoomLevel - this.zoomScale).toFixed(2))
        if (this.zoomLevel < 100) {
            this.zoomLevel = 100
        }
        this._setWidthAndHeight(this.zoomLevel)
        dispatch('zoom-Out', {zoomLevel: this.zoomLevel})
    }

    _setWidthAndHeight(zoomLevel) {
        this.sectionEl.style.width = `${zoomLevel}vw`
        this.sectionEl.style.height = `${zoomLevel}vh`
    }

    pressButton(e) {
        const action = e.target.id
        if (this.$store.gdata.action === action) {
            this.$store.gdata.action = null
        } else {
            this.$store.gdata.action = action
        }
        dispatch('control-panel-pres-btn', {action: action})
    }

}