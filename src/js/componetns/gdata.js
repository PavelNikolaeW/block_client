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
    },

    async _checkToken () {
        this.isAuth = await this.api.refreshToken()
    }
}

export default gdata