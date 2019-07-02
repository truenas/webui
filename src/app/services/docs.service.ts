import urls from '../helptext/urls';
import { WebSocketService } from './ws.service';
import {Injectable} from '@angular/core';

@Injectable()
export class DocsService {

    constructor(public ws: WebSocketService) {  }

    docReplace(message):string {
        for (const url in urls) {
            const replace = new RegExp("--" + url + "--", "g");
            message = message.replace(replace, urls[url]);
        }
        const running_version = window.localStorage.getItem('running_version');
        const web_version = "?runningversion=" + running_version;
        const version = running_version.split('-');
        if (version && version.length > 1) {
            message = message.replace(/--version--/g, version[1]);
        }
        if (web_version) {
            message = message.replace(/--webversion--/g, web_version);
        }
        if (running_version) {
            message = message.replace(/--runningversion--/g, running_version);
        }

        return message;
    }
}