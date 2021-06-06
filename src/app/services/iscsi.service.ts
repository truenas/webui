import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IscsiAuthAccess, IscsiExtent,
  IscsiInitiatorGroup,
  IscsiIpChoices,
  IscsiPortal,
  IscsiTarget,
} from 'app/interfaces/iscsi.interface';
import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class IscsiService {
  protected volumeResource = 'storage/volume';

  constructor(protected rest: RestService, protected ws: WebSocketService) {}

  getIpChoices(): Observable<IscsiIpChoices> {
    return this.ws.call('iscsi.portal.listen_ip_choices');
  }

  listPortals(): Observable<IscsiPortal[]> {
    return this.ws.call('iscsi.portal.query', []);
  }

  listInitiators(): Observable<IscsiInitiatorGroup[]> {
    return this.ws.call('iscsi.initiator.query', []);
  }

  getVolumes(): void {
    return this.rest.get(this.volumeResource, {});
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
