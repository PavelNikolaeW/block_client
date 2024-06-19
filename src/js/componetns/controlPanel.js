import api from './../utils/api'
import {dispatch} from "../utils/functions";


export default class ControlPanel {
    constructor() {
        this.api = api
    }

    init() {
    }

    logout() {
        this.$store.gdata.isAuth = false
        this.api.logout()
    }

    pressButton(e) {
        const action = e.target.id
        if (this.$store.gdata.action === action) {
            this.$store.gdata.action = null
        } else {
            this.$store.gdata.action = action
        }
        dispatch('control-panel-pres-btn', {action: this.$store.gdata.action})
        dispatch('set-action', {action: this.$store.gdata.action})
    }

}