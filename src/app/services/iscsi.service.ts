import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IscsiAuthAccess, IscsiExtent,
  IscsiInitiatorGroup,
  IscsiIpChoices,
  IscsiPortal,
  IscsiTarget,
} from 'app/interfaces/iscsi.interface';
import { WebSocketService } from './ws.service';

@Injectable()
export class IscsiService {
  protected volumeResource = 'storage/volume';

  constructor(protected ws: WebSocketService) {}

  getIpChoices(): Observable<IscsiIpChoices> {
    return this.ws.call('iscsi.portal.listen_ip_choices');
  }

  listPortals(): Observable<IscsiPortal[]> {
    return this.ws.call('iscsi.portal.query', []);
  }

  listInitiators(): Observable<IscsiInitiatorGroup[]> {
    return this.ws.call('iscsi.initiator.query', []);
  }

  getExtentDevices(): Observable<any[]> {
    return this.ws.call('iscsi.extent.disk_choices', []);
  }

  getExtents(): Observable<IscsiExtent[]> {
    return this.ws.call('iscsi.extent.query', []);
  }

  getTargets(): Observable<IscsiTarget[]> {
    return this.ws.call('iscsi.target.query', []);
  }

  getAuth(): Observable<IscsiAuthAccess[]> {
    return this.ws.call('iscsi.auth.query', []);
  }

  getGlobalSessions(): Observable<any[]> {
    return this.ws.call('iscsi.global.sessions');
  }
}
