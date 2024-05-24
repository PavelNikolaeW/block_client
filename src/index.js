







import Alpine from 'alpinejs';
import intersect from '@alpinejs/intersect'

import App from './js/componetns/app';
import ControlPanel from "./js/componetns/controlPanel";
import DefaultMode from "./js/componetns/defaultMode";
import Auth from "./js/componetns/auth";
import Popup from "./js/componetns/popup";

import gdata from "./js/componetns/gdata";

import {dispatch} from "./js/utils/functions";

import './css/main.css'
import './css/popup.css'
import './css/easyMde.css'
import 'easymde/dist/easymde.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import grid from "./js/directives/grid";


Alpine.plugin(intersect)

const eventVars = ['isAuth']

Alpine.store('gdata', new Proxy(gdata, {
    set(target, key, value) {
        const oldValue = target[key];
        if (oldValue !== value) {
            target[key] = value;
        }
        if (eventVars.includes(key)) {
            dispatch(`gdata-${key}-changed`, {key, oldValue, newValue: value})
        }
        return true;
    }
}));


Alpine.data('App', () => new App());
Alpine.data('ControlPanel', () => new ControlPanel());
Alpine.data('DefaultMode', () => new DefaultMode());
Alpine.data('Auth', () => new Auth());
Alpine.data('Popup', () => new Popup());

Alpine.directive('grid', grid)

window.Alpine = Alpine;
Alpine.start();

