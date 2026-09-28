import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject, distinctUntilChanged, filter, map, Observable,
} from 'rxjs';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiExtent,
  IscsiInitiatorGroup,
  IscsiPortal,
  IscsiTarget,
  IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { AppState } from 'app/store';

@Injectable({
  providedIn: 'root',
})
export class IscsiService {
  protected api = inject(TypedApiService);
  protected auth = inject(AuthService);
  private store$ = inject<Store<AppState>>(Store);

  private refreshData$ = new BehaviorSubject<IscsiTarget | null>(null);

  listenForDataRefresh(): Observable<IscsiTarget | null> {
    return this.refreshData$.pipe(distinctUntilChanged(), filter(Boolean));
  }

  refreshData(target?: IscsiTarget): void {
    this.refreshData$.next(target || null);
  }

  getIpChoices(): Observable<Choices> {
    return this.api.call('iscsi.portal.listen_ip_choices');
  }

  listPortals(): Observable<IscsiPortal[]> {
    return this.api.query('iscsi.portal.query');
  }

  getInitiators(): Observable<IscsiInitiatorGroup[]> {
    return this.api.query('iscsi.initiator.query');
  }

  getExtentDevices(): Observable<Choices> {
    return this.api.call('iscsi.extent.disk_choices');
  }

  getExtents(): Observable<IscsiExtent[]> {
    return this.api.query('iscsi.extent.query').pipe(
      // Middleware types `type` and `rpm` as literals and `filesize` as a number or string; the UI narrows them.
      map((extents) => extents as IscsiExtent[]),
    );
  }

  getTargets(): Observable<IscsiTarget[]> {
    return this.api.query('iscsi.target.query').pipe(
      // Middleware types `mode` and each group's `authmethod` as literals; the UI narrows them to its enums.
      map((targets) => targets as IscsiTarget[]),
    );
  }

  getTargetExtents(): Observable<IscsiTargetExtent[]> {
    return this.api.query('iscsi.targetextent.query');
  }

  deleteTargetExtent(id: number): Observable<boolean> {
    return this.api.call('iscsi.targetextent.delete', [id]);
  }

  getAuth(): Observable<IscsiAuthAccess[]> {
    return this.api.query('iscsi.auth.query').pipe(
      // Middleware types `discovery_auth` as a literal; the UI narrows it to its enum.
      map((credentials) => credentials as IscsiAuthAccess[]),
    );
  }

  getGlobalSessions(): Observable<IscsiGlobalSession[]> {
    return this.api.query('iscsi.global.sessions');
  }
}
