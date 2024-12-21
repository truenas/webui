import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  combineLatest, map, Observable,
  Subject,
} from 'rxjs';
import { LicenseFeature } from 'app/enums/license-feature.enum';
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
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class IscsiService {
  private refreshData$ = new Subject<void>();

  constructor(
    protected api: ApiService,
    private store$: Store<AppState>,
  ) {}

  listenForDataRefresh(): Observable<void> {
    return this.refreshData$;
  }

  refreshData(): void {
    this.refreshData$.next();
  }

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

  deleteTargetExtent(id: number): Observable<boolean> {
    return this.api.call('iscsi.targetextent.delete', [id]);
  }

  getAuth(): Observable<IscsiAuthAccess[]> {
    return this.api.call('iscsi.auth.query', []);
  }

  getGlobalSessions(): Observable<IscsiGlobalSession[]> {
    return this.api.call('iscsi.global.sessions');
  }

  hasFibreChannel(): Observable<boolean> {
    return combineLatest([
      this.store$.pipe(
        waitForSystemInfo,
        map((systemInfo) => systemInfo.license?.features?.includes(LicenseFeature.FibreChannel)),
      ),
      this.api.call('fc.capable'),
    ]).pipe(
      map(([hasFibreChannel, isFcCapable]) => hasFibreChannel && isFcCapable),
    );
  }
}
