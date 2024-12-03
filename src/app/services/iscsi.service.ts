import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiExtent,
  IscsiInitiatorGroup,
  IscsiPortal,
  IscsiTarget,
  IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { ApiService } from 'app/services/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class IscsiService {
  constructor(protected api: ApiService) {}

  getIpChoices(): Observable<Choices> {
    return this.api.call('iscsi.portal.listen_ip_choices');
  }

  listPortals(): Observable<IscsiPortal[]> {
    return this.api.call('iscsi.portal.query', []);
  }

  getInitiators(): Observable<IscsiInitiatorGroup[]> {
    return this.api.call('iscsi.initiator.query', []);
  }

  getExtentDevices(): Observable<Choices> {
    return this.api.call('iscsi.extent.disk_choices');
  }

  getExtents(): Observable<IscsiExtent[]> {
    return this.api.call('iscsi.extent.query', []);
  }

  getTargets(): Observable<IscsiTarget[]> {
    return this.api.call('iscsi.target.query', []);
  }

  getTargetExtents(): Observable<IscsiTargetExtent[]> {
    return this.api.call('iscsi.targetextent.query', []);
  }

  getAuth(): Observable<IscsiAuthAccess[]> {
    return this.api.call('iscsi.auth.query', []);
  }

  getGlobalSessions(): Observable<IscsiGlobalSession[]> {
    return this.api.call('iscsi.global.sessions');
  }

  hasFibreChannel(): Observable<boolean> {
    return this.api.call('fc.capable');
  }
}
