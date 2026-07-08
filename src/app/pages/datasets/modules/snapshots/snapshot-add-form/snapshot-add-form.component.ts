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
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { format } from 'date-fns';
import {
  combineLatest, merge, Observable, of,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { Option } from 'app/interfaces/option.interface';
import { CreateZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { atLeastOne } from 'app/modules/forms/ix-forms/validators/at-least-one-validation';
import { requiredEmpty } from 'app/modules/forms/ix-forms/validators/required-empty-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { StorageService } from 'app/services/storage.service';

@Component({
  selector: 'ix-snapshot-add-form',
  templateUrl: './snapshot-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    RequiresRolesDirective,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SnapshotAddFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private errorHandler = inject(FormErrorHandlerService);
  private validatorsService = inject(IxValidatorsService);
  private datasetStore = inject(DatasetTreeStore);
  private storageService = inject(StorageService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotWrite];

  protected isFormLoading = signal(true);
  protected datasetId: string | undefined;

  /**
   * Dataset to preset when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Unused in the legacy SlideIn host (which supplies it via `slideInRef.getData()`).
   */
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

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  datasetOptions$: Observable<Option[]>;
  namingSchemaOptions$: Observable<Option[]>;
  hasVmsInDataset = false;

  readonly helptext = helptextSnapshots;

  ngOnInit(): void {
    this.datasetId = this.slideInRef
      ? this.slideInRef.getData() as string | undefined
      : this.presetDatasetId();

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

    if (this.datasetId) {
      this.form.controls.dataset.setValue(this.datasetId);
    }
  }

  protected onSubmit(): void {
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

    this.isFormLoading.set(true);
    this.api.call('pool.snapshot.create', [params]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.close(true);
        this.datasetStore.datasetUpdated();
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

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
    this.isFormLoading.set(true);
    this.api.call('vmware.dataset_has_vms', [this.form.controls.dataset.value, this.form.controls.recursive.value])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (hasVmsInDataset) => {
          this.hasVmsInDataset = hasVmsInDataset;
          this.isFormLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isFormLoading.set(false);
        },
      });
  }
}
