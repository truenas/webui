import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import {
  catchError, switchMap, takeUntil, tap,
} from 'rxjs/operators';
import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { PermissionsSidebarState } from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permissions-sidebar-state.interface';
import { DialogService, WebSocketService } from 'app/services';

const initialState: PermissionsSidebarState = {
  isLoading: false,
  acl: null,
  stat: null,
};

@Injectable()
export class PermissionsSidebarStore extends ComponentStore<PermissionsSidebarState> {
  isLoading$: Observable<boolean> = this.select((state) => state.isLoading);
  acl$: Observable<Acl> = this.select((state) => state.acl);
  stat$: Observable<FileSystemStat> = this.select((state) => state.stat);

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
  ) {
    super(initialState);
  }

  readonly loadPermissions = this.effect((mountpoints$: Observable<string>) => {
    this.setState({
      ...initialState,
      isLoading: true,
    });

    return mountpoints$.pipe(
      switchMap((mountpoint) => {
        return forkJoin([
          this.ws.call('filesystem.stat', [mountpoint]),
          this.ws.call('filesystem.getacl', [mountpoint]),
        ]).pipe(
          tap(([stat, acl]) => {
            this.patchState({
              stat,
              acl,
              isLoading: false,
            });
          }),
          catchError((error) => {
            new EntityUtils().errorReport(error, this.dialog);

            this.patchState({
              isLoading: false,
            });

            return EMPTY;
          }),
          takeUntil(this.destroy$),
        );
      }),
    );
  });
}
