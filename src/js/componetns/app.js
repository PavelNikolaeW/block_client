import api from './../utils/api'
import {dispatch} from "../utils/functions";
import editorText from "../utils/editorText";

export default class App {
    constructor() {
        this.api = api
        this.mode = 'default'
        this.bloks = null
        this.firstBlock = null


    }

    init() {
        window.addEventListener('gdata-isAuth-changed', () => {
            this._initData()
        })
    }

    _initData() {
        this.api.getRootBlock()
            .then(res => {
                if (res.status < 400) {
                    this.bloks = new Map(Object.entries(res.data))
                    this.firstBlock = this.bloks.entries().next().value[1]
                        dispatch('blocks-loaded', {
                        blocks: this.bloks,
                        firstBlock: this.firstBlock
                    })
                }
            })
            .catch(err => {
                console.log(err)
            })
    }

    closeEditor(e) {
        editorText.closeEditor()
        this.$store.gdata.isOpenMde = false
        console.log(e)
    }

}
