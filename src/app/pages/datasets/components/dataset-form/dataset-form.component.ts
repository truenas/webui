import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, viewChild, inject, input, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
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
    TranslateModule,
  ],
})
export class DatasetFormComponent extends IxFormHostForm<Dataset> implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private datasetFormService = inject(DatasetFormService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);

  private destroyRef = inject(DestroyRef);

  /** Edit parameters supplied by the `<tn-side-panel>` host. */
  readonly params = input<{ datasetId: string; isNew?: boolean }>();

  private nameAndOptionsSection = viewChild.required(NameAndOptionsSectionComponent);
  private encryptionSection = viewChild(EncryptionSectionComponent);
  private quotasSection = viewChild(QuotasSectionComponent);
  private otherOptionsSection = viewChild(OtherOptionsSectionComponent);

  /** Read by the `<tn-side-panel>` host to role-gate its footer Save. */
  readonly requiredRoles = [Role.DatasetWrite];
  private formParams: { datasetId: string; isNew?: boolean };

  protected readonly isNameAndOptionsValid = signal(true);
  protected readonly isQuotaValid = signal(true);
  protected readonly isEncryptionValid = signal(true);
  protected readonly isOtherOptionsValid = signal(true);

  protected isLoading = signal(false);
  protected readonly isAdvancedMode = signal(false);
  protected readonly datasetPreset = signal(DatasetPreset.Generic);

  form = new FormGroup({});

  protected readonly areSubFormsValid = computed(() => {
    return this.isNameAndOptionsValid() && this.isQuotaValid()
      && this.isEncryptionValid() && this.isOtherOptionsValid();
  });

  /**
   * The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). Re-read each
   * change detection, so the label flips with {@link isAdvancedMode}.
   */
  get footerActions(): SidePanelFooterAction[] {
    // Labels are extraction markers — the panel container pipes them through `translate`.
    return [{
      label: this.isAdvancedMode() ? T('Basic Options') : T('Advanced Options'),
      testId: 'toggle-advanced',
      onClick: () => this.toggleAdvancedMode(),
    }];
  }

  protected readonly parentDataset = signal<Dataset | undefined>(undefined);
  protected readonly existingDataset = signal<Dataset | undefined>(undefined);

  get isNew(): boolean {
    return !this.existingDataset();
  }

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
    this.formParams = this.params() ?? { datasetId: '' };

    if (this.formParams.datasetId && !this.formParams.isNew) {
      this.setForEdit();
    }
    if (this.formParams.datasetId && this.formParams.isNew) {
      this.setForNew();
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

    this.datasetFormService.checkAndWarnForLengthAndDepth(this.formParams.datasetId).pipe(
      filter((isValidLengthAndDepth) => {
        if (!isValidLengthAndDepth) {
          // Falsy payload — the host reads it as a cancel and just closes the panel.
          this.closed.emit(null);
        }
        return isValidLengthAndDepth;
      }),
      switchMap(() => this.datasetFormService.loadDataset(this.formParams.datasetId)),
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

  setForEdit(): void {
    const requests = [
      this.datasetFormService.loadDataset(this.formParams.datasetId),
    ];

    const parentId = this.formParams.datasetId.split('/').slice(0, -1).join('/');
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

  /**
   * The saved dataset, captured on success so {@link onFormClosed} can hand it back to the opener —
   * `<ix-form>` closes with a plain `true`, and the dataset list needs the record to switch to it.
   */
  private savedDataset: Dataset | undefined;

  /** Whether the post-save ACL prompt was accepted; acted on after the panel closes. */
  private shouldGoToAclEditor = false;

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const payload = this.preparePayload();
    const existingDataset = this.existingDataset();
    // `!existingDataset` is redundant with `isNew` (which is `!existingDataset()`) but narrows the
    // type so `existingDataset.id` on the update branch is non-null — keep both.
    const isNew = this.isNew || !existingDataset;
    const request$ = isNew
      ? this.api.call('pool.dataset.create', [payload as DatasetCreate])
      : this.api.call('pool.dataset.update', [existingDataset.id, payload as DatasetUpdate]);

    return {
      request$: request$.pipe(
        switchMap((dataset) => this.createSmb(dataset)),
        switchMap((dataset) => this.createNfs(dataset)),
        switchMap((dataset) => {
          return this.checkForAclOnParent().pipe(
            switchMap((isAcl) => combineLatest([of(dataset), isAcl ? this.aclDialog() : of(false)])),
          );
        }),
      ),
      // Never rendered: the message depends on the saved record, so it is raised in `onSuccess`
      // and the wrapper's own snackbar is suppressed. Don't mint a translation key for it.
      successMessage: ignoreTranslation(''),
      onSuccess: (result: unknown) => this.onSaved(...result as [Dataset, boolean]),
      onError: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return true;
      },
    };
  };

  private onSaved(savedDataset: Dataset, shouldGoToAclEditor: boolean): void {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (this.nameAndOptionsSection().canCreateSmb && datasetPresetFormValue.create_smb) {
      this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
    }
    if (this.nameAndOptionsSection().canCreateNfs && datasetPresetFormValue.create_nfs) {
      this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
    }

    this.savedDataset = savedDataset;
    this.shouldGoToAclEditor = shouldGoToAclEditor;

    if (!shouldGoToAclEditor) {
      this.snackbar.success(
        this.isNew
          ? this.translate.instant('Switched to new dataset «{name}».', { name: getDatasetLabel(savedDataset) })
          : this.translate.instant('Dataset «{name}» updated.', { name: getDatasetLabel(savedDataset) }),
      );
    }
  }

  /**
   * Hands the saved dataset to the opener, then navigates to the ACL editor if the post-save prompt
   * was accepted — in that order, so the opener still sees the record before navigation tears the
   * panel down.
   */
  protected onFormClosed(): void {
    this.closed.emit(this.savedDataset);

    if (this.shouldGoToAclEditor) {
      this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
        queryParams: { path: this.savedDataset.mountpoint },
      });
    }
  }

  private preparePayload(): DatasetCreate | DatasetUpdate {
    const sections: { getPayload: () => Partial<DatasetCreate> | Partial<DatasetUpdate> }[] = this.isNew
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
    if (!this.isNew || !datasetPresetFormValue.create_smb || !this.nameAndOptionsSection().canCreateSmb) {
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
    if (!this.isNew || !datasetPresetFormValue.create_nfs || !this.nameAndOptionsSection().canCreateNfs) {
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
