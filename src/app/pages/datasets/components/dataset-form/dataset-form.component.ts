import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, viewChild,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  forkJoin, Observable, of, switchMap, map, combineLatest, filter, catchError,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-form',
  templateUrl: './dataset-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    RequiresRolesDirective,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    NameAndOptionsSectionComponent,
    QuotasSectionComponent,
    EncryptionSectionComponent,
    OtherOptionsSectionComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class DatasetFormComponent implements OnInit, AfterViewInit {
  private nameAndOptionsSection = viewChild(NameAndOptionsSectionComponent);
  private encryptionSection = viewChild(EncryptionSectionComponent);
  private quotasSection = viewChild(QuotasSectionComponent);
  private otherOptionsSection = viewChild(OtherOptionsSectionComponent);

  readonly requiredRoles = [Role.DatasetWrite];

  isNameAndOptionsValid = true;
  isQuotaValid = true;
  isEncryptionValid = true;
  isOtherOptionsValid = true;

  isLoading = false;
  isAdvancedMode = false;
  datasetPreset = DatasetPreset.Generic;

  form = new FormGroup({});

  parentDataset: Dataset;
  existingDataset: Dataset;

  get areSubFormsValid(): boolean {
    return this.isNameAndOptionsValid && this.isQuotaValid && this.isEncryptionValid && this.isNameAndOptionsValid;
  }

  get isNew(): boolean {
    return !this.existingDataset;
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

    if (this.isAdvancedMode) {
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

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private datasetFormService: DatasetFormService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private slideInRef: SlideInRef<DatasetFormComponent>,
    private store$: Store<AppState>,
    @Inject(SLIDE_IN_DATA) private slideInData: { datasetId: string; isNew?: boolean },
  ) {}

  ngOnInit(): void {
    if (this.slideInData?.datasetId && !this.slideInData?.isNew) {
      this.setForEdit();
    }
    if (this.slideInData?.datasetId && this.slideInData?.isNew) {
      this.setForNew();
    }
  }

  ngAfterViewInit(): void {
    this.nameAndOptionsSection().form.controls.share_type.valueChanges
      .pipe(untilDestroyed(this)).subscribe((datasetPreset) => {
        this.datasetPreset = datasetPreset;
      });
  }

  setForNew(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.datasetFormService.checkAndWarnForLengthAndDepth(this.slideInData.datasetId).pipe(
      filter(Boolean),
      switchMap(() => this.datasetFormService.loadDataset(this.slideInData.datasetId)),
      untilDestroyed(this),
    ).subscribe({
      next: (dataset) => {
        this.parentDataset = dataset;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseError(error));
      },
    });
  }

  setForEdit(): void {
    const requests = [
      this.datasetFormService.loadDataset(this.slideInData.datasetId),
    ];

    const parentId = this.slideInData.datasetId.split('/').slice(0, -1).join('/');
    if (parentId) {
      requests.push(this.datasetFormService.loadDataset(parentId));
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin(requests).pipe(untilDestroyed(this)).subscribe({
      next: ([existingDataset, parent]) => {
        this.existingDataset = existingDataset;
        this.parentDataset = parent;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseError(error));
      },
    });
  }

  toggleAdvancedMode(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
    this.cdr.markForCheck();
  }

  onSwitchToAdvanced(): void {
    this.isAdvancedMode = true;
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = this.preparePayload();
    const request$ = this.isNew
      ? this.api.call('pool.dataset.create', [payload as DatasetCreate])
      : this.api.call('pool.dataset.update', [this.existingDataset.id, payload as DatasetUpdate]);

    request$.pipe(
      switchMap((dataset) => this.createSmb(dataset)),
      switchMap((dataset) => this.createNfs(dataset)),
      switchMap((dataset) => {
        return this.checkForAclOnParent().pipe(
          switchMap((isAcl) => combineLatest([of(dataset), isAcl ? this.aclDialog() : of(false)])),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: ([createdDataset, shouldGoToEditor]) => {
        const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
        if (this.nameAndOptionsSection().canCreateSmb && datasetPresetFormValue.create_smb) {
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
        }
        if (this.nameAndOptionsSection().canCreateNfs && datasetPresetFormValue.create_nfs) {
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
        }
        this.isLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close(createdDataset);
        if (shouldGoToEditor) {
          this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
            queryParams: { path: createdDataset.mountpoint },
          });
        } else {
          this.snackbar.success(
            this.isNew
              ? this.translate.instant('Switched to new dataset «{name}».', { name: getDatasetLabel(createdDataset) })
              : this.translate.instant('Dataset «{name}» updated.', { name: getDatasetLabel(createdDataset) }),
          );
        }
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseError(error));
      },
    });
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
    if (!this.parentDataset) {
      return of(false);
    }

    const parentPath = `/mnt/${this.parentDataset.id}`;
    return this.api.call('filesystem.stat', [parentPath]).pipe(map((stat) => stat.acl));
  }

  private aclDialog(): Observable<boolean> {
    return this.dialog.confirm({
      title: helptextDatasetForm.afterSubmitDialog.title,
      message: helptextDatasetForm.afterSubmitDialog.message,
      hideCheckbox: true,
      buttonText: helptextDatasetForm.afterSubmitDialog.actionBtn,
      cancelText: helptextDatasetForm.afterSubmitDialog.cancelBtn,
    });
  }

  private createSmb(dataset: Dataset): Observable<Dataset> {
    const datasetPresetFormValue = this.nameAndOptionsSection().datasetPresetForm.value;
    if (!this.isNew || !datasetPresetFormValue.create_smb || !this.nameAndOptionsSection().canCreateSmb) {
      return of(dataset);
    }
    return this.api.call('sharing.smb.create', [{
      name: datasetPresetFormValue.smb_name,
      path: `${mntPath}/${dataset.id}`,
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
