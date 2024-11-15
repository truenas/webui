import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { ApiService } from 'app/services/api.service';

@Injectable({ providedIn: 'root' })
export class IdmapService {
  constructor(protected ws: ApiService) {}

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
