import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import {
  catchError, switchMap, tap,
} from 'rxjs/operators';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  PermissionsCardState,
} from 'app/pages/datasets/modules/permissions/interfaces/permissions-sidebar-state.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const initialState: PermissionsCardState = {
  isLoading: false,
  acl: null,
  stat: null,
};

@Injectable()
export class PermissionsCardStore extends ComponentStore<PermissionsCardState> {
  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
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
          this.api.call('filesystem.stat', [mountpoint]),
          this.api.call('filesystem.getacl', [mountpoint, true, true]),
        ]).pipe(
          tap(([stat, acl]) => {
            this.patchState({
              stat,
              acl,
              isLoading: false,
            });
          }),
          catchError((error: unknown) => {
            this.errorHandler.showErrorModal(error);

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
