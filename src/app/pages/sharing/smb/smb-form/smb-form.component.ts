import {
  AfterViewInit, ChangeDetectionStrategy, Component, OnInit, signal, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  endWith, Observable, of,
} from 'rxjs';
import {
  debounceTime, filter, map, switchMap, take, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { mapToOptionsWithHoverTooltips } from 'app/helpers/options.helper';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { SmbConfig } from 'app/interfaces/smb-config.interface';
import {
  externalSmbSharePath,
  FcpSmbShareOptions,
  smbSharePurposeTooltips, SmbSharePurpose, smbSharePurposeLabels, SmbShare,
  TimeMachineSmbShareOptions,
  LegacySmbShareOptions, SmbShareOptions,
} from 'app/interfaces/smb-share.interface';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { RestartSmbDialog } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { SmbExtensionsWarningComponent } from 'app/pages/sharing/smb/smb-form/smb-extensions-warning/smb-extensions-warning.component';
import { presetEnabledFields } from 'app/pages/sharing/smb/smb-form/smb-form-presets';
import { SmbUsersWarningComponent } from 'app/pages/sharing/smb/smb-form/smb-users-warning/smb-users-warning.component';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-smb-form',
  templateUrl: './smb-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxErrorsComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    WarningComponent,
    SmbUsersWarningComponent,
    SmbExtensionsWarningComponent,
  ],
})
export class SmbFormComponent implements OnInit, AfterViewInit {
  formatter = inject(IxFormatterService);
  private formBuilder = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private matDialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private datasetService = inject(DatasetService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private userService = inject(UserService);
  protected loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private filesystemService = inject(FilesystemService);
  private snackbar = inject(SnackbarService);
  private validatorsService = inject(IxValidatorsService);
  private store$ = inject<Store<ServicesState>>(Store);
  private smbValidationService = inject(SmbValidationService);
  slideInRef = inject<SlideInRef<{
    existingSmbShare?: SmbShare;
    defaultSmbShare?: SmbShare;
  } | undefined, boolean>>(SlideInRef);

  private existingSmbShare: SmbShare | undefined;
  private defaultSmbShare: SmbShare | undefined;

  protected isLoading = signal(false);
  protected showLegacyWarning = signal(false);
  protected showExtensionsWarning = signal(false);
  protected legacyWarningMessage = this.translate.instant(
    'For the best experience, we recommend choosing a modern SMB share purpose instead of the legacy option.',
  );

  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  protected SmbPresetType = SmbSharePurpose;
  protected isAdvancedMode = false;
  private namesInUse: string[] = [];
  protected readonly helptextSharingSmb = helptextSharingSmb;
  protected readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];

  private wasStripAclWarningShown = false;
  private smbConfig = signal<SmbConfig | null>(null);

  protected groupProvider: ChipsProvider = (query) => {
    return this.userService.groupQueryDsCache(query).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  title: string = helptextSharingSmb.formTitleAdd;

  createDatasetProps: Omit<DatasetCreate, 'name'> = {
    share_type: DatasetPreset.Smb,
  };

  get isNew(): boolean {
    return !this.existingSmbShare;
  }

  get showOtherOptions(): boolean {
    const excludedPurposes = [SmbSharePurpose.ExternalShare, SmbSharePurpose.VeeamRepositoryShare];

    return !excludedPurposes.includes(this.form.controls.purpose.value);
  }

  get isAsyncValidatorPending(): boolean {
    return this.form.controls.name.status === 'PENDING' && this.form.controls.name.touched;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    directoriesOnly: true,
    includeSnapshots: false,
  });

  protected purposeOptions$: Observable<SelectOption<SmbSharePurpose>[]>;

  get hasAddedAllowDenyHosts(): boolean {
    const hostsAllow = this.form.controls.hostsallow.value ?? [];
    const hostsDeny = this.form.controls.hostsdeny.value ?? [];

    const hasHosts = hostsAllow.length > 0 || hostsDeny.length > 0;

    return (this.isNew && hasHosts) || (!this.isNew && this.hasHostAllowDenyChanged(hostsAllow, hostsDeny));
  }

  private hasHostAllowDenyChanged(hostsAllow: string[], hostsDeny: string[]): boolean {
    if (!this.existingSmbShare) {
      return false;
    }

    const existingShareOptions = this.existingSmbShare.options as LegacySmbShareOptions;
    const existingAllow = existingShareOptions.hostsallow ?? [];
    const existingDeny = existingShareOptions.hostsdeny ?? [];

    return !isEqual(existingAllow, hostsAllow) || !isEqual(existingDeny, hostsDeny);
  }

  get isRestartRequired(): boolean {
    return this.isNewTimeMachineShare || this.isNewHomeShare || this.wasPathChanged || this.hasAddedAllowDenyHosts;
  }

  private isFieldEnabledForPurpose(fieldName: string, purpose: SmbSharePurpose): boolean {
    return presetEnabledFields[purpose]?.includes(fieldName as never) ?? false;
  }

  get isNewTimeMachineShare(): boolean {
    const currentPurpose = this.form.controls.purpose.value;

    // For new shares, check if Time Machine will be enabled
    if (this.isNew) {
      // Time Machine is enabled if purpose is TimeMachineShare OR if timemachine field is enabled and checked
      const isTimeMachinePurpose = currentPurpose === SmbSharePurpose.TimeMachineShare;
      const hasTimeMachineField = this.isFieldEnabledForPurpose('timemachine', currentPurpose) && this.form.controls.timemachine.value;
      return isTimeMachinePurpose || hasTimeMachineField;
    }

    // For existing shares, only trigger restart if Time Machine functionality actually changes
    const existingTimeMachine = (this.existingSmbShare?.options as LegacySmbShareOptions)?.timemachine;
    const existingIsTimeMachine = this.existingSmbShare?.purpose === SmbSharePurpose.TimeMachineShare
      || !!existingTimeMachine;

    const hasCurrentTimeMachineField = this.isFieldEnabledForPurpose('timemachine', currentPurpose) && this.form.controls.timemachine.value;
    const currentIsTimeMachine = currentPurpose === SmbSharePurpose.TimeMachineShare || hasCurrentTimeMachineField;

    return existingIsTimeMachine !== currentIsTimeMachine;
  }

  get isNewHomeShare(): boolean {
    const homeShare = this.form.controls.home.value;
    const existingHomeShare = (this.existingSmbShare?.options as LegacySmbShareOptions)?.home;

    return typeof homeShare === 'boolean'
      && ((this.isNew && homeShare) || (typeof existingHomeShare === 'boolean' && homeShare !== existingHomeShare));
  }

  get wasPathChanged(): boolean {
    if (this.isNew || !this.existingSmbShare?.path) {
      return false;
    }

    const currentPath = this.form.controls.path.value?.replace(/\/$/, '') || '';
    const existingPath = this.existingSmbShare.path.replace(/\/$/, '') || '';

    return currentPath !== existingPath;
  }

  protected rootNodes = signal<ExplorerNodeData[]>([]);

  private auditValidator(): ValidatorFn {
    return (control): ValidationErrors | null => {
      const auditGroup = control.value;
      if (!auditGroup.enable) {
        return null;
      }

      const watchList = auditGroup.watch_list || [];
      const ignoreList = auditGroup.ignore_list || [];

      if (watchList.length === 0 && ignoreList.length === 0) {
        return {
          auditRequiresGroups: {
            message: this.translate.instant(
              'At least one group must be specified in Watch List or Ignore List to enable audit logging.',
            ),
          },
        };
      }

      return null;
    };
  }

  protected form = this.formBuilder.group({
    // Common for all share purposes
    purpose: [SmbSharePurpose.DefaultShare as SmbSharePurpose | null],
    name: ['', Validators.required],
    path: ['', [Validators.required]],
    enabled: [true],
    comment: [''],
    readonly: [false],
    browsable: [true],
    access_based_share_enumeration: [false],
    audit: this.formBuilder.group({
      enable: [false],
      watch_list: [[] as string[]],
      ignore_list: [[] as string[]],
    }, { validators: this.auditValidator() }),

    // Only relevant to legacy shares
    recyclebin: [false],
    path_suffix: [null as string | null],
    hostsallow: [[] as string[]],
    hostsdeny: [[] as string[]],
    guestok: [false],
    streams: [false],
    durablehandle: [false],
    shadowcopy: [false],
    fsrvp: [false],
    home: [false],
    acl: [false],
    timemachine: [false],
    afp: [false],
    auxsmbconf: [''],

    // Other purpose-specific fields
    timemachine_quota: [null as number | null],
    aapl_name_mangling: [false],
    vuid: [null as string | null, [
      this.validatorsService.withMessage(
        Validators.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        this.translate.instant(this.translate.instant('Enter a valid UUID4 string.')),
      ),
    ]],
    auto_snapshot: [false],
    auto_dataset_creation: [false],
    dataset_naming_schema: [null as string | null],
    grace_period: [900 as number],
    auto_quota: [null as number | null],
    remote_path: [[] as string[], [
      Validators.required,
      this.validatorsService.withMessage(
        Validators.pattern(
          /^(([a-zA-Z0-9.-]+|(?:\d{1,3}\.){3}\d{1,3})\\[a-zA-Z0-9$_.-]+)(,\s*([a-zA-Z0-9.-]+|(?:\d{1,3}\.){3}\d{1,3})\\[a-zA-Z0-9$_.-]+)*$/,
        ),
        this.translate.instant('Invalid remote path. Valid examples: SERVER\\SHARE or 192.168.0.1\\SHARE'),
      ),
    ]],
  });

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.existingSmbShare = this.slideInRef.getData()?.existingSmbShare;
    this.defaultSmbShare = this.slideInRef.getData()?.defaultSmbShare;
    this.setupExplorerRootNodes();
    this.purposeOptions$ = of(this.buildPurposeOptions());
  }

  get shouldShowNamingSchema(): boolean {
    return (this.form.controls.dataset_naming_schema.enabled && this.form.controls.auto_dataset_creation.value)
      || this.form.controls.purpose.value === SmbSharePurpose.PrivateDatasetsShare;
  }

  private setupExplorerRootNodes(): void {
    this.filesystemService.getTopLevelDatasetsNodes().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (nodes) => {
        this.rootNodes.set(nodes);
      },
    });
  }

  ngOnInit(): void {
    this.setupPurposeControl();
    this.loadSmbConfig();

    if (this.defaultSmbShare) {
      this.form.patchValue(this.defaultSmbShare);
      this.setNameFromPath();
    }
    this.form.controls.path.addValidators(this.validatorsService.customValidator(
      getRootDatasetsValidator(this.existingSmbShare ? [this.existingSmbShare.path] : []),
      this.translate.instant('Sharing root datasets is not recommended. Please create a child dataset.'),
    ));

    this.clearPresets();
    this.setValuesFromPreset(this.form.controls.purpose.value);

    if (this.existingSmbShare) {
      this.setSmbShareForEdit(this.existingSmbShare);
    }

    this.setupAutoDatasetCreationControl();
    this.setupAfpWarning();
    this.setupMangleWarning();
    this.setupPathControl();
    this.setupAclControl();
  }

  ngAfterViewInit(): void {
    this.form.controls.name.addAsyncValidators([
      this.smbValidationService.validate(this.existingSmbShare?.name),
    ]);
  }

  private setupAclControl(): void {
    this.form.controls.acl
      .valueChanges.pipe(debounceTime(100), untilDestroyed(this))
      .subscribe((acl) => {
        this.checkAndShowStripAclWarning(this.form.controls.path.value, acl);
      });
  }

  private setupMangleWarning(): void {
    this.form.controls.aapl_name_mangling.valueChanges.pipe(
      filter((value) => {
        if (this.isNew) {
          return false;
        }

        // Check if the original share purpose supported aapl_name_mangling
        const originalPurpose = this.existingSmbShare?.purpose;
        const originalSupportedFields = originalPurpose ? presetEnabledFields[originalPurpose] : [];
        const wasFieldSupported = originalSupportedFields?.includes('aapl_name_mangling') ?? false;

        // Only show warning if the field was supported in the original purpose and the value actually changed
        return wasFieldSupported
          && value !== (this.existingSmbShare?.options as LegacySmbShareOptions)?.aapl_name_mangling;
      }),
      take(1),
      switchMap(() => this.dialogService.confirm({
        title: this.translate.instant(helptextSharingSmb.manglingDialog.title),
        message: this.translate.instant(helptextSharingSmb.manglingDialog.message),
        hideCheckbox: true,
        buttonText: this.translate.instant(helptextSharingSmb.manglingDialog.action),
        hideCancel: true,
      })),
      untilDestroyed(this),
    )
      .subscribe();
  }

  private setupAutoDatasetCreationControl(): void {
    this.form.controls.auto_dataset_creation.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe((autoCreate) => {
      if (!autoCreate) {
        this.form.controls.dataset_naming_schema.setValue(null);
      }
    });
  }

  private setupPathControl(): void {
    this.form.controls.path.valueChanges.pipe(
      debounceTime(50),
      tap(() => {
        const pathValue = this.form.controls.path.value?.toUpperCase() || '';

        // Check if path is external (starts with EXTERNAL or matches IP\SHARE pattern)
        if (this.isExternalPath(pathValue)) {
          this.form.controls.purpose.setValue(SmbSharePurpose.ExternalShare);
        }

        this.setNameFromPath();
      }),
      untilDestroyed(this),
    )
      .subscribe((path) => {
        this.checkAndShowStripAclWarning(path, this.form.controls.acl.value);
      });
  }

  private isExternalPath(path: string): boolean {
    if (!path) return false;

    // Check if path starts with EXTERNAL (case insensitive)
    if (path.toUpperCase().startsWith(externalSmbSharePath.toUpperCase())) {
      return true;
    }

    // Check if path matches IP\SHARE pattern (e.g., 192.168.0.200\SHARE)
    const ipSharePattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\\[^\\]+$/;
    return ipSharePattern.test(path);
  }

  private setupAfpWarning(): void {
    this.form.controls.afp.valueChanges.pipe(untilDestroyed(this))
      .subscribe((value: boolean) => {
        this.afpConfirmEnable(value);
      });
  }

  private setupPurposeControl(): void {
    this.form.controls.purpose.valueChanges.pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.showLegacyWarning.set(value === SmbSharePurpose.LegacyShare);
        this.updateExtensionsWarning();

        this.clearPresets();

        if (value) {
          this.setValuesFromPreset(value);
        }
      });
  }

  private setNameFromPath(): void {
    const pathControl = this.form.controls.path;
    if (!pathControl.value) {
      return;
    }
    const nameControl = this.form.controls.name;
    if (pathControl.value && (!nameControl.value || !nameControl.dirty)) {
      const name = pathControl.value.split('/').pop();
      if (!name) {
        return;
      }

      nameControl.setValue(name.toLowerCase());
      nameControl.markAsTouched();
    }
  }

  private checkAndShowStripAclWarning(path: string, aclValue: boolean): void {
    // Only show ACL strip warning for Legacy Share type, as it's the only purpose with "Enable ACL" option
    if (
      this.wasStripAclWarningShown
      || !path
      || aclValue
      || this.form.controls.purpose.value !== SmbSharePurpose.LegacyShare
      || this.isExternalPath(path)
    ) {
      return;
    }

    this.api
      .call('filesystem.stat', [path])
      .pipe(untilDestroyed(this))
      .subscribe((stat) => {
        if (stat.acl) {
          this.wasStripAclWarningShown = true;
          this.showStripAclWarning();
        }
      });
  }

  private setValuesFromPreset(preset: SmbSharePurpose): void {
    const enabledFields = presetEnabledFields[preset];

    if (preset === SmbSharePurpose.ExternalShare) {
      this.form.controls.path.patchValue(externalSmbSharePath, { emitEvent: false });
    } else if (this.form.controls.path.value === externalSmbSharePath) {
      this.form.controls.path.patchValue(null, { emitEvent: false });
    }

    if (!enabledFields) return;

    enabledFields.forEach((field) => {
      const control = this.form.controls[field as keyof typeof this.form.controls];
      if (control) {
        control.enable({ emitEvent: false });

        // Set default values for fields that need them when enabled
        if (field === 'auto_quota' && control.value === null) {
          (control as FormControl).patchValue(0, { emitEvent: false });
        }

        // For FCP_SHARE, force aapl_name_mangling to true and disable it
        if (preset === SmbSharePurpose.FcpShare && field === 'aapl_name_mangling') {
          (control as FormControl).patchValue(true, { emitEvent: false });
          control.disable({ emitEvent: false });
        }
      }
    });
  }

  private showStripAclWarning(): void {
    this.dialogService
      .confirm({
        title: this.translate.instant(helptextSharingSmb.stripACLDialog.title),
        message: this.translate.instant(helptextSharingSmb.stripACLDialog.message),
        hideCheckbox: true,
        buttonText: this.translate.instant(helptextSharingSmb.stripACLDialog.button),
        hideCancel: true,
      })
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private clearPresets(): void {
    Object.values(presetEnabledFields).forEach((fields) => {
      fields?.forEach((field) => {
        // eslint-disable-next-line no-restricted-syntax
        const control = this.form.get(field as string);
        if (control) {
          control.reset();
          control.disable({ emitEvent: false });
        }
      });
    });
  }

  private setSmbShareForEdit(share: SmbShare): void {
    this.title = helptextSharingSmb.formTitleEdit;

    const index = this.namesInUse.findIndex((name) => name === share.name);
    if (index >= 0) {
      this.namesInUse.splice(index, 1);
    }

    const flatShare = {
      ...share,
      ...share.options,
    };
    delete flatShare.options;

    if (!flatShare.purpose) {
      flatShare.purpose = SmbSharePurpose.LegacyShare;
    }

    this.form.patchValue(flatShare);
  }

  private afpConfirmEnable(value: boolean): void {
    if (!value) {
      return;
    }
    const afpControl = this.form.controls.afp;
    this.dialogService
      .confirm({
        title: this.translate.instant(helptextSharingSmb.afpWarningTitle),
        message: this.translate.instant(helptextSharingSmb.afpWarningMessage),
        hideCheckbox: false,
        buttonText: this.translate.instant(helptextSharingSmb.afpDialogButton),
        hideCancel: false,
      })
      .pipe(untilDestroyed(this))
      .subscribe((dialogResult: boolean) => {
        if (!dialogResult) {
          afpControl.setValue(!value);
        }
      });
  }

  protected submit(): void {
    const smbShare = { ...this.form.value } as SmbShare;
    const purpose = smbShare.purpose;
    const presetFields = presetEnabledFields[purpose] ?? [];

    if (purpose) {
      const options = { } as SmbShareOptions;

      // Move related fields from root into `options` and delete them from root
      for (const field of presetFields) {
        const value = smbShare[field as keyof typeof smbShare];
        if (value !== undefined) {
          (options as Record<string, unknown>)[field as keyof SmbShareOptions] = value;
          delete smbShare[field as keyof typeof smbShare];
        }
      }

      smbShare.options = options;
    }

    // For FCP_SHARE, ensure aapl_name_mangling is in options even though control is disabled
    if (purpose === SmbSharePurpose.FcpShare) {
      const fcpOptions = smbShare.options as FcpSmbShareOptions;
      fcpOptions.aapl_name_mangling = true;
    }

    // Convert empty string to null for dataset_naming_schema to allow server defaults
    const timeMachineOptions = smbShare.options as TimeMachineSmbShareOptions;
    if (timeMachineOptions?.dataset_naming_schema === '') {
      timeMachineOptions.dataset_naming_schema = null;
    }

    if (
      presetFields.includes('timemachine_quota')
      && (timeMachineOptions.timemachine_quota === null || timeMachineOptions.timemachine_quota === undefined)
    ) {
      timeMachineOptions.timemachine_quota = 0;
    }

    let request$: Observable<SmbShare>;

    if (this.existingSmbShare) {
      request$ = this.api.call('sharing.smb.update', [this.existingSmbShare.id, smbShare]);
    } else {
      request$ = this.api.call('sharing.smb.create', [smbShare]);
    }

    this.datasetService.rootLevelDatasetWarning(
      smbShare.path,
      this.translate.instant(helptextSharingSmb.rootLevelWarning),
      !this.form.controls.path.dirty || smbShare.purpose === SmbSharePurpose.ExternalShare,
    ).pipe(
      filter(Boolean),
      tap(() => {
        this.isLoading.set(true);
      }),
      switchMap(() => request$),
      switchMap((smbShareResponse) => this.restartCifsServiceIfNecessary().pipe(
        map(() => smbShareResponse),
      )),
      switchMap((smbShareResponse) => this.shouldRedirectToAclEdit().pipe(
        map((shouldRedirect) => ({ smbShareResponse, shouldRedirect })),
      )),
      untilDestroyed(this),
    ).subscribe({
      next: ({ smbShareResponse, shouldRedirect }) => {
        this.isLoading.set(false);
        if (shouldRedirect) {
          this.dialogService.confirm({
            title: this.translate.instant('Configure ACL'),
            message: this.translate.instant('Do you want to configure the ACL?'),
            buttonText: this.translate.instant('Configure'),
            cancelText: this.translate.instant('No'),
            hideCheckbox: true,
          }).pipe(untilDestroyed(this)).subscribe((isConfigure) => {
            if (isConfigure) {
              const homeShare = this.form.controls.home.value;
              this.router.navigate(
                ['/', 'datasets', 'acl', 'edit'],
                { queryParams: { homeShare, path: smbShareResponse.path } },
              );
            }
            this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
            this.slideInRef.close({ response: true });
          });
        } else {
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
          this.slideInRef.close({ response: true });
        }
      },
      error: (error: unknown) => {
        const apiError = extractApiErrorDetails(error);

        if (apiError?.reason?.includes('[ENOENT]') || apiError?.reason?.includes('[EXDEV]')) {
          this.dialogService.closeAllDialogs();
        }

        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form, {}, 'smb-form-toggle-advanced-options');
      },
    });
  }

  private restartCifsServiceIfNecessary(): Observable<boolean> {
    return this.promptIfRestartRequired().pipe(
      switchMap((shouldRestart) => {
        if (shouldRestart) {
          return this.restartCifsService();
        }
        return of(false);
      }),
    );
  }

  private promptIfRestartRequired(): Observable<boolean> {
    return this.store$.select(selectService(ServiceName.Cifs)).pipe(
      filter((service) => !!service),
      map((service) => service.state === ServiceStatus.Running),
      switchMap((isRunning) => {
        if (isRunning && this.isRestartRequired) {
          return this.matDialog.open(RestartSmbDialog, {
            data: {
              timemachine: this.isNewTimeMachineShare,
              homeshare: this.isNewHomeShare,
              path: this.wasPathChanged,
              hosts: this.hasAddedAllowDenyHosts,
              isNew: this.isNew,
            },
          }).afterClosed();
        }
        return of(false);
      }),
      take(1),
    );
  }

  restartCifsService = (): Observable<boolean> => {
    this.loader.open();
    return this.api.job('service.control', [ServiceOperation.Restart, ServiceName.Cifs, { silent: false }]).pipe(
      tap({
        complete: () => {
          this.loader.close();
          this.snackbar.success(
            this.translate.instant(
              helptextSharingSmb.restartedSmbDialog.message,
            ),
          );
        },
      }),
      endWith(true),
      filter((job) => job === true),
    );
  };

  private shouldRedirectToAclEdit(): Observable<boolean> {
    // Only show ACL configuration dialog for new share creation, not for editing existing shares
    if (!this.isNew) {
      return of(false);
    }

    const sharePath: string = this.form.controls.path.value;
    const datasetId = sharePath.replace('/mnt/', '');

    if (
      this.form.controls.purpose.value === SmbSharePurpose.ExternalShare
      || this.isExternalPath(sharePath)
      || !datasetId.includes('/')
    ) {
      return of(false);
    }

    return this.api.call('filesystem.stat', [sharePath]).pipe(
      switchMap((stat) => {
        // For shares with ACL control enabled, check if ACL setting differs from filesystem
        if (this.form.controls.acl.enabled) {
          return of(stat.acl !== this.form.controls.acl.value);
        }

        // For shares without ACL control (modern purposes), check if filesystem has ACLs
        // and we might need to configure them
        return of(stat.acl);
      }),
    );
  }

  private buildPurposeOptions(): SelectOption<SmbSharePurpose>[] {
    let options = mapToOptionsWithHoverTooltips(
      smbSharePurposeLabels,
      smbSharePurposeTooltips,
      this.translate,
    );

    if (this.isNew || (!this.isNew && this.existingSmbShare?.purpose !== SmbSharePurpose.LegacyShare)) {
      options = options.filter((option) => option.value !== SmbSharePurpose.LegacyShare);
    }

    if (!this.isEnterprise()) {
      options = options.filter((option) => option.value !== SmbSharePurpose.VeeamRepositoryShare);
    }

    return options;
  }

  private updateExtensionsWarning(): void {
    const purpose = this.form.controls.purpose.value;
    const requiresExtensions = purpose === SmbSharePurpose.TimeMachineShare
      || purpose === SmbSharePurpose.FcpShare;
    this.showExtensionsWarning.set(
      !this.smbConfig()?.aapl_extensions && requiresExtensions,
    );
  }

  private loadSmbConfig(): void {
    this.api.call('smb.config')
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((config) => {
        this.smbConfig.set(config);
        this.updateExtensionsWarning();
      });
  }

  protected extensionsEnabled(): void {
    this.smbConfig.set({
      ...this.smbConfig(),
      aapl_extensions: true,
    });

    this.updateExtensionsWarning();
  }
}
