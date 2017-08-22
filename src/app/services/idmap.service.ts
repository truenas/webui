import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService, WebSocketService} from '../services/';

@Injectable()
export class IdmapService {
  protected ad_idmap: string = 'directoryservice/idmap/ad';
  protected adex_idmap: string = 'directoryservice/idmap/adex';

  constructor(protected rest: RestService) {};

  getData(resource_name) { return this.rest.get(resource_name, {}); }

  getADIdmap() {
    // return this.rest.get(this.ad_idmap, {});
    return this.getData(this.ad_idmap);
  }

  getADEXIdmap() { return this.getData(this.adex_idmap); }
}