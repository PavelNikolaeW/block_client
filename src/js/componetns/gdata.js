import api from './../utils/api'
import Alpine from "alpinejs";


const gdata = {
    api: api,

    isAuth: null,

    // режим приложения (предполоагается сделать еще режим поиска)
    appMode: 'default',

    // открыт ли сейчас редактор текста
    isOpenMde: false,

    // Обозначает какое действие сейчас происходит
    action: null,

    async init() {
        await this._checkToken();
        window.addEventListener('set-action', (event) => {
            if (this.action !== event.detail.action)
                this.action = event.detail.action
        })
        window.addEventListener('reset-buttons', (e) => {
            this.action = null
        })
    },

    async _checkToken() {
        this.isAuth = await this.api.refreshToken()
    }
}

export default gdata