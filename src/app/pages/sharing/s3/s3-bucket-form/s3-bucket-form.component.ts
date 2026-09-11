import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, map, merge, Observable, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import {
  S3AuditMode,
  S3AuditOverflow,
  S3MultipartEtag,
  S3ObjectLockMode,
  S3ObjectOwnership,
  S3PermissionsModel,
  S3Versioning,
  s3AuditAll,
  s3AuditModeLabels,
  s3AuditOverflowLabels,
  s3MultipartEtagLabels,
  s3ObjectLockModeLabels,
  s3ObjectOwnershipLabels,
  s3PermissionsModelLabels,
  s3VersioningLabels,
} from 'app/enums/s3.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { SelectOption } from 'app/interfaces/option.interface';
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
import { selectLicense } from 'app/store/system-info/system-info.selectors';

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
  /**
   * Auditing needs a license. Mirrors the middleware check (`system.license` is set) rather than
   * the product type, which is not a licensing signal.
   */
  protected readonly isLicensed = toSignal(this.store$.select(selectLicense).pipe(map((license) => !!license)));

  /**
   * Every dataset on the system. The bucket's dataset is created on submit and must not exist yet.
   */
  private readonly existingDatasets = signal<string[]>([]);

  readonly treeNodeProvider = this.datasetService.getDatasetNodeProvider();
  protected readonly ownerProvider = createS3UserPickerProvider();

  private readonly permissionsModelBaseOptions = mapToOptions(s3PermissionsModelLabels, this.translate);
  protected readonly objectOwnershipOptions$ = of(mapToOptions(s3ObjectOwnershipLabels, this.translate));
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
    // The middleware defaults: S3 with Bucket Owner Enforced ownership, the pairing under which
    // the grants are the whole of the access control and a grantee needs no permissions on the dataset.
    // The right defaults for a form that hides both in basic mode.
    permissions_model: [S3PermissionsModel.S3],
    object_ownership: [S3ObjectOwnership.BucketOwnerEnforced],
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

  /**
   * Object lock is a primary option (backup targets), so it drives versioning rather than depending
   * on it: checking it switches versioning on and keeps it there. The one thing that rules it out is
   * the Multiprotocol permissions model, under which another protocol could rewrite a locked object.
   */
  protected readonly isMultiprotocol = computed(() => {
    return this.formValue().permissions_model === S3PermissionsModel.Multiprotocol;
  });

  protected readonly canUseObjectLock = computed(() => !this.isMultiprotocol());

  protected readonly objectOwnershipHint = computed(() => {
    return this.isMultiprotocol() ? this.translate.instant(this.helptext.objectOwnershipMultiprotocolHint) : '';
  });

  protected readonly objectLockHint = computed(() => {
    return this.canUseObjectLock() ? '' : this.translate.instant(this.helptext.objectLockMultiprotocolHint);
  });

  protected readonly isObjectLockOn = computed(() => !!this.formValue().object_lock);

  /** Multiprotocol cannot be picked while object lock is on, for the same reason. */
  protected readonly permissionsModelOptions$: Observable<SelectOption<S3PermissionsModel>[]> = toObservable(
    this.isObjectLockOn,
  ).pipe(
    map((isObjectLockOn) => this.permissionsModelBaseOptions.map((option) => ({
      ...option,
      disabled: isObjectLockOn && option.value === S3PermissionsModel.Multiprotocol,
    }))),
  );

  protected readonly versioningHint = computed(() => {
    return this.isObjectLockOn() ? this.translate.instant(this.helptext.versioningLockedHint) : '';
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
      this.prefillParentDataset();
    }
    this.setupObjectLockDependency();
    this.setupObjectOwnershipDependency();
  }

  /**
   * The service's managed root dataset is where S3 protocol CreateBucket requests put their datasets,
   * so it is the natural default here too. Only a starting point: the field stays editable, and a
   * parent already typed before the config arrives is kept.
   */
  private prefillParentDataset(): void {
    this.api.call('s3.config').pipe(
      // A convenience only: the user can pick the parent themselves, so a failed read stays silent.
      catchError(() => EMPTY),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      const parent = this.form.controls.parent_dataset;
      if (config.managed_root_dataset && !parent.value) {
        parent.setValue(config.managed_root_dataset);
      }
    });
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
    this.defaultModeOffered = !!this.existingBucket?.object_lock;
    this.syncObjectLockAvailability();
    this.syncVersioningLock(this.form.controls.object_lock.value);
    this.syncHiddenControls();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.syncObjectLockAvailability();
    });
    // Compliance is offered once, the first time object lock is turned on for a bucket that did not
    // have it. After that a "no default rule", whether stored or picked here, survives an uncheck and
    // re-check: it is the only way to express object lock without a default rule.
    this.form.controls.object_lock.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((objectLock) => {
      if (objectLock && !this.defaultModeOffered && this.form.controls.object_lock_default_mode.value === null) {
        this.defaultModeOffered = true;
        this.form.controls.object_lock_default_mode.setValue(S3ObjectLockMode.Compliance);
      }
      this.syncVersioningLock(objectLock);
    });
    merge(
      this.form.controls.object_lock.valueChanges,
      this.form.controls.object_lock_default_mode.valueChanges,
      this.form.controls.versioning.valueChanges,
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.syncHiddenControls();
    });
  }

  /** What versioning was set to before object lock forced it on, restored when object lock is released. */
  private versioningBeforeLock: S3Versioning | null = null;

  /** Whether the Compliance default has been offered; a bucket stored with object lock starts offered. */
  private defaultModeOffered = false;

  /**
   * Object lock requires versioning, so the select is set to Enabled and held there while it is on.
   * Releasing it puts the previous choice back, so a check-then-uncheck in basic mode (where the
   * select is not even rendered) is a no-op rather than a silent switch to versioning.
   */
  private syncVersioningLock(objectLock: boolean): void {
    const versioning = this.form.controls.versioning;
    if (objectLock) {
      if (versioning.value !== S3Versioning.Enabled) {
        this.versioningBeforeLock = versioning.value;
        versioning.setValue(S3Versioning.Enabled);
      }
      versioning.disable({ emitEvent: false });
    } else if (versioning.disabled) {
      versioning.enable({ emitEvent: false });
      if (this.versioningBeforeLock !== null) {
        versioning.setValue(this.versioningBeforeLock);
        this.versioningBeforeLock = null;
      }
    }
  }

  /**
   * The retention period and the snapshot listing limit only render in some states. A hidden control
   * is disabled rather than left to its validators: `[required]` on the rendered input attaches
   * Angular's own validator, whose stale error would otherwise keep Save disabled with nothing on
   * screen to fix. A disabled control is excluded from validity regardless.
   */
  private syncHiddenControls(): void {
    const { versioning, object_lock: objectLock, object_lock_default_mode: defaultMode } = this.form.controls;
    this.setEnabled(this.form.controls.snapshot_versions_max, versioning.value !== S3Versioning.Off);
    this.setEnabled(this.form.controls.object_lock_default_days, !!objectLock.value && !!defaultMode.value);
  }

  private setEnabled(control: FormControl<unknown>, enabled: boolean): void {
    if (enabled && control.disabled) {
      control.enable();
    } else if (!enabled && control.enabled) {
      control.disable();
    }
  }

  /**
   * Middleware folds a Multiprotocol bucket to Object Writer ownership whatever it is given — the
   * other protocols' users own the filesystem permissions, so only the caller's own account may act,
   * and such a bucket supports no S3 ACLs under any value. The select shows that rather than offering
   * a choice middleware would overrule: it is set to Object Writer and held there while Multiprotocol
   * is selected, and the previous choice comes back when the model changes again.
   */
  private setupObjectOwnershipDependency(): void {
    this.syncObjectOwnership(this.form.controls.permissions_model.value);
    this.form.controls.permissions_model.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((model) => {
      this.syncObjectOwnership(model);
    });
  }

  /** What ownership was set to before Multiprotocol folded it, restored when the model changes back. */
  private ownershipBeforeMultiprotocol: S3ObjectOwnership | null = null;

  private syncObjectOwnership(model: S3PermissionsModel): void {
    const ownership = this.form.controls.object_ownership;
    if (model === S3PermissionsModel.Multiprotocol) {
      if (ownership.value !== S3ObjectOwnership.ObjectWriter) {
        this.ownershipBeforeMultiprotocol = ownership.value;
        ownership.setValue(S3ObjectOwnership.ObjectWriter);
      }
      ownership.disable({ emitEvent: false });
    } else if (ownership.disabled) {
      ownership.enable({ emitEvent: false });
      if (this.ownershipBeforeMultiprotocol !== null) {
        ownership.setValue(this.ownershipBeforeMultiprotocol);
        this.ownershipBeforeMultiprotocol = null;
      }
    }
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
      // Cleared silently above, so the dependants have to be updated by hand for the same reason.
      this.syncVersioningLock(false);
      this.syncHiddenControls();
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
      object_ownership: values.object_ownership,
      grants: toS3Grants(this.form.controls.grants.controls),
      versioning: values.versioning,
      snapshot_versions: values.versioning === S3Versioning.Off ? [] : values.snapshot_versions,
      // The listing limit only applies with versioning; without it the field is hidden and disabled, so
      // send the value the bucket already has rather than whatever was left behind.
      snapshot_versions_max: values.versioning === S3Versioning.Off
        ? (this.existingBucket?.snapshot_versions_max ?? 64)
        : values.snapshot_versions_max,
      multipart_etag: values.multipart_etag,
      object_lock: objectLock,
      object_lock_default_mode: hasDefaultRule ? values.object_lock_default_mode : null,
      object_lock_default_days: hasDefaultRule ? values.object_lock_default_days : null,
    };

    if (this.isLicensed()) {
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
