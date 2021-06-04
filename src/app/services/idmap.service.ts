import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { Certificate } from 'app/interfaces/certificate.interface';

import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class IdmapService {
  protected ad_idmap = 'directoryservice/idmap/ad';
  protected adex_idmap = 'directoryservice/idmap/adex';

  constructor(protected rest: RestService, protected ws: WebSocketService) {}

  getData(resource_name: string): void {
    return this.rest.get(resource_name, {});
  }

  getADIdmap(): void {
    // return this.rest.get(this.ad_idmap, {});
    return this.getData(this.ad_idmap);
  }

  getADEXIdmap(): void { return this.getData(this.adex_idmap); }

  getCerts(): Observable<Certificate[]> {
    return this.ws.call('certificate.query');
  }

  getBackendChoices(): Observable<any> {
    return this.ws.call('idmap.backend_options');
  }

  getADStatus(): Observable<any> {
    return this.ws.call('activedirectory.config');
  }
}
