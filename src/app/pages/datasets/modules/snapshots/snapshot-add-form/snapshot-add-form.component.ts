import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns-tz';
import {
  combineLatest, merge, Observable, of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { atLeastOne } from 'app/modules/forms/ix-forms/validators/at-least-one-validation';
import { requiredEmpty } from 'app/modules/forms/ix-forms/validators/required-empty-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  snapshotExcludeBootQueryFilter,
} from 'app/pages/datasets/modules/snapshots/constants/snapshot-exclude-boot.constant';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-add-form',
  templateUrl: './snapshot-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    RequiresRolesDirective,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SnapshotAddFormComponent implements OnInit {
  readonly requiredRoles = [Role.SnapshotWrite];

  isFormLoading = true;
  form = this.fb.group({
    dataset: ['', Validators.required],
    name: [this.getDefaultSnapshotName(), [this.validatorsService.withMessage(
      atLeastOne('naming_schema', [helptextSnapshots.snapshot_add_name_placeholder, helptextSnapshots.snapshot_add_naming_schema_placeholder]),
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

  readonly helptext = helptextSnapshots;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private authService: AuthService,
    private errorHandler: FormErrorHandlerService,
    private validatorsService: IxValidatorsService,
    private datasetStore: DatasetTreeStore,
    private slideInRef: SlideInRef<SnapshotAddFormComponent>,
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
      error: (error: unknown) => {
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
      error: (error: unknown) => {
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
      snapshotExcludeBootQueryFilter as QueryFilters<Dataset>,
      { extra: { flat: true } },
    ]).pipe(
      map((datasets) => datasets.map((dataset) => ({ label: dataset.name, value: dataset.name }))),
    );
  }

  private getNamingSchemaOptions(): Observable<Option[]> {
    return this.authService.hasRole([Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull]).pipe(
      switchMap((hasAccess) => {
        if (!hasAccess) {
          return of([]);
        }

        return this.ws.call('replication.list_naming_schemas').pipe(
          singleArrayToOptions(),
        );
      }),
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
        error: (error: unknown) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
