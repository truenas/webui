import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import {
  catchError, switchMap, tap,
} from 'rxjs/operators';
import { EntityUtils } from 'app/modules/entity/utils';
import { PermissionsSidebarState } from 'app/pages/storage/volumes/permissions/interfaces/permissions-sidebar-state.interface';
import { DialogService, WebSocketService } from 'app/services';

const initialState: PermissionsSidebarState = {
  isLoading: false,
  acl: null,
  stat: null,
};

@Injectable()
export class PermissionsSidebarStore extends ComponentStore<PermissionsSidebarState> {
  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
  ) {
    super(initialState);
  }

  readonly loadPermissions = this.effect((mountpoints$: Observable<string>) => {
    return mountpoints$.pipe(
      tap(() => {
        this.setState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap((mountpoint) => {
        return forkJoin([
          this.ws.call('filesystem.stat', [mountpoint]),
          this.ws.call('filesystem.getacl', [mountpoint, false, true]),
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
        );
      }),
    );
  });
}
