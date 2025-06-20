import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
} from '@angular/core';
import {
  AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators,
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
import {
  externalSmbSharePath,
  smbPresetTooltips, SmbPresetType, smbPresetTypeLabels, SmbShareOptions, SmbShare,
  TimeMachineSmbShareOptions,
} from 'app/interfaces/smb-share.interface';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { RestartSmbDialog } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { presetEnabledFields } from 'app/pages/sharing/smb/smb-form/smb-form-presets';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-smb-form',
  styleUrls: ['./smb-form.component.scss'],
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
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    IxIconComponent,
  ],
})
export class SmbFormComponent implements OnInit, AfterViewInit {
  private existingSmbShare: SmbShare | undefined;
  private defaultSmbShare: SmbShare | undefined;

  protected isLoading = signal(false);
  protected hasSmbUsers = signal(true);
  protected SmbPresetType = SmbPresetType;
  protected isAdvancedMode = false;
  private namesInUse: string[] = [];
  protected readonly helptextSharingSmb = helptextSharingSmb;
  protected readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  private wasStripAclWarningShown = false;

  groupProvider: ChipsProvider = (query) => {
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

  get isAsyncValidatorPending(): boolean {
    return this.form.controls.name.status === 'PENDING' && this.form.controls.name.touched;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    directoriesOnly: true,
    includeSnapshots: false,
  });

  protected presetFields: (keyof SmbShare)[] = [];
  protected purposeOptions$: Observable<SelectOption<SmbPresetType>[]>;

  get hasAddedAllowDenyHosts(): boolean {
    const hostsallow = this.form.controls.hostsallow.value;
    const hostsdeny = this.form.controls.hostsdeny.value;
    return (
      (this.isNew && hostsallow && hostsallow.length > 0)
      || (this.isNew && hostsdeny && hostsdeny.length > 0)
      || this.hasHostAllowDenyChanged(hostsallow, hostsdeny)
    );
  }

  protected hasHostAllowDenyChanged(hostsallow: string[], hostsdeny: string[]): boolean {
    return (
      !isEqual(this.existingSmbShare?.hostsallow, hostsallow)
      || !isEqual(this.existingSmbShare?.hostsdeny, hostsdeny)
    );
  }

  get isRestartRequired(): boolean {
    return (
      this.isNewTimemachineShare
      || this.isNewHomeShare
      || this.wasPathChanged
      || this.hasAddedAllowDenyHosts
    );
  }

  get isNewTimemachineShare(): boolean {
    const timemachine = this.form.controls.timemachine.value;
    return (
      (this.isNew && timemachine)
      || timemachine !== this.existingSmbShare?.timemachine
    );
  }

  get isNewHomeShare(): boolean {
    const homeShare = this.form.controls.home.value;
    return (
      (this.isNew && homeShare) || homeShare !== this.existingSmbShare?.home
    );
  }

  get wasPathChanged(): boolean {
    return (
      !this.isNew && this.form.controls.path.value !== this.existingSmbShare?.path
    );
  }

  protected rootNodes = signal<ExplorerNodeData[]>([]);

  hostsAllowTooltip = this.translate.instant('Enter a list of allowed hostnames or IP addresses.\
    Separate entries by pressing <code>Enter</code>. A more detailed description \
    with examples can be found \
    <a href="{url}" target="_blank">here</a>. <br><br> \
    If neither *Hosts Allow* or *Hosts Deny* contains \
    an entry, then SMB share access is allowed for any host. <br><br> \
    If there is a *Hosts Allow* list but no *Hosts Deny* list, then only allow \
    hosts on the *Hosts Allow* list. <br><br> \
    If there is a *Hosts Deny* list but no *Hosts Allow* list, then allow all \
    hosts that are not on the *Hosts Deny* list. <br><br> \
    If there is both a *Hosts Allow* and *Hosts Deny* list, then allow all hosts \
    that are on the *Hosts Allow* list. <br><br> \
    If there is a host not on the *Hosts Allow* and not on the *Hosts Deny* list, \
    then allow it.', { url: 'https://wiki.samba.org/index.php/1.4_Samba_Security' });

  form = this.formBuilder.group({
    path: ['', [Validators.required]],
    name: ['', Validators.required],
    purpose: [SmbPresetType.DefaultShare as SmbPresetType | null, [
      this.validatorsService.customValidator(
        (control: AbstractControl) => control.value !== SmbPresetType.LegacyShare,
        this.translate.instant('Select a new purpose before saving.'),
      ),
    ]],
    comment: [''],
    enabled: [true],
    acl: [false],
    ro: [false],
    browsable: [true],
    guestok: [false],
    abe: [false],
    hostsallow: [[] as string[]],
    hostsdeny: [[] as string[]],
    home: [false],
    timemachine: [false],
    timemachine_quota: [null as number | null],
    afp: [false],
    shadowcopy: [false],
    recyclebin: [false],
    aapl_name_mangling: [false],
    streams: [false],
    durablehandle: [false],
    fsrvp: [false],
    path_suffix: [''],
    auxsmbconf: [''],
    vuid: ['', [
      this.validatorsService.withMessage(
        Validators.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        this.translate.instant(this.translate.instant('Enter a valid UUID4 string.')),
      ),
    ]],
    auto_snapshot: [false],
    auto_dataset_creation: [false],
    dataset_naming_schema: [''],
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
    audit: this.formBuilder.group({
      enable: [false],
      watch_list: [[] as string[]],
      ignore_list: [[] as string[]],
    }),
  });

  constructor(
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private formBuilder: NonNullableFormBuilder,
    private api: ApiService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private datasetService: DatasetService,
    private translate: TranslateService,
    private router: Router,
    private userService: UserService,
    protected loader: LoaderService,
    private formErrorHandler: FormErrorHandlerService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
    private validatorsService: IxValidatorsService,
    private store$: Store<ServicesState>,
    private smbValidationService: SmbValidationService,
    public slideInRef: SlideInRef<{ existingSmbShare?: SmbShare; defaultSmbShare?: SmbShare } | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.existingSmbShare = this.slideInRef.getData()?.existingSmbShare;
    this.defaultSmbShare = this.slideInRef.getData()?.defaultSmbShare;
    this.setupExplorerRootNodes();
    this.purposeOptions$ = of(this.buildPurposeOptions());
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
    this.checkForSmbUsersWarning();

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

  setupAclControl(): void {
    this.form.controls.acl
      .valueChanges.pipe(debounceTime(100), untilDestroyed(this))
      .subscribe((acl) => {
        this.checkAndShowStripAclWarning(this.form.controls.path.value, acl);
      });
  }

  setupMangleWarning(): void {
    this.form.controls.aapl_name_mangling.valueChanges.pipe(
      filter(
        (value) => value !== this.existingSmbShare?.aapl_name_mangling && !this.isNew,
      ),
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

  setupPathControl(): void {
    this.form.controls.path.valueChanges.pipe(
      debounceTime(50),
      tap(() => this.setNameFromPath()),
      untilDestroyed(this),
    )
      .subscribe((path) => {
        this.checkAndShowStripAclWarning(path, this.form.controls.acl.value);
      });
  }

  setupAfpWarning(): void {
    this.form.controls.afp.valueChanges.pipe(untilDestroyed(this))
      .subscribe((value: boolean) => {
        this.afpConfirmEnable(value);
      });
  }

  setupPurposeControl(): void {
    this.form.controls.purpose.valueChanges.pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.clearPresets();

        if (value) {
          this.setValuesFromPreset(value);
        }
      });
  }

  protected setNameFromPath(): void {
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

      nameControl.setValue(name);
      nameControl.markAsTouched();
    }
    this.cdr.markForCheck();
  }

  protected checkAndShowStripAclWarning(path: string, aclValue: boolean): void {
    if (this.wasStripAclWarningShown || !path || aclValue) {
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

  setValuesFromPreset(preset: SmbPresetType): void {
    const enabledFields = presetEnabledFields[preset];

    if (preset === SmbPresetType.ExternalShare) {
      this.form.controls.path.patchValue(externalSmbSharePath, { emitEvent: false });
    } else if (preset !== this.form.controls.purpose.value) {
      this.form.controls.path.patchValue('', { emitEvent: false });
    }

    if (!enabledFields) return;

    enabledFields.forEach((field) => {
    // eslint-disable-next-line no-restricted-syntax
      const ctrl = this.form.get(field as string);
      if (ctrl) {
        ctrl.enable({ emitEvent: false });
      }
    });

    this.cdr.markForCheck();
  }

  protected showStripAclWarning(): void {
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

  clearPresets(): void {
    Object.values(presetEnabledFields).forEach((fields) => {
      fields?.forEach((field) => {
        // eslint-disable-next-line no-restricted-syntax
        const control = this.form.get(field as string);
        if (control) {
          control.disable({ emitEvent: false });
        }
      });
    });
  }

  protected setSmbShareForEdit(share: SmbShare): void {
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
      flatShare.purpose = SmbPresetType.LegacyShare;
    }

    if (share.purpose === SmbPresetType.LegacyShare) {
      this.dialogService.warn(
        this.translate.instant('Legacy Share'),
        this.translate.instant('To save changes, choose a new purpose. Legacy shares cannot be edited without migrating.'),
      );
    }

    this.form.patchValue(flatShare);
  }

  protected afpConfirmEnable(value: boolean): void {
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
      const options: Partial<SmbShareOptions> = { purpose } as SmbShareOptions;

      // Move related fields from root into `options` and delete them from root
      for (const field of presetFields) {
        const value = smbShare[field as keyof typeof smbShare];
        if (value !== undefined) {
          (options as Record<string, unknown>)[field as keyof SmbShareOptions] = value;
          delete smbShare[field as keyof typeof smbShare];
        }
      }

      smbShare.options = options as SmbShareOptions;
    }

    const timeMachineOptions = smbShare.options as TimeMachineSmbShareOptions;

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
      !this.form.controls.path.dirty,
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
                { queryParams: { homeShare, path: smbShareResponse.path_local } },
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

  protected restartCifsServiceIfNecessary(): Observable<boolean> {
    return this.promptIfRestartRequired().pipe(
      switchMap((shouldRestart) => {
        if (shouldRestart) {
          return this.restartCifsService();
        }
        return of(false);
      }),
    );
  }

  protected promptIfRestartRequired(): Observable<boolean> {
    return this.store$.select(selectService(ServiceName.Cifs)).pipe(
      filter((service) => !!service),
      map((service) => service.state === ServiceStatus.Running),
      switchMap((isRunning) => {
        if (isRunning && this.isRestartRequired) {
          return this.matDialog.open(RestartSmbDialog, {
            data: {
              timemachine: this.isNewTimemachineShare,
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

  protected shouldRedirectToAclEdit(): Observable<boolean> {
    const sharePath: string = this.form.controls.path.value;
    const datasetId = sharePath.replace('/mnt/', '');
    return this.api.call('filesystem.stat', [sharePath]).pipe(
      switchMap((stat) => {
        return of(
          stat.acl !== this.form.controls.acl.value && datasetId.includes('/'),
        );
      }),
    );
  }

  protected closeForm(routerLink?: string[]): void {
    this.slideInRef.close({ response: false });

    if (routerLink) {
      this.router.navigate(routerLink);
    }
  }

  private checkForSmbUsersWarning(): void {
    this.smbValidationService.checkForSmbUsersWarning().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.hasSmbUsers.set(false);
    });
  }

  private buildPurposeOptions(): SelectOption<SmbPresetType>[] {
    const options = mapToOptionsWithHoverTooltips(
      smbPresetTypeLabels,
      smbPresetTooltips,
      this.translate,
    );

    if (this.isNew) {
      return options.filter((option) => option.value !== SmbPresetType.LegacyShare);
    }

    return options;
  }
}
