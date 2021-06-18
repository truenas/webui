import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class IdmapService {
  constructor(protected ws: WebSocketService) {}

  getCerts(): Observable<Certificate[]> {
    return this.ws.call('certificate.query');
  }

  getBackendChoices(): Observable<any> {
    return this.ws.call('idmap.backend_options');
  }

  getADStatus(): Observable<ActiveDirectoryConfig> {
    return this.ws.call('activedirectory.config');
  }
}
