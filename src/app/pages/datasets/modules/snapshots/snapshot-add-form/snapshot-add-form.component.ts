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
  catchError, combineLatest, merge, Observable, of, Subject, switchMap, tap,
} from 'rxjs';
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
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { atLeastOne } from 'app/modules/forms/ix-forms/validators/at-least-one-validation';
import { requiredEmpty } from 'app/modules/forms/ix-forms/validators/required-empty-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
  private errorHandler = inject(ErrorHandlerService);
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

  /** Requests a VM check that isn't driven by a field edit (i.e. the initial load). */
  private readonly vmCheckRequests$ = new Subject<void>();

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
    // Subscribe before anything can trigger a check, so the first request is never dropped.
    // `switchMap` cancels an in-flight lookup when either field changes again, so only the newest
    // response can clear the Save gate or set `hasVmsInDataset` — an earlier, slower response can
    // neither re-enable Save early nor leave a stale flag behind (which would silently drop
    // `vmware_sync` from the payload).
    merge(
      this.vmCheckRequests$,
      this.form.controls.recursive.valueChanges,
      this.form.controls.dataset.valueChanges,
    ).pipe(
      tap(() => this.isCheckingVms.set(true)),
      switchMap(() => this.queryVmsInDataset()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((hasVmsInDataset) => {
      this.hasVmsInDataset = hasVmsInDataset;
      this.isCheckingVms.set(false);
    });

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
        this.vmCheckRequests$.next();
      },
      error: (error: unknown) => {
        // Both are read-only option lookups, so a failure can't map onto a control — surface it
        // rather than routing it through the form's validation errors. (Submit errors still go
        // through FormErrorHandlerService, inside `<ix-form>`.)
        this.errorHandler.showErrorModal(error);
        this.isFormLoading.set(false);
      },
    });

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
      // Owned by the form so every entry point confirms identically — the data-protection card
      // used to raise this itself, and the snapshot list confirmed nothing at all.
      successMessage: this.translate.instant('Snapshot added successfully.'),
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

  private queryVmsInDataset(): Observable<boolean> {
    return this.api
      .call('vmware.dataset_has_vms', [this.form.controls.dataset.value, this.form.controls.recursive.value])
      .pipe(
        // Caught here (inside the switchMap projection) so a failed lookup doesn't kill the
        // outer stream and stop every later check. It's a read-only lookup, so its failure
        // can't map onto a control — surface it rather than routing it through form validation.
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          return of(false);
        }),
      );
  }
}
