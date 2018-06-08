import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {RestService} from './rest.service'
import {WebSocketService} from './ws.service';

@Injectable()
export class NetworkService {

  public ipv4_regex = /^(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(.(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})){3}$/;
  public ipv6_regex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}$/i;

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getVlanNicChoices() {
    return this.ws.call('notifier.choices',
                        [ 'NICChoices', [ false, true, false ] ]);
  }

  getInterfaceNicChoices() {
    return this.ws.call('notifier.choices', [ 'NICChoices', [] ]);
  }

  getLaggNicChoices() {
    return this.ws.call('notifier.choices',
                        [ 'NICChoices', [ true, false, true ] ]);
  }

  getLaggProtocolTypes() {
    return this.ws.call('notifier.choices', [ 'LAGGType' ]);
  }

  getAllNicChoices() {
    return this.ws.call('notifier.choices',
                        [ 'NICChoices', [ false, false, true, false, false, true ] ]);
  }

  getV4Netmasks() {
    return Array(32).fill(0).map(
        (x, i) => { return {label : String(32 - i), value : String(32 - i)}; });
  }

  getV6PrefixLength() {
    return Array(33).fill(0).map(
        (x, i) => { return {label : String((32 - i) * 4), value : String((32 - i) * 4)}; });
  }
}