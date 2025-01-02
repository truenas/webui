import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { union, without, omit } from 'lodash-es';
import {
  EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, filter, map, switchMap, tap, withLatestFrom,
} from 'rxjs/operators';
import { AclType, DefaultAclType } from 'app/enums/acl-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import {
  Acl, AclTemplateByPath, NfsAclItem, PosixAclItem, SetAcl,
} from 'app/interfaces/acl.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AclSaveFormParams,
  DatasetAclEditorState,
} from 'app/pages/datasets/modules/permissions/interfaces/dataset-acl-editor-state.interface';
import { newNfsAce, newPosixAce } from 'app/pages/datasets/modules/permissions/utils/new-ace.utils';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';

const initialState: DatasetAclEditorState = {
  isLoading: false,
  isSaving: false,
  mountpoint: null,
  acl: null,
  stat: null,
  selectedAceIndex: 0,
  acesWithError: [],
};

@Injectable({
  providedIn: 'root',
})
export class DatasetAclEditorStore extends ComponentStore<DatasetAclEditorState> {
  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private router: Router,
    private translate: TranslateService,
    private storageService: StorageService,
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
          this.api.call('filesystem.getacl', [mountpoint, true, true]),
          this.api.call('filesystem.stat', [mountpoint]),
        ]).pipe(
          tap(([acl, stat]) => {
            this.patchState({
              acl,
              stat,
              isLoading: false,
            });
          }),
          catchError((error: unknown) => {
            this.dialogService.error(this.errorHandler.parseError(error));

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

    const newAcesWithError = without(state.acesWithError, indexToRemove).map((aceWithErrorIndex) => {
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
    state: DatasetAclEditorState,
    updatedAce: NfsAclItem | PosixAclItem,
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
        ? without(state.acesWithError, state.selectedAceIndex)
        : union(state.acesWithError, [state.selectedAceIndex]),
    };
  });

  readonly saveAcl = this.effect((saveParams$: Observable<AclSaveFormParams>) => {
    return saveParams$.pipe(
      // Warn user about risks when changing top level dataset
      switchMap(() => {
        if (this.storageService.isDatasetTopLevel(this.get().mountpoint.replace('mnt/', ''))) {
          return this.dialogService.confirm({
            title: helptextAcl.dataset_acl_dialog_warning,
            message: helptextAcl.dataset_acl_toplevel_dialog_message,
          });
        }

        return of(true);
      }),
      filter(Boolean),

      // Prepare request
      withLatestFrom(saveParams$),
      map(([, saveParams]) => this.prepareSetAcl(this.get(), saveParams)),

      // Save
      switchMap((setAcl) => this.makeSaveRequest(setAcl)),
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
        return this.api.call('filesystem.acltemplate.by_path', [{
          path: this.get().mountpoint,
          'format-options': {
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

            const homePreset = presets.find((preset) => (preset.name as DefaultAclType) === homePresetName);
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

  private makeSaveRequest(setAcl: SetAcl): Observable<Job> {
    return this.dialogService.jobDialog(
      this.api.job('filesystem.setacl', [setAcl]),
      {
        title: this.translate.instant(helptextAcl.save_dialog.title),
        description: this.translate.instant(helptextAcl.save_dialog.message),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        tap(() => {
          const url = ['datasets', this.get()?.mountpoint.replace(`${mntPath}/`, '')];
          this.router.navigate(url);
        }),
      );
  }

  /**
   * Validates and converts user and group names to ids
   * and prepares an SetACl object.
   */
  private prepareSetAcl(editorState: DatasetAclEditorState, options: AclSaveFormParams): SetAcl {
    const dacl = editorState.acl.acl.map((ace) => {
      if (ace.who === null && ace.id) {
        return ace;
      }

      return omit(ace, 'id');
    });

    return {
      dacl,
      options: {
        recursive: options.recursive,
        traverse: options.traverse,
        validate_effective_acl: options.validateEffectiveAcl,
      },
      user: options.owner,
      group: options.ownerGroup,
      acltype: editorState.acl.acltype,
      path: editorState.mountpoint,
    } as SetAcl;
  }
}
