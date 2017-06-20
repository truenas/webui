import { Injectable } from '@angular/core';

import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { RestService, WebSocketService } from '../services/';

@Injectable()
export class NetworkService {

    constructor(protected rest: RestService, protected ws: WebSocketService){
    };

    getVlanNicChoices() {
        return this.ws.call('notifier.choices', ['NICChoices', [false, true, false]]);
    }

    getInterfaceNicChoices() {
        return this.ws.call('notifier.choices', ['NICChoices', []]);
    }

    getAllNicChoices() {
        return this.ws.call('notifier.choices', ['NICChoices', [false, false, false]]);
    }

    getV4Netmasks() {
        return Array(32).fill(0).map((x, i) => { return { label: String(32 - i), value: String(32 - i) }; });
    }
}