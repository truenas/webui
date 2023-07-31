import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import * as _ from 'lodash';
import { omit } from 'lodash';
import {
  EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, filter, map, switchMap, takeUntil, tap, withLatestFrom,
} from 'rxjs/operators';
import { AclType, DefaultAclType } from 'app/enums/acl-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import {
  Acl, AclTemplateByPath, NfsAclItem, PosixAclItem, SetAcl,
} from 'app/interfaces/acl.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import {
  AclSaveFormParams,
  DatasetAclEditorState,
} from 'app/pages/datasets/modules/permissions/interfaces/dataset-acl-editor-state.interface';
import { newNfsAce, newPosixAce } from 'app/pages/datasets/modules/permissions/utils/new-ace.utils';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

const initialState: DatasetAclEditorState = {
  isLoading: false,
  isSaving: false,
  mountpoint: null,
  acl: null,
  stat: null,
  selectedAceIndex: 0,
  acesWithError: [],
};

@Injectable()
export class DatasetAclEditorStore extends ComponentStore<DatasetAclEditorState> {
  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private router: Router,
    private storageService: StorageService,
    private userService: UserService,
  ) {
    super(initialState);
  }

  readonly loadAcl = this.effect((mountpoints$: Observable<string>) => {
    return mountpoints$.pipe(
      tap((mountpoint) => {
        this.setState({
          ...initialState,
          mountpoint,
          isLoading: true,
        });
      }),
      switchMap((mountpoint) => {
        return forkJoin([
          this.ws.call('filesystem.getacl', [mountpoint, true, true]),
          this.ws.call('filesystem.stat', [mountpoint]),
        ]).pipe(
          tap(([acl, stat]) => {
            this.patchState({
              acl,
              stat,
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

  readonly removeAce = this.updater((state: DatasetAclEditorState, indexToRemove: number) => {
    let selectedAceIndex = state.selectedAceIndex;

    if (selectedAceIndex >= indexToRemove) {
      selectedAceIndex = Math.max(0, selectedAceIndex - 1);
    }

    const newAcesWithError = _.without(state.acesWithError, indexToRemove).map((aceWithErrorIndex) => {
      if (aceWithErrorIndex <= indexToRemove) {
        return aceWithErrorIndex;
      }

      return aceWithErrorIndex - 1;
    });

    return {
      ...state,
      selectedAceIndex,
      acl: {
        ...state.acl,
        acl: (state.acl.acl as (NfsAclItem | PosixAclItem)[]).filter((ace, index) => index !== indexToRemove),
      },
      acesWithError: newAcesWithError,
    } as DatasetAclEditorState;
  });

  readonly addAce = this.updater((state) => {
    const newAce = state.acl.acltype === AclType.Nfs4
      ? { ...newNfsAce } as NfsAclItem
      : { ...newPosixAce } as PosixAclItem;

    return {
      ...state,
      acl: {
        ...state.acl,
        acl: (state.acl.acl as (NfsAclItem | PosixAclItem)[]).concat(newAce),
      },
      selectedAceIndex: state.acl.acl.length,
    } as DatasetAclEditorState;
  });

  readonly selectAce = this.updater((state: DatasetAclEditorState, index: number) => {
    return {
      ...state,
      selectedAceIndex: index,
    };
  });

  readonly updateSelectedAce = this.updater((
    state: DatasetAclEditorState, updatedAce: NfsAclItem | PosixAclItem,
  ) => {
    const updatedAces = (state.acl.acl as (NfsAclItem | PosixAclItem)[]).map((ace, index) => {
      if (index !== state.selectedAceIndex) {
        return ace;
      }

      return {
        ...ace,
        ...updatedAce,
      };
    });

    return {
      ...state,
      acl: {
        ...state.acl,
        acl: updatedAces,
      } as Acl,
    };
  });

  readonly updateSelectedAceValidation = this.updater((state: DatasetAclEditorState, isValid: boolean) => {
    return {
      ...state,
      acesWithError: isValid
        ? _.without(state.acesWithError, state.selectedAceIndex)
        : _.union(state.acesWithError, [state.selectedAceIndex]),
    };
  });

  readonly saveAcl = this.effect((saveParams$: Observable<AclSaveFormParams>) => {
    return saveParams$.pipe(
      // Warn user about risks when changing top level dataset
      switchMap(() => {
        if (this.storageService.isDatasetTopLevel(this.get().mountpoint.replace('mnt/', ''))) {
          return this.dialogService.confirm({
            title: helptext.dataset_acl_dialog_warning,
            message: helptext.dataset_acl_toplevel_dialog_message,
          });
        }

        return of(true);
      }),
      filter(Boolean),

      // Prepare request
      withLatestFrom(saveParams$),
      switchMap(([, saveParams]) => this.prepareSetAcl(this.get(), saveParams)),

      // Save
      tap((setAcl: SetAcl) => {
        const dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: helptext.save_dialog.title } });
        dialogRef.componentInstance.setDescription(helptext.save_dialog.message);

        dialogRef.componentInstance.setCall('filesystem.setacl', [setAcl]);
        dialogRef.componentInstance.success.pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            const ngUrl = ['datasets', this.get()?.mountpoint.replace(`${mntPath}/`, '')];
            dialogRef.close();
            this.router.navigate(ngUrl);
          },
          error: (error: WebsocketError | Job) => {
            dialogRef.close();
            this.dialogService.error(this.errorHandler.parseError(error));
          },
        });
        dialogRef.componentInstance.failure.pipe(takeUntil(this.destroy$)).subscribe({
          next: (failedJob) => {
            dialogRef.close();
            this.dialogService.error(this.errorHandler.parseJobError(failedJob));
          },
          error: (error: WebsocketError | Job) => {
            dialogRef.close();
            this.dialogService.error(this.errorHandler.parseError(error));
          },
        });
        dialogRef.componentInstance.submit();
      }),
    );
  });

  readonly usePreset = this.updater((state: DatasetAclEditorState, preset: AclTemplateByPath) => {
    return {
      ...state,
      acl: {
        ...state.acl,
        acl: preset.acl,
      } as Acl,
      isLoading: false,
      acesWithError: [],
      selectedAceIndex: 0,
    };
  });

  readonly loadHomeSharePreset = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      tap(() => {
        this.patchState({
          isLoading: true,
        });
      }),
      switchMap(() => {
        return this.ws.call('filesystem.acltemplate.by_path', [{
          path: this.get().mountpoint,
          'format-options': {
            ensure_builtins: true,
            resolve_names: true,
          },
        }]).pipe(
          tap((presets) => {
            this.patchState({
              isLoading: false,
            });
            const homePresetName = this.get().acl.acltype === AclType.Nfs4
              ? DefaultAclType.Nfs4Home
              : DefaultAclType.PosixHome;

            const homePreset = presets.find((preset) => preset.name === homePresetName);
            if (!homePreset) {
              console.error(`Home preset ${homePresetName} not found`);
              return;
            }

            this.usePreset(homePreset);
          }),
        );
      }),
    );
  });

  /**
   * Validates and converts user and group names to ids
   * and prepares an SetACl object.
   * TODO: Validation does not belong here and should be handled by form control.
   * TODO: Converting should not be necessary, id should be coming from form control.
   */
  private prepareSetAcl(editorState: DatasetAclEditorState, options: AclSaveFormParams): Observable<SetAcl> {
    const markAceAsHavingErrors = (aceIndex: number): void => {
      this.patchState((state) => ({
        ...state,
        acesWithError: _.union(state.acesWithError, [aceIndex]),
      }));
    };

    // Load ids for all user and group who's
    const userWhoToIds = new Map<string, number>();
    const groupWhoToIds = new Map<string, number>();
    const requests: Observable<unknown>[] = [];

    (editorState.acl.acl as (NfsAclItem | PosixAclItem)[]).forEach((ace, index) => {
      if ([NfsAclTag.User, PosixAclTag.User].includes(ace.tag)) {
        requests.push(
          this.userService.getUserByName(ace.who).pipe(
            tap((user) => userWhoToIds.set(ace.who, user.pw_uid)),
            catchError((error: WebsocketError) => {
              this.dialogService.error(this.errorHandler.parseWsError(error));
              markAceAsHavingErrors(index);
              return EMPTY;
            }),
          ),
        );

        return;
      }

      if ([NfsAclTag.UserGroup, PosixAclTag.Group].includes(ace.tag)) {
        requests.push(
          this.userService.getGroupByName(ace.who).pipe(
            tap((group) => groupWhoToIds.set(ace.who, group.gr_gid)),
            catchError((error: WebsocketError) => {
              this.dialogService.error(this.errorHandler.parseWsError(error));
              markAceAsHavingErrors(index);
              return EMPTY;
            }),
          ),
        );
      }
    });

    requests.push(
      this.userService.getUserByName(options.owner).pipe(
        tap((user) => userWhoToIds.set(options.owner, user.pw_uid)),
        catchError((error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          return EMPTY;
        }),
      ),
    );

    requests.push(
      this.userService.getGroupByName(options.ownerGroup).pipe(
        tap((group) => groupWhoToIds.set(options.ownerGroup, group.gr_gid)),
        catchError((error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          return EMPTY;
        }),
      ),
    );

    return forkJoin(requests).pipe(
      withLatestFrom(this.state$),
      filter(([, currentState]) => currentState.acesWithError.length === 0),
      map(([, currentState]) => {
        const convertedAces = (currentState.acl.acl as (NfsAclItem | PosixAclItem)[]).map((ace) => {
          const aceAttributes = omit(ace, ['who']);
          if ([NfsAclTag.User, PosixAclTag.User].includes(ace.tag)) {
            const id = userWhoToIds.has(ace.who) ? userWhoToIds.get(ace.who) : -1;
            return { ...aceAttributes, id };
          }
          if ([NfsAclTag.UserGroup, PosixAclTag.Group].includes(ace.tag)) {
            const id = groupWhoToIds.has(ace.who) ? groupWhoToIds.get(ace.who) : -1;
            return { ...aceAttributes, id };
          }

          return {
            ...aceAttributes,
            id: -1, // -1 is effectively null for middleware
          };
        });

        return {
          options: {
            recursive: options.recursive,
            traverse: options.traverse,
          },
          uid: userWhoToIds.has(options.owner) && options.applyOwner ? userWhoToIds.get(options.owner) : null,
          gid: groupWhoToIds.has(options.ownerGroup) && options.applyGroup
            ? groupWhoToIds.get(options.ownerGroup)
            : null,
          acltype: editorState.acl.acltype,
          path: editorState.mountpoint,
          dacl: convertedAces as NfsAclItem[] | PosixAclItem[],
        } as SetAcl;
      }),
    );
  }
}
