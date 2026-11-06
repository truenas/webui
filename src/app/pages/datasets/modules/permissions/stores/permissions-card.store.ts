import { Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, forkJoin, pipe } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { Acl, toAcl } from 'app/interfaces/acl.interface';
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
export class PermissionsCardStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly acl = this.state.acl;
  readonly stat = this.state.stat;

  /** `null` clears; sharing one `switchMap` with loads lets a reset cancel a load still in flight. */
  private readonly load = rxMethod<string | null>(pipe(
    tap((mountpoint) => patchState(this.state, { ...initialState, isLoading: mountpoint !== null })),
    switchMap((mountpoint) => {
      if (mountpoint === null) {
        return EMPTY;
      }

      return forkJoin([
        this.api.call('filesystem.stat', [mountpoint]),
        this.api.call('filesystem.getacl', [mountpoint, true, true]).pipe(map(toAcl)),
      ]).pipe(
        tapResponse({
          next: ([stat, acl]) => {
            fillNfs4OwnerWho(acl);
            patchState(this.state, { stat, acl, isLoading: false });
          },
          error: (error: unknown) => {
            this.errorHandler.showErrorModal(error);
            patchState(this.state, { isLoading: false });
          },
        }),
      );
    }),
  ));

  loadPermissions(mountpoint: string): void {
    this.load(mountpoint);
  }

  /** Clears what was loaded, for a dataset whose permissions can't be read (locked, unmounted, no mountpoint). */
  reset(): void {
    this.load(null);
  }
}

/**
 * The middleware leaves `who` empty on NFSv4 owner@ and group@ entries; the card shows the owning uid and gid there.
 */
function fillNfs4OwnerWho(acl: Acl): void {
  if (!acl.acl || acl.acltype !== AclType.Nfs4) {
    return;
  }

  for (const entry of acl.acl) {
    if (entry.tag === NfsAclTag.Owner && entry.who === null) {
      entry.who = acl.uid.toString();
    }
    if ((entry.tag === NfsAclTag.Group || entry.tag === NfsAclTag.UserGroup) && entry.who === null) {
      entry.who = acl.gid.toString();
    }
  }
}
