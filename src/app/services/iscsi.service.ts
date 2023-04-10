import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiExtent,
  IscsiInitiatorGroup,
  IscsiPortal,
  IscsiTarget,
} from 'app/interfaces/iscsi.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class IscsiService {
  constructor(protected ws: WebSocketService) {}

  getIpChoices(): Observable<Choices> {
    return this.ws.call('iscsi.portal.listen_ip_choices');
  }

  listPortals(): Observable<IscsiPortal[]> {
    return this.ws.call('iscsi.portal.query', []);
  }

  listInitiators(): Observable<IscsiInitiatorGroup[]> {
    return this.ws.call('iscsi.initiator.query', []);
  }

  getExtentDevices(): Observable<Choices> {
    return this.ws.call('iscsi.extent.disk_choices');
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

  getGlobalSessions(): Observable<IscsiGlobalSession[]> {
    return this.ws.call('iscsi.global.sessions');
  }
}
