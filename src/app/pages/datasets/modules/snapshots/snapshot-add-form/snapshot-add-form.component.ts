import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators,
} from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns-tz';
import {
  Observable, combineLatest, of, merge,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { Option } from 'app/interfaces/option.interface';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { atLeastOne } from 'app/modules/ix-forms/validators/at-least-one-validation';
import { requiredEmpty } from 'app/modules/ix-forms/validators/required-empty-validation';
import { snapshotExcludeBootQueryFilter } from 'app/pages/datasets/modules/snapshots/constants/snapshot-exclude-boot.constant';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotAddFormComponent implements OnInit {
  isFormLoading = true;
  form = this.fb.group({
    dataset: ['', Validators.required],
    name: [this.getDefaultSnapshotName(), [this.validatorsService.withMessage(
      atLeastOne('naming_schema', [helptext.snapshot_add_name_placeholder, helptext.snapshot_add_naming_schema_placeholder]),
      this.translate.instant('Name or Naming Schema must be provided.'),
    ), this.validatorsService.validateOnCondition(
      (control: AbstractControl) => control.value && control.parent?.get('naming_schema').value,
      this.validatorsService.withMessage(
        requiredEmpty(),
        this.translate.instant('Name and Naming Schema cannot be provided at the same time.'),
      ),
    )]],
    naming_schema: [''],
    recursive: [false],
    vmware_sync: [false],
  });

  datasetOptions$: Observable<Option[]>;
  namingSchemaOptions$: Observable<Option[]>;
  hasVmsInDataset = false;

  readonly helptext = helptext;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private validatorsService: IxValidatorsService,
    private datasetStore: DatasetTreeStore,
    private slideInRef: IxSlideInRef<SnapshotAddFormComponent>,
    @Inject(SLIDE_IN_DATA) private datasetId: string,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.getDatasetOptions(),
      this.getNamingSchemaOptions(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ([datasetOptions, namingSchemaOptions]) => {
        this.datasetOptions$ = of(datasetOptions);
        this.namingSchemaOptions$ = of(namingSchemaOptions);
        this.isFormLoading = false;
        this.form.controls.name.markAsTouched();
        this.checkForVmsInDataset();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
    });

    merge(
      this.form.controls.recursive.valueChanges,
      this.form.controls.dataset.valueChanges,
    ).pipe(untilDestroyed(this)).subscribe(() => this.checkForVmsInDataset());

    if (this.datasetId) {
      this.setDataset();
    }
  }

  setDataset(): void {
    this.form.controls.dataset.setValue(this.datasetId);
  }

  onSubmit(): void {
    const values = this.form.value;
    const params: CreateZfsSnapshot = {
      dataset: values.dataset,
      recursive: values.recursive,
    };
    if (values.naming_schema) {
      params.naming_schema = values.naming_schema;
    } else {
      params.name = values.name;
    }

    if (this.hasVmsInDataset) {
      params.vmware_sync = values.vmware_sync;
    }

    this.isFormLoading = true;
    this.ws.call('zfs.snapshot.create', [params]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.slideInRef.close(true);
        this.datasetStore.datasetUpdated();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private getDefaultSnapshotName(): string {
    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `manual-${datetime}`;
  }

  private getDatasetOptions(): Observable<Option[]> {
    return this.ws.call('pool.dataset.query', [
      snapshotExcludeBootQueryFilter,
      { extra: { flat: true } },
    ]).pipe(
      map((datasets) => datasets.map((dataset) => ({ label: dataset.name, value: dataset.name }))),
    );
  }

  private getNamingSchemaOptions(): Observable<Option[]> {
    return this.ws.call('replication.list_naming_schemas').pipe(
      singleArrayToOptions(),
    );
  }

  private checkForVmsInDataset(): void {
    this.isFormLoading = true;
    this.ws.call('vmware.dataset_has_vms', [this.form.controls.dataset.value, this.form.controls.recursive.value])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (hasVmsInDataset) => {
          this.hasVmsInDataset = hasVmsInDataset;
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
