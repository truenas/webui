import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  forkJoin, noop, Observable, of,
} from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { Option } from 'app/interfaces/option.interface';
import { Service } from 'app/interfaces/service.interface';
import {
  SmbPresets,
  SmbPresetType,
  SmbShare,
} from 'app/interfaces/smb-share.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { forbiddenValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  StartServiceDialogComponent, StartServiceDialogResult,
} from 'app/pages/sharing/components/start-service-dialog/start-service-dialog.component';
import { RestartSmbDialogComponent } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './smb-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbFormComponent implements OnInit {
  isLoading = false;
  isAdvancedMode = false;
  namesInUse: string[] = [];
  readonly helptextSharingSmb = helptextSharingSmb;
  private wasStripAclWarningShown = false;

  title: string = helptextSharingSmb.formTitleAdd;

  get isNew(): boolean {
    return !this.existingSmbShare;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    directoriesOnly: true,
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
      !_.isEqual(this.existingSmbShare?.hostsallow, hostsallow)
      || !_.isEqual(this.existingSmbShare?.hostsdeny, hostsdeny)
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
    name: ['', [Validators.required]],
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
  });

  constructor(
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private router: Router,
    protected loader: AppLoaderService,
    private formErrorHandler: FormErrorHandlerService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<SmbFormComponent>,
    @Inject(SLIDE_IN_DATA) private existingSmbShare: SmbShare,
  ) { }

  ngOnInit(): void {
    this.getUnusableNamesForShare();
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

    if (this.existingSmbShare) {
      this.setSmbShareForEdit();
    }
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
    }
    this.cdr.markForCheck();
  }

  checkAndShowStripAclWarning(path: string, aclValue: boolean): void {
    if (this.wasStripAclWarningShown || !path || aclValue) {
      return;
    }
    this.ws
      .call('filesystem.acl_is_trivial', [path])
      .pipe(untilDestroyed(this))
      .subscribe((aclIsTrivial) => {
        if (!aclIsTrivial) {
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
    return this.ws.call('sharing.smb.presets').pipe(
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

  getUnusableNamesForShare(): void {
    this.ws
      .call('sharing.smb.query', [])
      .pipe(
        map((shares) => shares.map((share) => share.name)),
        untilDestroyed(this),
      )
      .subscribe((shareNames) => {
        this.namesInUse = ['global', ...shareNames];
        this.form.controls.name.setValidators(forbiddenValues(this.namesInUse));
      });
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
    this.isLoading = true;
    this.cdr.markForCheck();
    const smbShare = this.form.value;

    if (!smbShare.timemachine_quota || !smbShare.timemachine) {
      smbShare.timemachine_quota = 0;
    }

    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.ws.call('sharing.smb.create', [smbShare]);
    } else {
      request$ = this.ws.call('sharing.smb.update', [this.existingSmbShare.id, smbShare]);
    }

    request$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (smbShareResponse: SmbShare) => {
        this.getCifsService().pipe(
          switchMap((cifsService) => {
            if (cifsService.state === ServiceStatus.Stopped) {
              return this.startAndEnableService(cifsService);
            }
            return this.restartCifsServiceIfNecessary();
          }),
          switchMap(() => this.shouldRedirectToAclEdit()),
          untilDestroyed(this),
        ).subscribe({
          next: (redirect) => {
            this.isLoading = false;
            this.cdr.markForCheck();
            if (redirect) {
              this.dialogService.confirm({
                title: this.translate.instant('Configure ACL'),
                message: this.translate.instant('Do you want to configure the ACL?'),
                buttonText: this.translate.instant('Configure'),
                hideCheckbox: true,
              }).pipe(untilDestroyed(this)).subscribe((isConfigure) => {
                if (isConfigure) {
                  const homeShare = this.form.controls.home.value;
                  this.router.navigate(
                    ['/', 'datasets', 'acl', 'edit'],
                    { queryParams: { homeShare, path: smbShareResponse.path_local } },
                  );
                }
                this.slideInRef.close();
              });
            } else {
              this.slideInRef.close();
            }
          },
          error: (err: WebsocketError) => {
            if (err.reason.includes('[ENOENT]') || err.reason.includes('[EXDEV]')) {
              this.dialogService.closeAllDialogs();
            } else {
              this.dialogService.error(this.errorHandler.parseWsError(err));
            }
            this.isLoading = false;
            this.cdr.markForCheck();
            this.slideInRef.close();
          },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.formErrorHandler.handleWsFormError(error, this.form);
      },
    });
  }

  restartCifsServiceIfNecessary(): Observable<unknown> {
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
    if (this.isRestartRequired) {
      const dialog = this.mdDialog.open(RestartSmbDialogComponent, {
        data: {
          timemachine: this.isNewTimemachineShare,
          homeshare: this.isNewHomeShare,
          path: this.wasPathChanged,
          hosts: this.hasAddedAllowDenyHosts,
          isNew: this.isNew,
        },
      });
      return dialog.afterClosed();
    }
    return of(false);
  }

  restartCifsService = (): Observable<void> => {
    this.loader.open();
    return this.ws.call('service.restart', [ServiceName.Cifs]).pipe(
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
    return this.ws.call('filesystem.stat', [sharePath]).pipe(
      switchMap((stat) => {
        return of(
          stat.acl !== this.form.controls.acl.value && datasetId.includes('/'),
        );
      }),
    );
  }

  startAndEnableService = (cifsService: Service): Observable<unknown> => {
    return this.mdDialog.open(StartServiceDialogComponent, {
      data: serviceNames.get(ServiceName.Cifs),
      disableClose: true,
    })
      .afterClosed()
      .pipe(
        switchMap((result: StartServiceDialogResult) => {
          const requests: Observable<unknown>[] = [];

          if (result.start && result.startAutomatically) {
            requests.push(
              this.ws.call('service.update', [
                cifsService.id,
                { enable: result.startAutomatically },
              ]),
            );
          }

          if (result.start) {
            requests.push(
              this.ws.call('service.start', [
                cifsService.service,
                { silent: false },
              ])
                .pipe(
                  tap(() => {
                    this.snackbar.success(
                      this.translate.instant('The {service} service has started.', {
                        service: 'SMB',
                      }),
                    );
                  }),
                ),
            );
          }

          return requests.length ? forkJoin(requests) : of(requests);
        }),
      );
  };

  getCifsService = (): Observable<Service> => {
    return this.ws
      .call('service.query')
      .pipe(map((services) => _.find(services, { service: ServiceName.Cifs })));
  };
}
