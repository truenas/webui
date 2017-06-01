import { Injectable } from '@angular/core';

import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import { EntityUtils } from '../pages/common/entity/utils'
import { RestService, WebSocketService } from '../services/';

@Injectable()
export class IscsiService {

    constructor(protected rest: RestService, protected ws: WebSocketService){
    };

    getIpChoices() {
        return this.ws.call('notifier.choices', ['IPChoices', [true, false]]);
    };
}
