

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject, Subscription} from 'rxjs';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

@Injectable({providedIn: 'root'})
export class IdmapService {
  protected ad_idmap: string = 'directoryservice/idmap/ad';
  protected adex_idmap: string = 'directoryservice/idmap/adex';

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getData(resource_name) { return this.rest.get(resource_name, {}); }

  getADIdmap() {
    // return this.rest.get(this.ad_idmap, {});
    return this.getData(this.ad_idmap);
  }

  getADEXIdmap() { return this.getData(this.adex_idmap); }

  getCerts() {
    return this.ws.call('certificate.query');
  }

  getBackendChoices() {
    return this.ws.call('idmap.backend_options');
  }

  getADStatus() {
    return this.ws.call('activedirectory.config');
  }
 




}