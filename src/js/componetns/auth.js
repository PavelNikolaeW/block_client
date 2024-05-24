import api from './../utils/api'
import Cookies from 'js-cookie';

export default class Auth {
    constructor() {
        this.api = api
        // this.isAuth = false
        this.isRegister = false
        this.username = ''
        this.password = ''
        this.passwordConfirm = ''
        this.email = ''
    }

    init() {
    }

    async login() {
        const isLogin = await this.api.login({
            'username': this.username,
            'password': this.password
        })
        if (isLogin) {
            this.$store.gdata.isAuth = true
            this.username = ''
            this.password = ''
        } else {
            this.$store.gdata.isAuth = false
        }

    }

    register() {
        if (!this.isRegister) {
            this.isRegister = true
        } else {
            console.log('reg')
            this.isRegister = false
        }
    }
}
