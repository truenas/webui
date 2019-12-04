import {Injectable} from '@angular/core';

import {WebSocketService} from './ws.service';

@Injectable({providedIn: 'root'})
export class DirservicesService {
  constructor(protected ws: WebSocketService, protected dirServices: DirservicesService) {};
  
  refreshDirServicesCache() {
    return this.ws.call('directoryservices.cache_refresh');
  }
}