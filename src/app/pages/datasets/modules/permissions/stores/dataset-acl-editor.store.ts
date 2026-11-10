import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { union, without, omit } from 'lodash-es';
import {
  EMPTY, forkJoin, Observable, of, pipe, Subject,
} from 'rxjs';
import {
  catchError, filter, map, mergeMap, switchMap, tap,
} from 'rxjs/operators';
import { AclType, DefaultAclType } from 'app/enums/acl-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { isFailedJobError } from 'app/helpers/api.helper';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import {
  Acl, AclTemplateByPath, NfsAclItem, PosixAclItem, SetAcl, toAcl, toAclTemplateByPath, toSetAclArgs,
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
import { ErrorParserService } from 'app/services/errors/error-parser.service';
import { StorageService } from 'app/services/storage.service';

/**
 * Stable fragment of the backend `filesystem.check_acl_execute` error message
 * (raised with errno EPERM when a user/group cannot traverse to the dataset).
 * Used to distinguish the recoverable "no traverse access" case from other
 * ACL save failures so we can offer to save without effective-ACL validation.
 */
const traverseValidationErrorMarker = 'execute permissions on the path';

const initialState: DatasetAclEditorState = {
  isLoading: false,
  isSaving: false,
  mountpoint: null,
  acl: null,
  stat: null,
  selectedAceIndex: 0,
  acesWithError: [],
  returnUrl: null,
};

@Injectable({
  providedIn: 'root',
})
export class DatasetAclEditorStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private errorParser = inject(ErrorParserService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private storageService = inject(StorageService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly mountpoint = this.state.mountpoint;
  readonly acl = this.state.acl;
  readonly stat = this.state.stat;
  readonly selectedAceIndex = this.state.selectedAceIndex;
  readonly acesWithError = this.state.acesWithError;
  readonly returnUrl = this.state.returnUrl;

  readonly saveSucceeded$ = new Subject<void>();

  private readonly load = rxMethod<string>(pipe(
    tap((mountpoint) => patchState(this.state, { ...initialState, mountpoint, isLoading: true })),
    switchMap((mountpoint) => {
      return forkJoin([
        this.api.call('filesystem.getacl', [mountpoint, true, true]).pipe(map(toAcl)),
        this.api.call('filesystem.stat', [mountpoint]),
      ]).pipe(
        tapResponse({
          next: ([acl, stat]) => patchState(this.state, { acl, stat, isLoading: false }),
          error: (error: unknown) => {
            this.errorHandler.showErrorModal(error);
            patchState(this.state, { isLoading: false });
          },
        }),
      );
    }),
  ));

  /**
   * Waits for an entry's verdict here rather than in the form that asked, and records it against that entry.
   * The form cannot see it through: selecting another entry either patches that entry in, which cancels the check,
   * or (from the list) tears the form down first. Either way the entry would keep the error it had before.
   */
  private readonly settleValidation = rxMethod<{ ace: NfsAclItem | PosixAclItem; isValid$: Observable<boolean> }>(
    mergeMap(({ ace, isValid$ }) => isValid$.pipe(
      tap((isValid) => this.updateAceValidation({ ace, isValid })),
    )),
  );

  private readonly save = rxMethod<AclSaveFormParams>(
    switchMap((saveParams) => {
      // Warn user about risks when changing top level dataset
      const confirmed$ = this.storageService.isDatasetTopLevel(this.state.mountpoint().replace('mnt/', ''))
        ? this.dialogService.confirm({
            title: this.translate.instant(helptextAcl.warningTitle),
            message: this.translate.instant(helptextAcl.topLevelDialogMessage),
          })
        : of(true);

      return confirmed$.pipe(
        filter(Boolean),
        map(() => this.prepareSetAcl(this.state(), saveParams)),
        switchMap((setAcl) => this.makeSaveRequest(setAcl)),
      );
    }),
  );

  private readonly loadHomePreset = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap(() => {
      return this.api.call('filesystem.acltemplate.by_path', [{
        path: this.state.mountpoint(),
        'format-options': {
          resolve_names: true,
        },
      }]).pipe(
        map((presets) => presets.map(toAclTemplateByPath)),
        tapResponse({
          next: (presets) => {
            patchState(this.state, { isLoading: false });
            const homePresetName = this.state.acl().acltype === AclType.Nfs4
              ? DefaultAclType.Nfs4Home
              : DefaultAclType.PosixHome;

            const homePreset = presets.find((preset) => (preset.name as DefaultAclType) === homePresetName);
            if (!homePreset) {
              console.error(`Home preset ${homePresetName} not found`);
              return;
            }

            this.usePreset(homePreset);
          },
          error: (error: unknown) => {
            this.errorHandler.showErrorModal(error);
            patchState(this.state, { isLoading: false });
          },
        }),
      );
    }),
  ));

  loadAcl(mountpoint: string): void {
    this.load(mountpoint);
  }

  /** Where to go once the ACL is saved or stripped. Set after `loadAcl`, which clears it. */
  setReturnUrl(returnUrl: string | null): void {
    patchState(this.state, { returnUrl });
  }

  removeAce(indexToRemove: number): void {
    patchState(this.state, (state) => {
      let selectedAceIndex = state.selectedAceIndex;

      if (selectedAceIndex && selectedAceIndex >= indexToRemove) {
        selectedAceIndex = Math.max(0, selectedAceIndex - 1);
      }

      const acesWithError = without(state.acesWithError, indexToRemove).map((aceWithErrorIndex) => {
        if (aceWithErrorIndex <= indexToRemove) {
          return aceWithErrorIndex;
        }

        return aceWithErrorIndex - 1;
      });

      return {
        selectedAceIndex,
        acl: {
          ...state.acl,
          acl: (state.acl.acl as (NfsAclItem | PosixAclItem)[]).filter((ace, index) => index !== indexToRemove),
        } as Acl,
        acesWithError,
      };
    });
  }

  addAce(): void {
    patchState(this.state, (state) => {
      const newAce = state.acl.acltype === AclType.Nfs4
        ? { ...newNfsAce } as NfsAclItem
        : { ...newPosixAce } as PosixAclItem;

      return {
        acl: {
          ...state.acl,
          acl: (state.acl.acl as (NfsAclItem | PosixAclItem)[]).concat(newAce),
        } as Acl,
        selectedAceIndex: state.acl.acl.length,
      };
    });
  }

  selectAce(index: number | null): void {
    patchState(this.state, { selectedAceIndex: index });
  }

  updateSelectedAce(updatedAce: NfsAclItem | PosixAclItem): void {
    patchState(this.state, (state) => {
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
        acl: {
          ...state.acl,
          acl: updatedAces,
        } as Acl,
      };
    });
  }

  updateSelectedAceValidation(isValid: boolean): void {
    patchState(this.state, (state) => ({
      acesWithError: isValid
        ? without(state.acesWithError, state.selectedAceIndex)
        : union(state.acesWithError, [state.selectedAceIndex]),
    }));
  }

  /**
   * Records the validity of an entry that may no longer be selected, for a check that outlived its selection.
   * The entry is found by identity: once it has been edited or removed, the verdict is about a version of it that
   * no longer exists, and is dropped.
   */
  updateAceValidation({ ace, isValid }: { ace: NfsAclItem | PosixAclItem; isValid: boolean }): void {
    patchState(this.state, (state) => {
      const index = (state.acl?.acl as (NfsAclItem | PosixAclItem)[] | undefined)?.indexOf(ace) ?? -1;
      if (index === -1) {
        return {};
      }

      return {
        acesWithError: isValid
          ? without(state.acesWithError, index)
          : union(state.acesWithError, [index]),
      };
    });
  }

  settleAceValidation(check: { ace: NfsAclItem | PosixAclItem; isValid$: Observable<boolean> }): void {
    this.settleValidation(check);
  }

  saveAcl(saveParams: AclSaveFormParams): void {
    this.save(saveParams);
  }

  usePreset(preset: AclTemplateByPath): void {
    patchState(this.state, (state): Partial<DatasetAclEditorState> => ({
      acl: {
        ...state.acl,
        acl: preset.acl,
      } as Acl,
      isLoading: false,
      acesWithError: [],
      selectedAceIndex: 0,
    }));
  }

  loadHomeSharePreset(): void {
    this.loadHomePreset();
  }

  private makeSaveRequest(setAcl: SetAcl): Observable<Job> {
    return this.runSetAclJob(setAcl).pipe(
      catchError((error: unknown) => this.handleSaveError(setAcl, error)),
      tap(() => this.onSaveSucceeded()),
    );
  }

  private runSetAclJob(setAcl: SetAcl): Observable<Job> {
    return this.dialogService.jobDialog(
      this.api.job('filesystem.setacl', [toSetAclArgs(setAcl)]),
      {
        title: this.translate.instant(helptextAcl.saveDialog.title),
        description: this.translate.instant(helptextAcl.saveDialog.message),
      },
    ).afterClosed();
  }

  /**
   * If the backend rejected the ACL only because a user/group lacks traverse
   * access to the dataset, warn the user and offer to save anyway with
   * effective-ACL validation disabled. Any other error is shown as usual.
   */
  private handleSaveError(setAcl: SetAcl, error: unknown): Observable<Job> {
    if (!this.isTraverseValidationError(error)) {
      this.errorHandler.showErrorModal(error);
      return EMPTY;
    }

    return this.dialogService.confirm({
      title: this.translate.instant(helptextAcl.effectiveAclDialog.title),
      message: this.translate.instant(helptextAcl.effectiveAclDialog.message, {
        details: this.errorParser.getFirstErrorMessage(error),
      }),
      buttonText: this.translate.instant(helptextAcl.effectiveAclDialog.buttonText),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        // On success the job flows out to the outer `tap` in makeSaveRequest, which
        // navigates away. withErrorHandler swallows any failure of the retry itself.
        return this.runSetAclJob({
          ...setAcl,
          options: { ...setAcl.options, validate_effective_acl: false },
        }).pipe(
          this.errorHandler.withErrorHandler(),
        );
      }),
    );
  }

  private isTraverseValidationError(error: unknown): boolean {
    return isFailedJobError(error) && (error.job.error || '').includes(traverseValidationErrorMarker);
  }

  private onSaveSucceeded(): void {
    this.saveSucceeded$.next();
    const returnUrl = this.state.returnUrl();
    const returnRoute = returnUrl
      ? [returnUrl]
      : ['datasets', this.state.mountpoint()?.replace(`${mntPath}/`, '')];
    this.router.navigate(returnRoute);
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
    }) as (NfsAclItem[] | PosixAclItem[]);

    const setAcl: SetAcl = {
      dacl,
      options: {
        recursive: options.recursive,
        traverse: options.traverse,
        validate_effective_acl: true, // Always validate for security - UI option removed
      },
      acltype: editorState.acl.acltype,
      path: editorState.mountpoint,
    };

    // Only include user/group in payload if the corresponding checkbox is checked
    if (options.applyOwner) {
      setAcl.user = options.owner;
    }
    if (options.applyGroup) {
      setAcl.group = options.ownerGroup;
    }

    return setAcl;
  }
}
