import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import {
  S3AuditMode,
  S3AuditOverflow,
  S3MultipartEtag,
  S3ObjectLockMode,
  S3PermissionsModel,
  S3Versioning,
  s3AuditAll,
  s3AuditModeLabels,
  s3AuditOverflowLabels,
  s3MultipartEtagLabels,
  s3ObjectLockModeLabels,
  s3PermissionsModelLabels,
  s3VersioningLabels,
} from 'app/enums/s3.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3AuditMask, S3Bucket, S3BucketCreate } from 'app/interfaces/s3.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { createS3GrantFormGroup, S3GrantFormGroup, toS3Grants } from 'app/pages/sharing/s3/s3-grants-list/s3-grant-form-group';
import { S3GrantsListComponent } from 'app/pages/sharing/s3/s3-grants-list/s3-grants-list.component';
import { createS3UserPickerProvider } from 'app/pages/sharing/s3/utils/s3-user-picker.utils';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

export const s3BucketNamePattern = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;

@Component({
  selector: 'ix-s3-bucket-form',
  templateUrl: './s3-bucket-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxExplorerComponent,
    IxUserPickerComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxChipsComponent,
    S3GrantsListComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class S3BucketFormComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private datasetService = inject(DatasetService);
  private validatorsService = inject(IxValidatorsService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<S3Bucket | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;

  protected readonly existingBucket = this.slideInRef.getData();
  protected readonly isNew = !this.existingBucket;
  protected readonly isLoading = signal(false);
  protected readonly isAdvancedMode = signal(false);
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  /**
   * Every dataset on the system. The bucket's dataset is created on submit and must not exist yet.
   */
  private readonly existingDatasets = signal<string[]>([]);

  readonly treeNodeProvider = this.datasetService.getDatasetNodeProvider();
  protected readonly ownerProvider = createS3UserPickerProvider();

  protected readonly permissionsModelOptions$ = of(mapToOptions(s3PermissionsModelLabels, this.translate));
  protected readonly versioningOptions$ = of(mapToOptions(s3VersioningLabels, this.translate));
  protected readonly multipartEtagOptions$ = of(mapToOptions(s3MultipartEtagLabels, this.translate));
  protected readonly objectLockModeOptions$ = of(mapToOptions(s3ObjectLockModeLabels, this.translate));
  protected readonly auditModeOptions$ = of(mapToOptions(s3AuditModeLabels, this.translate));
  protected readonly auditOverflowOptions$ = of(mapToOptions(s3AuditOverflowLabels, this.translate));
  protected readonly auditActionOptions$ = this.api.call('sharing.s3.audit_choices').pipe(choicesToOptions());

  protected readonly S3Versioning = S3Versioning;
  protected readonly S3AuditMode = S3AuditMode;

  form = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(63),
      Validators.pattern(s3BucketNamePattern),
      this.validatorsService.customValidator(
        (control) => !this.isNew || !this.existingDatasets().includes(
          `${String(control.parent?.get('parent_dataset')?.value ?? '')}/${String(control.value ?? '')}`,
        ),
        this.translate.instant('A dataset with this name already exists under the selected parent dataset.'),
      ),
    ]],
    // The explorer offers the /mnt root as a node. A dataset name never starts with a slash, so
    // that is the one selection to refuse.
    parent_dataset: ['', [
      Validators.required,
      this.validatorsService.customValidator(
        (control) => !String(control.value ?? '').startsWith('/'),
        this.translate.instant('Select a pool or dataset. The /mnt directory itself is not a dataset.'),
      ),
    ]],
    owner: ['', Validators.required],
    enabled: [true],
    // The middleware defaults to S3, but Bucket Owner Enforced is the model that works without any
    // extra ACL setup for grantees, so it is the better default for a form that hides it in basic mode.
    permissions_model: [S3PermissionsModel.BucketOwnerEnforced],
    grants: this.fb.array<S3GrantFormGroup>([]),
    versioning: [S3Versioning.Off],
    snapshot_versions: [[] as string[]],
    snapshot_versions_max: [64, [Validators.required, Validators.min(1)]],
    object_lock: [false],
    object_lock_default_mode: [null as S3ObjectLockMode | null],
    object_lock_default_days: [null as number | null, [Validators.min(1), Validators.max(36500)]],
    multipart_etag: [S3MultipartEtag.Composite],
    audit_mode: [S3AuditMode.Inherit],
    audit_actions: [[] as string[]],
    audit_overflow: [null as S3AuditOverflow | null],
  });

  /**
   * The dataset is the bucket's identity and cannot change after creation, so it is shown read-only.
   */
  protected readonly datasetControl = new FormControl({ value: this.existingBucket?.dataset ?? '', disabled: true });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly datasetHint = computed(() => {
    if (!this.isNew) {
      return '';
    }
    const { parent_dataset: parent, name } = this.formValue();
    if (!parent || !name) {
      return '';
    }
    return this.translate.instant('Bucket dataset: {dataset}', { dataset: `${parent}/${name}` });
  });

  protected readonly canUseObjectLock = computed(() => {
    const { versioning, permissions_model: permissionsModel } = this.formValue();
    return versioning === S3Versioning.Enabled && permissionsModel !== S3PermissionsModel.Multiprotocol;
  });

  protected readonly objectLockHint = computed(() => {
    return this.canUseObjectLock() ? '' : this.translate.instant(this.helptext.objectLockTooltip);
  });

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add S3 Bucket')
      : this.translate.instant('Edit S3 Bucket');
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => of(this.form.dirty));
  }

  ngOnInit(): void {
    if (this.existingBucket) {
      this.setBucketForEdit(this.existingBucket);
    } else {
      this.setupExistingDatasetCheck();
    }
    this.setupObjectLockDependency();
  }

  private setupExistingDatasetCheck(): void {
    this.api.call('pool.filesystem_choices').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((datasets) => {
      this.existingDatasets.set(datasets);
      this.form.controls.name.updateValueAndValidity();
    });

    // The check spans two fields, so a parent change has to re-run the name's validators.
    this.form.controls.parent_dataset.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form.controls.name.updateValueAndValidity();
    });
  }

  protected toggleAdvancedMode(): void {
    this.isAdvancedMode.set(!this.isAdvancedMode());
  }

  protected onSubmit(): void {
    const payload = this.buildPayload();

    let request$: Observable<S3Bucket>;
    if (this.existingBucket) {
      const { dataset, ...update } = payload;
      request$ = this.api.call('sharing.s3.update', [this.existingBucket.id, update]);
    } else {
      request$ = this.api.call('sharing.s3.create', [payload]);
    }

    this.isLoading.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.success(
          this.isNew
            ? this.translate.instant('S3 bucket created')
            : this.translate.instant('S3 bucket updated'),
        );
        this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.S3 }));
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private setBucketForEdit(bucket: S3Bucket): void {
    const [auditMode, auditActions] = this.auditMaskToForm(bucket.audit);
    bucket.grants.forEach((grant) => this.form.controls.grants.push(createS3GrantFormGroup(grant)));
    this.form.patchValue({
      ...bucket,
      audit_mode: auditMode,
      audit_actions: auditActions,
      audit_overflow: bucket.audit_overflow,
    });
    this.form.controls.parent_dataset.disable();
  }

  private setupObjectLockDependency(): void {
    this.syncObjectLockAvailability();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.syncObjectLockAvailability();
    });
  }

  private syncObjectLockAvailability(): void {
    const control = this.form.controls.object_lock;
    if (this.canUseObjectLock()) {
      if (control.disabled) {
        control.enable({ emitEvent: false });
      }
    } else if (control.enabled) {
      control.setValue(false, { emitEvent: false });
      control.disable({ emitEvent: false });
    }
  }

  private buildPayload(): S3BucketCreate {
    const values = this.form.getRawValue();
    const objectLock = values.object_lock;
    const hasDefaultRule = objectLock && values.object_lock_default_mode !== null;

    const payload: S3BucketCreate = {
      name: values.name,
      dataset: `${values.parent_dataset}/${values.name}`,
      owner: values.owner,
      enabled: values.enabled,
      permissions_model: values.permissions_model,
      grants: toS3Grants(this.form.controls.grants.controls),
      versioning: values.versioning,
      snapshot_versions: values.versioning === S3Versioning.Off ? [] : values.snapshot_versions,
      snapshot_versions_max: values.snapshot_versions_max,
      multipart_etag: values.multipart_etag,
      object_lock: objectLock,
      object_lock_default_mode: hasDefaultRule ? values.object_lock_default_mode : null,
      object_lock_default_days: hasDefaultRule ? values.object_lock_default_days : null,
    };

    if (this.isEnterprise()) {
      payload.audit = this.formToAuditMask(values.audit_mode, values.audit_actions);
      payload.audit_overflow = values.audit_overflow;
    }

    return payload;
  }

  private auditMaskToForm(mask: S3AuditMask | null): [S3AuditMode, string[]] {
    if (mask === null) {
      return [S3AuditMode.Inherit, []];
    }
    if (mask === s3AuditAll) {
      return [S3AuditMode.All, []];
    }
    if (!mask.length) {
      return [S3AuditMode.None, []];
    }
    return [S3AuditMode.Selected, mask];
  }

  private formToAuditMask(mode: S3AuditMode, actions: string[]): S3AuditMask | null {
    switch (mode) {
      case S3AuditMode.All:
        return s3AuditAll;
      case S3AuditMode.None:
        return [];
      case S3AuditMode.Selected:
        return actions;
      default:
        return null;
    }
  }
}
