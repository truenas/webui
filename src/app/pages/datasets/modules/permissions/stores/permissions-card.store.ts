import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, forkJoin, Observable } from 'rxjs';
import {
  catchError, switchMap, tap,
} from 'rxjs/operators';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  PermissionsCardState,
} from 'app/pages/datasets/modules/permissions/interfaces/permissions-sidebar-state.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

const initialState: PermissionsCardState = {
  isLoading: false,
  acl: null,
  stat: null,
};

@Injectable()
export class PermissionsCardStore extends ComponentStore<PermissionsCardState> {
  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
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
          catchError((error: WebsocketError) => {
            this.dialogService.error(this.errorHandler.parseWsError(error));

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
