import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class IdmapService {
  constructor(protected api: ApiService) {}

  getCerts(): Observable<Certificate[]> {
    return this.api.call('certificate.query');
  }

  getBackendChoices(): Observable<IdmapBackendOptions> {
    return this.api.call('idmap.backend_options');
  }

  getActiveDirectoryStatus(): Observable<ActiveDirectoryConfig> {
    return this.api.call('activedirectory.config');
  }
}
