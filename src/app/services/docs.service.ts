import urls from '../helptext/urls';
import { WebSocketService } from './ws.service';
import {Injectable} from '@angular/core';

@Injectable()
export class DocsService {

    constructor(public ws: WebSocketService) {  }

    docReplace(message):string {
        // I really hate this but for some reason # markers are getting a "\" appended to them by the translate service now 
        message = message.replace(/\\#/g, "#");

        for (const url in urls) {
            const replace = new RegExp("--" + url + "--", "g");
            message = message.replace(replace, urls[url]);
        }
        const running_version = window.localStorage.getItem('running_version');
        const web_version = "?runningversion=" + running_version;
        const version = running_version.split('-');
        version.shift();
        const doc_version = version.join('-');
        if (version && version.length > 1) {
            message = message.replace(/--version--/g, doc_version);
        }
        if (web_version) {
            message = message.replace(/--webversion--/g, web_version);
        }
        if (running_version) {
            message = message.replace(/--runningversion--/g, running_version);
        }

        const product_type = window.localStorage.getItem('product_type');
        message = message.replace(/--nas--/g, `truenas ${product_type}`);
        message = message.replace(/--NAS--/g, `TrueNAS ${product_type}`);

        return message;
    }
}