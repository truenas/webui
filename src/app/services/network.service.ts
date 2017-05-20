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
}