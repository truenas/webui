import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { format } from 'date-fns';
import {
  combineLatest, merge, Observable, of,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { Option } from 'app/interfaces/option.interface';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { atLeastOne } from 'app/modules/forms/ix-forms/validators/at-least-one-validation';
import { requiredEmpty } from 'app/modules/forms/ix-forms/validators/required-empty-validation';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { StorageService } from 'app/services/storage.service';

@Component({
  selector: 'ix-snapshot-add-form',
  templateUrl: './snapshot-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SnapshotAddFormComponent extends IxFormHostForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private errorHandler = inject(FormErrorHandlerService);
  private validatorsService = inject(IxValidatorsService);
  private datasetStore = inject(DatasetTreeStore);
  private storageService = inject(StorageService);
  private destroyRef = inject(DestroyRef);

  /** Read by the `<tn-side-panel>` host to role-gate its footer Save. */
  readonly requiredRoles = [Role.SnapshotWrite];

  /** Initial options load. Drives the panel's progress bar and busy overlay. */
  protected isFormLoading = signal(true);

  /**
   * The background `vmware.dataset_has_vms` lookup, re-run on every dataset/recursive change. Only
   * gates Save — routing it through the panel's busy state would dim and lock the whole form
   * mid-edit each time either field is touched.
   */
  protected isCheckingVms = signal(false);

  /** Dataset to preset, supplied by the `<tn-side-panel>` host. */
  readonly presetDatasetId = input<string | undefined>(undefined);

  form = this.fb.nonNullable.group({
    dataset: ['', Validators.required],
    name: [this.getDefaultSnapshotName(), [this.validatorsService.withMessage(
      atLeastOne('naming_schema', [helptextSnapshots.nameLabel, helptextSnapshots.namingSchemaLabel]),
      this.translate.instant('Name or Naming Schema must be provided.'),
    ), this.validatorsService.validateOnCondition(
      (control: AbstractControl) => control.value && control.parent?.get('naming_schema')?.value,
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

  ngOnInit(): void {
    combineLatest([
      this.getDatasetOptions(),
      this.getNamingSchemaOptions(),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([datasetOptions, namingSchemaOptions]) => {
        this.datasetOptions$ = of(datasetOptions);
        this.namingSchemaOptions$ = of(namingSchemaOptions);
        this.isFormLoading.set(false);
        this.form.controls.name.markAsTouched();
        this.checkForVmsInDataset();
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.isFormLoading.set(false);
      },
    });

    merge(
      this.form.controls.recursive.valueChanges,
      this.form.controls.dataset.valueChanges,
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.checkForVmsInDataset());

    const presetDatasetId = this.presetDatasetId();
    if (presetDatasetId) {
      this.form.controls.dataset.setValue(presetDatasetId);
    }
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const values = this.form.getRawValue();
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

    return {
      request$: this.api.call('pool.snapshot.create', [params]),
      // Never rendered — the wrapper's snackbar is suppressed (creating a snapshot has never
      // announced), so don't mint a translation key for it.
      successMessage: ignoreTranslation(''),
      onSuccess: () => this.datasetStore.datasetUpdated(),
    };
  };

  private getDefaultSnapshotName(): string {
    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');
    return `manual-${datetime}`;
  }

  private getDatasetOptions(): Observable<Option[]> {
    return this.storageService.getDatasetNameOptions();
  }

  private getNamingSchemaOptions(): Observable<Option[]> {
    return this.authService.hasRole([Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull]).pipe(
      switchMap((hasAccess) => {
        if (!hasAccess) {
          return of([]);
        }

        return this.api.call('replication.list_naming_schemas').pipe(
          singleArrayToOptions(),
        );
      }),
    );
  }

  private checkForVmsInDataset(): void {
    this.isCheckingVms.set(true);
    this.api.call('vmware.dataset_has_vms', [this.form.controls.dataset.value, this.form.controls.recursive.value])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (hasVmsInDataset) => {
          this.hasVmsInDataset = hasVmsInDataset;
          this.isCheckingVms.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isCheckingVms.set(false);
        },
      });
  }
}
