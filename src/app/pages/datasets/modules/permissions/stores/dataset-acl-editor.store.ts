import { Injectable, inject } from '@angular/core';
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
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private storageService = inject(StorageService);

  constructor() {
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

  readonly removeAce = this.updater((state: DatasetAclEditorState, indexToRemove: number) => {
    let selectedAceIndex = state.selectedAceIndex;

    if (selectedAceIndex && selectedAceIndex >= indexToRemove) {
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

  /**
   * Copy ACCESS ACL entries to DEFAULT ACL entries (convenience feature for directories)
   */
  readonly copyAccessToDefault = this.updater((state) => {
    if (state.acl.acltype !== AclType.Posix1e) {
      return state;
    }

    const accessAces = (state.acl.acl as PosixAclItem[]).filter((ace) => !ace.default);
    const nonAccessAces = (state.acl.acl as PosixAclItem[]).filter((ace) => ace.default);

    // Create default entries from access entries
    const defaultAces = accessAces.map((ace) => ({
      ...ace,
      default: true,
    }));

    return {
      ...state,
      acl: {
        ...state.acl,
        acl: [...nonAccessAces, ...accessAces, ...defaultAces],
      },
    } as DatasetAclEditorState;
  });

  /**
   * Automatically add MASK entry when USER or GROUP entries exist without a MASK
   */
  readonly ensureMaskEntries = this.updater((state) => {
    if (state.acl.acltype !== AclType.Posix1e) {
      return state;
    }

    const aces = state.acl.acl as PosixAclItem[];
    const updatedAces = [...aces];

    // Check ACCESS ACL for USER/GROUP entries without MASK
    const accessAces = aces.filter((ace) => !ace.default);
    const hasAccessUserOrGroup = accessAces.some(
      (ace) => ace.tag === PosixAclTag.User || ace.tag === PosixAclTag.Group,
    );
    const hasAccessMask = accessAces.some((ace) => ace.tag === PosixAclTag.Mask);

    if (hasAccessUserOrGroup && !hasAccessMask) {
      const newAccessMask: PosixAclItem = {
        tag: PosixAclTag.Mask,
        default: false,
        id: null,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: true,
          [PosixPermission.Execute]: true,
        },
      };
      updatedAces.push(newAccessMask);
    }

    // Check DEFAULT ACL for USER/GROUP entries without MASK
    const defaultAces = aces.filter((ace) => ace.default);
    const hasDefaultUserOrGroup = defaultAces.some(
      (ace) => ace.tag === PosixAclTag.User || ace.tag === PosixAclTag.Group,
    );
    const hasDefaultMask = defaultAces.some((ace) => ace.tag === PosixAclTag.Mask);

    if (hasDefaultUserOrGroup && !hasDefaultMask) {
      const newDefaultMask: PosixAclItem = {
        tag: PosixAclTag.Mask,
        default: true,
        id: null,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: true,
          [PosixPermission.Execute]: true,
        },
      };
      updatedAces.push(newDefaultMask);
    }

    return {
      ...state,
      acl: {
        ...state.acl,
        acl: updatedAces,
      },
    } as DatasetAclEditorState;
  });

  readonly selectAce = this.updater((state: DatasetAclEditorState, index: number | null) => {
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

    let finalAces = updatedAces;

    // Auto-add MASK entries if we just added/modified USER or GROUP entries for POSIX ACLs
    if (state.acl.acltype === AclType.Posix1e) {
      const modifiedAce = updatedAce as PosixAclItem;
      if (modifiedAce.tag === PosixAclTag.User || modifiedAce.tag === PosixAclTag.Group) {
        finalAces = this.addMaskEntriesIfNeeded(finalAces as PosixAclItem[]);
      }
    }

    return {
      ...state,
      acl: {
        ...state.acl,
        acl: finalAces,
      } as Acl,
    };
  });

  /**
   * Helper method to add MASK entries if needed (used internally)
   */
  private addMaskEntriesIfNeeded(aces: PosixAclItem[]): PosixAclItem[] {
    const updatedAces = [...aces];

    // Check ACCESS ACL for USER/GROUP entries without MASK
    const accessAces = aces.filter((ace) => !ace.default);
    const hasAccessUserOrGroup = accessAces.some(
      (ace) => ace.tag === PosixAclTag.User || ace.tag === PosixAclTag.Group,
    );
    const hasAccessMask = accessAces.some((ace) => ace.tag === PosixAclTag.Mask);

    if (hasAccessUserOrGroup && !hasAccessMask) {
      const newAccessMask: PosixAclItem = {
        tag: PosixAclTag.Mask,
        default: false,
        id: null,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: true,
          [PosixPermission.Execute]: true,
        },
      };
      updatedAces.push(newAccessMask);
    }

    // Check DEFAULT ACL for USER/GROUP entries without MASK
    const defaultAces = aces.filter((ace) => ace.default);
    const hasDefaultUserOrGroup = defaultAces.some(
      (ace) => ace.tag === PosixAclTag.User || ace.tag === PosixAclTag.Group,
    );
    const hasDefaultMask = defaultAces.some((ace) => ace.tag === PosixAclTag.Mask);

    if (hasDefaultUserOrGroup && !hasDefaultMask) {
      const newDefaultMask: PosixAclItem = {
        tag: PosixAclTag.Mask,
        default: true,
        id: null,
        perms: {
          [PosixPermission.Read]: true,
          [PosixPermission.Write]: true,
          [PosixPermission.Execute]: true,
        },
      };
      updatedAces.push(newDefaultMask);
    }

    return updatedAces;
  }

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
            title: this.translate.instant(helptextAcl.warningTitle),
            message: this.translate.instant(helptextAcl.topLevelDialogMessage),
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
        title: this.translate.instant(helptextAcl.saveDialog.title),
        description: this.translate.instant(helptextAcl.saveDialog.message),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        tap(() => {
          const url = ['datasets', this.get()?.mountpoint?.replace(`${mntPath}/`, '')];
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
