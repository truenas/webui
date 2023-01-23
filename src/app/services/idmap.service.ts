import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { WebSocketService2 } from 'app/services/ws2.service';

@Injectable({ providedIn: 'root' })
export class IdmapService {
  constructor(protected ws: WebSocketService2) {}

  getCerts(): Observable<Certificate[]> {
    return this.ws.call('certificate.query');
  }

  getBackendChoices(): Observable<IdmapBackendOptions> {
    return this.ws.call('idmap.backend_options');
  }

  getActiveDirectoryStatus(): Observable<ActiveDirectoryConfig> {
    return this.ws.call('activedirectory.config');
  }
}
