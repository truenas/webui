import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { noop, Observable, of } from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { extractApiError } from 'app/helpers/api.helper';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  SmbPresets,
  SmbPresetType,
  SmbShare,
} from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { RestartSmbDialogComponent } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { ApiService } from 'app/services/websocket/api.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-smb-form',
  templateUrl: './smb-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxExplorerComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SmbFormComponent implements OnInit, AfterViewInit {
  existingSmbShare: SmbShare;
  defaultSmbShare: SmbShare;

  isLoading = false;
  isAdvancedMode = false;
  namesInUse: string[] = [];
  readonly helptextSharingSmb = helptextSharingSmb;
  readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
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

  presets: SmbPresets;
  protected presetFields: (keyof SmbShare)[] = [];

  purposeOptions$: Observable<Option[]>;

  get hasAddedAllowDenyHosts(): boolean {
    const hostsallow = this.form.controls.hostsallow.value;
    const hostsdeny = this.form.controls.hostsdeny.value;
    return (
      (this.isNew && hostsallow && hostsallow.length > 0)
      || (this.isNew && hostsdeny && hostsdeny.length > 0)
      || this.hasHostAllowDenyChanged(hostsallow, hostsdeny)
    );
  }

  hasHostAllowDenyChanged(hostsallow: string[], hostsdeny: string[]): boolean {
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
    path: ['', Validators.required],
    name: ['', Validators.required],
    purpose: [null as SmbPresetType],
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
    timemachine_quota: [null as number],
    afp: [false],
    shadowcopy: [false],
    recyclebin: [false],
    aapl_name_mangling: [false],
    streams: [false],
    durablehandle: [false],
    fsrvp: [false],
    path_suffix: [''],
    auxsmbconf: [''],
    audit: this.formBuilder.group({
      enable: [false],
      watch_list: [[] as string[]],
      ignore_list: [[] as string[]],
    }),
  });

  constructor(
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private datasetService: DatasetService,
    private translate: TranslateService,
    private router: Router,
    private userService: UserService,
    protected loader: AppLoaderService,
    private formErrorHandler: FormErrorHandlerService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
    private slideInRef: SlideInRef<SmbFormComponent>,
    private store$: Store<ServicesState>,
    private smbValidationService: SmbValidationService,
    @Inject(SLIDE_IN_DATA) private data: { existingSmbShare?: SmbShare; defaultSmbShare?: SmbShare },
  ) {
    this.existingSmbShare = this.data?.existingSmbShare;
    this.defaultSmbShare = this.data?.defaultSmbShare;
  }

  ngOnInit(): void {
    this.setupPurposeControl();

    this.setupAndApplyPurposePresets()
      .pipe(
        tap(() => {
          this.setupAfpWarning();
          this.setupMangleWarning();
          this.setupPathControl();
          this.setupAclControl();
        }),
        untilDestroyed(this),
      )
      .subscribe(noop);

    if (this.defaultSmbShare) {
      this.form.patchValue(this.defaultSmbShare);
      this.setNameFromPath();
    }

    if (this.existingSmbShare) {
      this.setSmbShareForEdit();
    }
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
        title: helptextSharingSmb.manglingDialog.title,
        message: helptextSharingSmb.manglingDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.manglingDialog.action,
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
      .subscribe((value: string) => {
        this.clearPresets();
        this.setValuesFromPreset(value);
      });
  }

  setNameFromPath(): void {
    const pathControl = this.form.controls.path;
    if (!pathControl.value) {
      return;
    }
    const nameControl = this.form.controls.name;
    if (pathControl.value && (!nameControl.value || !nameControl.dirty)) {
      const name = pathControl.value.split('/').pop();
      nameControl.setValue(name);
      nameControl.markAsTouched();
    }
    this.cdr.markForCheck();
  }

  checkAndShowStripAclWarning(path: string, aclValue: boolean): void {
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

  setValuesFromPreset(preset: string): void {
    if (!this.presets?.[preset]) {
      return;
    }
    Object.keys(this.presets[preset].params).forEach((param) => {
      this.presetFields.push(param as keyof SmbShare);
      // eslint-disable-next-line no-restricted-syntax
      const ctrl = this.form.get(param);
      if (ctrl) {
        ctrl.setValue(this.presets[preset].params[param as keyof SmbShare]);
        ctrl.disable();
      }
    });
  }

  /**
   * @returns Observable<void> to allow setting warnings for values changes once default or previous preset is applied
   */
  setupAndApplyPurposePresets(): Observable<void> {
    return this.api.call('sharing.smb.presets').pipe(
      switchMap((presets) => {
        const nonClusterPresets = Object.entries(presets).reduce(
          (acc, [presetName, preset]) => {
            if (!preset.cluster) {
              acc[presetName] = preset;
            }
            return acc;
          },
          {} as SmbPresets,
        );
        this.presets = nonClusterPresets;
        const options = Object.entries(nonClusterPresets).map(([presetName, preset]) => ({
          label: preset.verbose_name,
          value: presetName,
        }));
        this.purposeOptions$ = of(options);
        this.form.controls.purpose.setValue(
          this.isNew
            ? SmbPresetType.DefaultShareParameters
            : this.existingSmbShare?.purpose,
        );
        this.cdr.markForCheck();
        return of(null);
      }),
    );
  }

  showStripAclWarning(): void {
    this.dialogService
      .confirm({
        title: helptextSharingSmb.stripACLDialog.title,
        message: helptextSharingSmb.stripACLDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.stripACLDialog.button,
        hideCancel: true,
      })
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  clearPresets(): void {
    for (const item of this.presetFields) {
      // eslint-disable-next-line no-restricted-syntax
      this.form.get(item).enable();
    }
    this.presetFields = [];
  }

  setSmbShareForEdit(): void {
    this.title = helptextSharingSmb.formTitleEdit;
    const index = this.namesInUse.findIndex((name) => name === this.existingSmbShare.name);
    if (index >= 0) {
      this.namesInUse.splice(index, 1);
    }
    this.form.patchValue(this.existingSmbShare);
  }

  afpConfirmEnable(value: boolean): void {
    if (!value) {
      return;
    }
    const afpControl = this.form.controls.afp;
    this.dialogService
      .confirm({
        title: helptextSharingSmb.afpDialog_title,
        message: helptextSharingSmb.afpDialog_message,
        hideCheckbox: false,
        buttonText: helptextSharingSmb.afpDialog_button,
        hideCancel: false,
      })
      .pipe(untilDestroyed(this))
      .subscribe((dialogResult: boolean) => {
        if (!dialogResult) {
          afpControl.setValue(!value);
        }
      });
  }

  submit(): void {
    const smbShare = this.form.value;

    if (!smbShare.timemachine_quota || !smbShare.timemachine) {
      smbShare.timemachine_quota = 0;
    }

    let request$: Observable<SmbShare>;

    if (this.isNew) {
      request$ = this.api.call('sharing.smb.create', [smbShare]);
    } else {
      request$ = this.api.call('sharing.smb.update', [this.existingSmbShare.id, smbShare]);
    }

    this.datasetService.rootLevelDatasetWarning(
      smbShare.path,
      this.translate.instant(helptextSharingSmb.root_level_warning),
      !this.form.controls.path.dirty,
    ).pipe(
      filter(Boolean),
      tap(() => {
        this.isLoading = true;
        this.cdr.markForCheck();
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
        this.isLoading = false;
        this.cdr.markForCheck();
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
            this.slideInRef.close(true);
          });
        } else {
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
          this.slideInRef.close(true);
        }
      },
      error: (error: unknown) => {
        const apiError = extractApiError(error);
        if (apiError?.reason?.includes('[ENOENT]') || apiError?.reason?.includes('[EXDEV]')) {
          this.dialogService.closeAllDialogs();
        }
        this.isLoading = false;
        this.cdr.markForCheck();
        this.formErrorHandler.handleValidationErrors(error, this.form, {}, 'smb-form-toggle-advanced-options');
      },
    });
  }

  restartCifsServiceIfNecessary(): Observable<boolean> {
    return this.promptIfRestartRequired().pipe(
      switchMap((shouldRestart) => {
        if (shouldRestart) {
          return this.restartCifsService();
        }
        return of(false);
      }),
    );
  }

  promptIfRestartRequired(): Observable<boolean> {
    return this.store$.select(selectService(ServiceName.Cifs)).pipe(
      map((service) => service.state === ServiceStatus.Running),
      switchMap((isRunning) => {
        if (isRunning && this.isRestartRequired) {
          return this.matDialog.open(RestartSmbDialogComponent, {
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
    return this.api.call('service.restart', [ServiceName.Cifs]).pipe(
      tap(() => {
        this.loader.close();
        this.snackbar.success(
          this.translate.instant(
            helptextSharingSmb.restarted_smb_dialog.message,
          ),
        );
      }),
    );
  };

  shouldRedirectToAclEdit(): Observable<boolean> {
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
}
