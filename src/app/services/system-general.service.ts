import { Injectable } from '@angular/core';

import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { RestService, WebSocketService } from '../services/';

@Injectable()
export class SystemGeneralService {

    constructor(protected rest: RestService, protected ws: WebSocketService){
    };

    getCA() {
        return this.ws.call('certificateauthority.query', []);
    }
}