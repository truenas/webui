
import urls from '../helptext/urls';
import { WebSocketService } from './ws.service';
import {Injectable} from '@angular/core';

@Injectable()
export class DocsService {

    constructor(public ws: WebSocketService) {  }

    docReplace(message):string {
        for (const url in urls) {
            const replace = new RegExp("%%" + url + "%%", "g");
            message = message.replace(replace, urls[url]);
        }

        // running_version is expected to be in the form FreeNAS-11.2-U4-INTERNAL7
        const running_version = window.localStorage.getItem('running_version');

        // split on dashes, rejoin version number and patch level number with dash
        // result is 11.2-U4
        const version = running_version.split('-').slice(1,3).join('-');

        if (version && version.length > 1) {
            message = message.replace(/%%version%%/g, version);
        }

        return message;
    }
}
