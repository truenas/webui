import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  forkJoin, Observable, of, switchMap, map, combineLatest,
} from 'rxjs';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetFormComponent implements OnInit {
  @ViewChild(NameAndOptionsSectionComponent) nameAndOptionsSection: NameAndOptionsSectionComponent;
  @ViewChild(EncryptionSectionComponent) encryptionSection: EncryptionSectionComponent;
  @ViewChild(QuotasSectionComponent) quotasSection: QuotasSectionComponent;
  @ViewChild(OtherOptionsSectionComponent) otherOptionsSection: OtherOptionsSectionComponent;

  isLoading = false;
  isAdvancedMode = false;

  form = new FormGroup({});

  parentDataset: Dataset;
  existingDataset: Dataset;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private datasetFormService: DatasetFormService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private slideInRef: IxSlideInRef<DatasetFormComponent>,
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
      this.nameAndOptionsSection,
      this.encryptionSection,
      this.otherOptionsSection,
    ];

    if (this.isAdvancedMode) {
      sections.push(this.quotasSection);
    }

    return sections;
  }

  get updateSections(): [NameAndOptionsSectionComponent, OtherOptionsSectionComponent] {
    return [
      this.nameAndOptionsSection,
      this.otherOptionsSection,
    ];
  }

  setForNew(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.datasetFormService.ensurePathLimits(this.slideInData.datasetId).pipe(
      switchMap(() => this.datasetFormService.loadDataset(this.slideInData.datasetId)),
    )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (dataset) => {
          this.parentDataset = dataset;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialog.error(this.errorHandler.parseWsError(error));
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
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseWsError(error));
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
      ? this.ws.call('pool.dataset.create', [payload as DatasetCreate])
      : this.ws.call('pool.dataset.update', [this.existingDataset.id, payload as DatasetUpdate]);

    request$.pipe(
      switchMap((dataset) => {
        return this.checkForAclOnParent().pipe(
          switchMap((isAcl) => combineLatest([of(dataset), isAcl ? this.aclDialog() : of(false)])),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: ([createdDataset, shouldGoToEditor]) => {
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
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseWsError(error));
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
    return this.ws.call('filesystem.acl_is_trivial', [parentPath]).pipe(map((isTrivial) => !isTrivial));
  }

  private aclDialog(): Observable<boolean> {
    return this.dialog.confirm({
      title: helptext.afterSubmitDialog.title,
      message: helptext.afterSubmitDialog.message,
      hideCheckbox: true,
      buttonText: helptext.afterSubmitDialog.actionBtn,
      cancelText: helptext.afterSubmitDialog.cancelBtn,
    });
  }
}
