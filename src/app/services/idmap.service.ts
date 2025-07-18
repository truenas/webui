import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class IdmapService {
  constructor(protected api: ApiService) {}

  getCerts(): Observable<Certificate[]> {
    return this.api.call('certificate.query');
  }

  getDirectoryServicesConfig(): Observable<DirectoryServicesConfig> {
    return this.api.call('directoryservices.config');
  }
}
