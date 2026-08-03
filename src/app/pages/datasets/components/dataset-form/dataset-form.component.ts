import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, viewChild, inject, input, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, combineLatest, filter, forkJoin, map, Observable, of, switchMap,
} from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { SmbSharePurpose } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SidePanelFooterAction } from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  EncryptionSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/encryption-section/encryption-section.component';
import {
  NameAndOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/name-and-options-section/name-and-options-section.component';
import {
  OtherOptionsSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/other-options-section/other-options-section.component';
import {
  QuotasSectionComponent,
} from 'app/pages/datasets/components/dataset-form/sections/quotas-section/quotas-section.component';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { getDatasetLabel } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

/** The saved dataset, paired with whether the user accepted the post-save ACL-editor prompt. */
type SaveDatasetResult = [Dataset, boolean];

/**
 * Closes with the saved dataset, or `null` on the name length/depth bail-out — `FormSidePanelService`
 * reads that falsy payload as a cancel, so openers can safely `open<Dataset>(…)`.
 */
@Component({
  selector: 'ix-dataset-form',
  templateUrl: './dataset-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    NameAndOptionsSectionComponent,
    QuotasSectionComponent,
    EncryptionSectionComponent,
    OtherOptionsSectionComponent,
  ],
})
export class DatasetFormComponent extends IxFormHostForm<Dataset | null> implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private datasetFormService = inject(DatasetFormService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);

  private destroyRef = inject(DestroyRef);

  /** Create/edit parameters supplied by the `<tn-side-panel>` host. */
  readonly params = input.required<{ datasetId: string; isNew: boolean }>();

  private nameAndOptionsSection = viewChild.required(NameAndOptionsSectionComponent);
  private encryptionSection = viewChild(EncryptionSectionComponent);
  private quotasSection = viewChild(QuotasSectionComponent);
  private otherOptionsSection = viewChild(OtherOptionsSectionComponent);

  /** Read by the `<tn-side-panel>` host to role-gate its footer Save. */
  readonly requiredRoles = [Role.DatasetWrite];

  protected readonly isNameAndOptionsValid = signal(true);
  protected readonly isQuotaValid = signal(true);
  protected readonly isEncryptionValid = signal(true);
  protected readonly isOtherOptionsValid = signal(true);

  protected isLoading = signal(false);
  protected readonly isAdvancedMode = signal(false);
  protected readonly datasetPreset = signal(DatasetPreset.Generic);

  form = new FormGroup({});

  /**
   * Mirrors the template's `@if`s rather than AND-ing all four signals: a section that unmounts
   * leaves its last emission behind, and gating a section that isn't on screen would disable Save
   * with nothing to fix — invalidate a quota, click Basic Options, and it would stay stuck for the
   * life of the panel.
   *
   * This covers only the unmount direction; the remount direction is the section's own
   * responsibility — `QuotasSectionComponent` emits its current validity on mount (`startWith`), so
   * a fresh, valid instance clears the stale `false` its predecessor left here.
   *
   * Encryption is deliberately gated whenever it's mounted, even in basic mode where its fields are
   * hidden: unlike quotas, its payload is part of every create, so an invalid value still ships.
   */
  protected readonly areSubFormsValid = computed(() => {
    const isQuotasMounted = this.isNew() && this.isAdvancedMode();
    const isEncryptionMounted = this.isNew();

    return this.isNameAndOptionsValid()
      && (!isQuotasMounted || this.isQuotaValid())
      && (!isEncryptionMounted || this.isEncryptionValid())
      && this.isOtherOptionsValid();
  });

  /**
   * The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save), so the label
   * flips with {@link isAdvancedMode}.
   *
   * Create only: on edit, quotas and encryption are create-only and Other Options is advanced-only,
   * so switching back to basic would leave nothing on screen but the disabled Name field.
   */
  private readonly footerActionList = computed<SidePanelFooterAction[]>(() => {
    if (!this.isNew()) {
      return [];
    }

    // Labels are extraction markers — the panel container pipes them through `translate`.
    return [{
      label: this.isAdvancedMode() ? T('Basic Options') : T('Advanced Options'),
      testId: 'toggle-advanced',
      onClick: () => this.toggleAdvancedMode(),
    }];
  });

  /**
   * Still a getter because `HostedSidePanelForm` types `footerActions` as a plain array and the
   * container reads it each change detection — but backed by a `computed`, so the array is rebuilt
   * only when the mode actually changes rather than allocated on every pass.
   */
  get footerActions(): SidePanelFooterAction[] {
    return this.footerActionList();
  }

  protected readonly parentDataset = signal<Dataset | undefined>(undefined);
  protected readonly existingDataset = signal<Dataset | undefined>(undefined);

  /** Mountpoint to open the ACL editor at, set only when the post-save ACL prompt was accepted. */
  private aclEditorPath: string | undefined;

  /**
   * Taken from the host's params rather than `!existingDataset()`: that record only lands once the
   * edit load resolves, so deriving from it would report "new" for the whole load and mount (then
   * immediately tear down) the create-only sections.
   */
  protected readonly isNew = computed(() => this.params().isNew);

  get createSections(): [
    NameAndOptionsSectionComponent,
    EncryptionSectionComponent,
    OtherOptionsSectionComponent,
    QuotasSectionComponent?,
  ] {
    const sections: [
      NameAndOptionsSectionComponent,
      EncryptionSectionComponent,
      OtherOptionsSectionComponent,
      QuotasSectionComponent?,
    ] = [
      this.nameAndOptionsSection(),
      this.encryptionSection(),
      this.otherOptionsSection(),
    ];

    if (this.isAdvancedMode()) {
      sections.push(this.quotasSection());
    }

    return sections;
  }

  get updateSections(): [NameAndOptionsSectionComponent, OtherOptionsSectionComponent] {
    return [
      this.nameAndOptionsSection(),
      this.otherOptionsSection(),
    ];
  }

  override hasUnsavedChanges(): boolean {
    return Boolean(
      this.form.dirty
      || this.nameAndOptionsSection()?.form?.dirty
      || this.encryptionSection()?.form?.dirty
      || this.otherOptionsSection()?.form?.dirty
      || this.quotasSection()?.form.dirty,
    );
  }

  ngOnInit(): void {
    const { isNew } = this.params();

    if (isNew) {
      this.setForNew();
    } else {
      this.setForEdit();
    }
  }

  ngAfterViewInit(): void {
    this.nameAndOptionsSection().form.controls.share_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((datasetPreset) => {
        this.datasetPreset.set(datasetPreset);
      });
  }

  private setForNew(): void {
    this.isLoading.set(true);

    this.datasetFormService.checkAndWarnForLengthAndDepth(this.params().datasetId).pipe(
      filter((isValidLengthAndDepth) => {
        if (!isValidLengthAndDepth) {
          // Falsy payload — the host reads it as a cancel and just closes the panel.
          this.closed.emit(null);
        }
        return isValidLengthAndDepth;
      }),
      switchMap(() => this.datasetFormService.loadDataset(this.params().datasetId)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (dataset) => {
        this.parentDataset.set(dataset);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private setForEdit(): void {
    // Edit renders Other Options only in advanced mode (quotas/encryption stay create-only), so a
    // basic-mode edit panel would show nothing but the disabled Name field. Start expanded.
    this.isAdvancedMode.set(true);

    const requests = [
      this.datasetFormService.loadDataset(this.params().datasetId),
    ];

    const parentId = this.params().datasetId.split('/').slice(0, -1).join('/');
    if (parentId) {
      requests.push(this.datasetFormService.loadDataset(parentId));
    }

    this.isLoading.set(true);

    forkJoin(requests).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([existingDataset, parent]) => {
        this.existingDataset.set(existingDataset);
        this.parentDataset.set(parent);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected toggleAdvancedMode(): void {
    this.isAdvancedMode.update((advanced) => !advanced);
  }

  protected onSwitchToAdvanced(): void {
    this.isAdvancedMode.set(true);
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult<Dataset, SaveDatasetResult> => {
    const payload = this.preparePayload();
    const existingDataset = this.existingDataset();
    // `!existingDataset` is redundant with `isNew()` but narrows the type, so `existingDataset.id`
    // on the update branch is non-null — keep both.
    const request$ = this.isNew() || !existingDataset
      ? this.api.call('pool.dataset.create', [payload as DatasetCreate])
      : this.api.call('pool.dataset.update', [existingDataset.id, payload as DatasetUpdate]);

    return {
      request$: this.saveDataset(request$),
      // The message depends on the saved record, so `onSaved` raises it instead — the form runs
      // under `[suppressSuccessSnackbar]`, which is what makes this `null` deliberate.
      successMessage: null,
      onSuccess: ([savedDataset, shouldGoToAclEditor]) => this.onSaved(savedDataset, shouldGoToAclEditor),
      closeWith: ([savedDataset]) => savedDataset,
      onError: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return true;
      },
    };
  };

  /**
   * Runs the post-save chain (optional SMB/NFS shares, then the parent-ACL prompt) and types its
   * result, so the tuple `onSaved` destructures is declared in one place rather than being asserted
   * at the `onSuccess` boundary against a shape produced further up.
   */
  private saveDataset(request$: Observable<Dataset>): Observable<SaveDatasetResult> {
    return request$.pipe(
      switchMap((dataset) => this.createSmb(dataset)),
      switchMap((dataset) => this.createNfs(dataset)),
      switchMap((dataset) => {
        return this.checkForAclOnParent().pipe(
          switchMap((isAcl): Observable<SaveDatasetResult> => {
            return combineLatest([of(dataset), isAcl ? this.aclDialog() : of(false)]);
          }),
        );
      }),
    );
  }

  private onSaved(savedDataset: Dataset, shouldGoToAclEditor: boolean): void {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (this.nameAndOptionsSection().canCreateSmb && datasetPresetFormValue.create_smb) {
      this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
    }
    if (this.nameAndOptionsSection().canCreateNfs && datasetPresetFormValue.create_nfs) {
      this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
    }

    this.aclEditorPath = shouldGoToAclEditor ? savedDataset.mountpoint : undefined;

    if (!shouldGoToAclEditor) {
      // Phrased as plain "created", matching the zvol form: now that the forms own their messages
      // they must hold for every opener, and not all of them navigate to the new record (the
      // explorer's Create Zvol just fills the field in place).
      this.snackbar.success(
        this.isNew()
          ? this.translate.instant('Dataset «{name}» created.', { name: getDatasetLabel(savedDataset) })
          : this.translate.instant('Dataset «{name}» updated.', { name: getDatasetLabel(savedDataset) }),
      );
    }
  }

  /**
   * Forwards the `closeWith` payload to the opener, then navigates to the ACL editor if the
   * post-save prompt was accepted.
   *
   * The emit does NOT guarantee the opener's `onSuccess` runs in the ACL branch: the host records
   * the payload here but only resolves it on panel teardown, after the close animation, by which
   * point `router.navigate` has destroyed the opener and the `DestroyRef` its callback is bound to.
   * That's intended — we're leaving the page anyway — and matches the pre-migration behaviour.
   */
  protected onFormClosed(savedDataset: Dataset): void {
    this.closed.emit(savedDataset);

    if (this.aclEditorPath) {
      this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
        queryParams: { path: this.aclEditorPath },
      });
    }
  }

  private preparePayload(): DatasetCreate | DatasetUpdate {
    const sections: { getPayload: () => Partial<DatasetCreate> | Partial<DatasetUpdate> }[] = this.isNew()
      ? this.createSections
      : this.updateSections;

    return sections.reduce((payload, section) => {
      return { ...payload, ...section.getPayload() } as DatasetCreate | DatasetUpdate;
    }, {} as DatasetCreate | DatasetUpdate);
  }

  private checkForAclOnParent(): Observable<boolean> {
    const parentDataset = this.parentDataset();
    if (!parentDataset) {
      return of(false);
    }

    const parentPath = `/mnt/${parentDataset.id}`;
    return this.api.call('filesystem.stat', [parentPath]).pipe(map((stat) => stat.acl));
  }

  private aclDialog(): Observable<boolean> {
    return this.dialog.confirm({
      title: this.translate.instant(helptextDatasetForm.afterSubmitDialog.title),
      message: this.translate.instant(helptextDatasetForm.afterSubmitDialog.message),
      hideCheckbox: true,
      buttonText: this.translate.instant(helptextDatasetForm.afterSubmitDialog.actionBtn),
      cancelText: this.translate.instant(helptextDatasetForm.afterSubmitDialog.cancelBtn),
    });
  }

  private createSmb(dataset: Dataset): Observable<Dataset> {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (!this.isNew() || !datasetPresetFormValue.create_smb || !this.nameAndOptionsSection().canCreateSmb) {
      return of(dataset);
    }
    const isMultiprotocol = this.nameAndOptionsSection().form.value.share_type === DatasetPreset.Multiprotocol;
    return this.api.call('sharing.smb.create', [{
      name: datasetPresetFormValue.smb_name,
      path: `${mntPath}/${dataset.id}`,
      ...(isMultiprotocol ? { purpose: SmbSharePurpose.MultiProtocolShare } : {}),
    }]).pipe(
      switchMap(() => of(dataset)),
      catchError((error: unknown) => this.rollBack(dataset, error)),
    );
  }

  private createNfs(dataset: Dataset): Observable<Dataset> {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (!this.isNew() || !datasetPresetFormValue.create_nfs || !this.nameAndOptionsSection().canCreateNfs) {
      return of(dataset);
    }
    return this.api.call('sharing.nfs.create', [{
      path: `${mntPath}/${dataset.id}`,
    }]).pipe(
      switchMap(() => of(dataset)),
      catchError((error: unknown) => this.rollBack(dataset, error)),
    );
  }

  private rollBack(dataset: Dataset, error: unknown): Observable<Dataset> {
    return this.api.call('pool.dataset.delete', [dataset.id, { recursive: true, force: true }]).pipe(
      switchMap(() => {
        throw error;
      }),
    );
  }
}
