import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import {
  debounceTime, filter, map, switchMap, take, tap,
} from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingSmb, shared } from 'app/helptext/sharing';
import { Option } from 'app/interfaces/option.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmbPresets, SmbPresetType, SmbShare } from 'app/interfaces/smb-share.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  AppLoaderService, DialogService, WebSocketService,
} from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './smb-form.component.html',
  styleUrls: ['./smb-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbFormComponent implements OnInit {
  isLoading = false;
  isAdvancedMode = false;
  namesInUse: string[] = [];
  existingSmbShare: SmbShare;
  readonly helptextSharingSmb = helptextSharingSmb;
  productType = localStorage.getItem('product_type') as ProductType;
  private wasStripAclWarningShown = false;

  title: string = helptextSharingSmb.formTitleAdd;

  get isNew(): boolean {
    return !this.existingSmbShare;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  presets: SmbPresets;
  protected presetFields: (keyof SmbShare)[] = [];

  purposeOptions$: Observable<Option[]>;

  get hasHostAllowDenyChanged(): boolean {
    return !_.isEqual(this.existingSmbShare?.hostsallow, this.form.get('hostsallow').value)
           || !_.isEqual(this.existingSmbShare?.hostsdeny, this.form.get('hostsdeny').value);
  }

  get shouldEnableTimemachineService(): boolean {
    return this.form.get('timemachine').value && !this.existingSmbShare?.timemachine;
  }

  form = this.formBuilder.group({
    path: ['', Validators.required],
    name: ['', [Validators.required]],
    purpose: [SmbPresetType.DefaultShareParameters],
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
    afp: [false],
    shadowcopy: [false],
    recyclebin: [false],
    aapl_name_mangling: [false],
    streams: [false],
    durablehandle: [false],
    fsrvp: [false],
    path_suffix: [''],
    auxsmbconf: [''],
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private dialog: DialogService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private router: Router,
    protected loader: AppLoaderService,
    private errorHandler: FormErrorHandlerService,
    private filesystemService: FilesystemService,
  ) { }

  ngOnInit(): void {
    this.setupPurposePresets();
    this.getUnusableNamesForShare();

    this.setupPurposeControl();
    this.setupAfpWarning();

    this.setupPathControl();

    this.setupAclControl();

    this.setupMangleWarning();
  }

  setupAclControl(): void {
    this.form.get('acl').valueChanges
      .pipe(debounceTime(100), untilDestroyed(this))
      .subscribe((acl) => {
        this.checkAndShowStripAclWarning(this.form.get('path').value, acl);
      });
  }

  setupMangleWarning(): void {
    this.form.get('aapl_name_mangling').valueChanges.pipe(
      filter((value) => value !== this.existingSmbShare?.aapl_name_mangling),
      take(1),
      switchMap(() => this.dialog.confirm({
        title: helptextSharingSmb.manglingDialog.title,
        message: helptextSharingSmb.manglingDialog.message,
        hideCheckBox: true,
        buttonMsg: helptextSharingSmb.manglingDialog.action,
        hideCancel: true,
      })),
      untilDestroyed(this),
    ).subscribe();
  }

  setupPathControl(): void {
    this.form.get('path').valueChanges
      .pipe(
        debounceTime(50),
        tap(() => this.setNameFromPath()),
        untilDestroyed(this),
      )
      .subscribe((path) => {
        this.checkAndShowStripAclWarning(path, this.form.get('acl').value);
      });
  }

  setupAfpWarning(): void {
    this.form.get('afp').valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      this.afpConfirmEnable(value);
    });
  }

  setupPurposeControl(): void {
    this.form.get('purpose').valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        this.clearPresets();
        this.setValuesFromPreset(value);
      },
    );
  }

  setNameFromPath(): void {
    const pathControl = this.form.get('path');
    if (!pathControl.value) {
      return;
    }
    const nameControl = this.form.get('name');
    if (pathControl.value && !nameControl.value) {
      const name = pathControl.value.split('/').pop();
      nameControl.setValue(name);
    }
    this.cdr.markForCheck();
  }

  checkAndShowStripAclWarning(path: string, aclValue: boolean): void {
    if (this.wasStripAclWarningShown || !path || aclValue) {
      return;
    }
    this.ws.call('filesystem.acl_is_trivial', [path]).pipe(untilDestroyed(this)).subscribe((aclIsTrivial) => {
      if (!aclIsTrivial) {
        this.wasStripAclWarningShown = true;
        this.showStripAclWarning();
      }
    });
  }

  setValuesFromPreset(preset: string): void {
    if (!this.presets[preset]) {
      return;
    }
    for (const param in this.presets[preset].params) {
      this.presetFields.push(param as keyof SmbShare);
      const ctrl = this.form.get(param);
      if (ctrl && param !== 'auxsmbconf') {
        ctrl.setValue(this.presets[preset].params[param as keyof SmbShare]);
        ctrl.disable();
      }
    }
  }

  setupPurposePresets(): void {
    this.ws.call('sharing.smb.presets').pipe(untilDestroyed(this)).subscribe((presets) => {
      this.presets = presets;
      const options: Option[] = [];
      for (const presetName in presets) {
        options.push({ label: presets[presetName].verbose_name, value: presetName });
      }
      this.purposeOptions$ = of(options);
    });
  }

  getUnusableNamesForShare(): void {
    this.ws.call('sharing.smb.query', []).pipe(
      map((shares) => shares.map((share) => share.name)),
      untilDestroyed(this),
    ).subscribe((shareNames) => {
      this.namesInUse = ['global', ...shareNames];
      this.form.get('name').setValidators(forbiddenValues(this.namesInUse));
    });
  }

  showStripAclWarning(): void {
    this.dialog.confirm({
      title: helptextSharingSmb.stripACLDialog.title,
      message: helptextSharingSmb.stripACLDialog.message,
      hideCheckBox: true,
      buttonMsg: helptextSharingSmb.stripACLDialog.button,
      hideCancel: true,
    }).pipe(untilDestroyed(this)).subscribe();
  }

  clearPresets(): void {
    for (const item of this.presetFields) {
      this.form.get(item).enable();
    }
    this.presetFields = [];
  }

  setSmbShareForEdit(smbShare: SmbShare): void {
    this.existingSmbShare = smbShare;
    this.title = helptextSharingSmb.formTitleEdit;
    const index = this.namesInUse.findIndex((name) => name === smbShare.name);
    if (index >= 0) {
      this.namesInUse.splice(index, 1);
    }
    this.form.patchValue(smbShare);
  }

  afpConfirmEnable(value: boolean): void {
    if (!value) {
      return;
    }
    const afpControl = this.form.get('afp');
    this.dialog.confirm({
      title: helptextSharingSmb.afpDialog_title,
      message: helptextSharingSmb.afpDialog_message,
      hideCheckBox: false,
      buttonMsg: helptextSharingSmb.afpDialog_button,
      hideCancel: false,
    }).pipe(untilDestroyed(this)).subscribe((dialogResult: boolean) => {
      if (!dialogResult) {
        afpControl.setValue(!value);
      }
    });
  }

  submit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    const smbShare = this.form.value;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('sharing.smb.create', [smbShare]);
    } else {
      request$ = this.ws.call('sharing.smb.update', [this.existingSmbShare.id, smbShare]);
    }

    request$.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.shouldServiceRestart().pipe(
        switchMap((restart) => {
          if (restart) {
            return this.restartServices();
          }
          return of(true);
        }),
        switchMap(this.shouldRedirectToAclEdit),
        filter(Boolean),
        switchMap(this.shouldEnableServiceAutomaticRestart),
        switchMap(this.shouldStartAndUpdateCifsService),
        untilDestroyed(this),
      ).subscribe(
        () => {},
        (err) => {
          if (err.reason.includes('[ENOENT]')) {
            this.dialog.closeAllDialogs();
          } else {
            this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();
        }, () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();
        },
      );
    },
    (error) => {
      this.isLoading = false;
      this.cdr.markForCheck();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }

  shouldServiceRestart = (): Observable<boolean> => {
    if (this.shouldEnableTimemachineService) {
      return this.dialog.confirm({
        title: helptextSharingSmb.restart_smb_dialog.title,
        message: helptextSharingSmb.restart_smb_dialog.message_time_machine,
        hideCheckBox: true,
        buttonMsg: helptextSharingSmb.restart_smb_dialog.title,
        cancelMsg: helptextSharingSmb.restart_smb_dialog.cancel_btn,
      }).pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return this.warnIfHostsAllowDenyAreChanged();
          }
          return of(true);
        }),
      );
    }
    return this.warnIfHostsAllowDenyAreChanged();
  };

  warnIfHostsAllowDenyAreChanged = (): Observable<boolean> => {
    if (this.hasHostAllowDenyChanged) {
      return this.dialog.confirm({
        title: helptextSharingSmb.restart_smb_dialog.title,
        message: helptextSharingSmb.restart_smb_dialog.message_allow_deny,
        hideCheckBox: true,
        buttonMsg: helptextSharingSmb.restart_smb_dialog.title,
        cancelMsg: helptextSharingSmb.restart_smb_dialog.cancel_btn,
      });
    }
    return of(false);
  };

  restartServices = (): Observable<boolean> => {
    this.loader.open();
    return this.ws.call(
      'service.restart',
      [ServiceName.Cifs],
    ).pipe(
      switchMap(() => {
        this.loader.close();
        return this.dialog.info(
          helptextSharingSmb.restarted_smb_dialog.title,
          helptextSharingSmb.restarted_smb_dialog.message,
          '250px',
        );
      }),
    );
  };

  shouldEnableServiceAutomaticRestart = (): Observable<Service> => {
    return this.ws.call('pool.dataset.path_in_locked_datasets', [this.form.get('path').value]).pipe(
      filter((pathInLockedDatasets) => !pathInLockedDatasets),
      switchMap(() => this.ws.call('service.query')),
      map((services) => _.find(services, { service: ServiceName.Cifs })),
      filter((cifsService) => !cifsService.enable),
    );
  };

  shouldStartAndUpdateCifsService = (cifsService: Service): Observable<boolean> => {
    return this.dialog.confirm({
      title: shared.dialog_title,
      message: shared.dialog_message,
      hideCheckBox: true,
      buttonMsg: shared.dialog_button,
    }).pipe(
      filter((confirm) => confirm),
      switchMap(
        () => this.ws.call(
          'service.update',
          [cifsService.id, { enable: true }],
        ),
      ),
      switchMap(() => this.ws.call('service.start', [cifsService.service])),
      switchMap(() => {
        return this.dialog.info(
          this.translate.instant('{service} Service', { service: 'SMB' }),
          this.translate.instant('The {service} service has been enabled.', { service: 'SMB' }),
          '250px', 'info',
        );
      }),
    );
  };

  shouldRedirectToAclEdit = (): Observable<boolean> => {
    const sharePath: string = this.form.get('path').value;
    const homeShare = this.form.get('home').value;

    if (homeShare && this.isNew) {
      const datasetId = sharePath.replace('/mnt/', '');
      const poolName = datasetId.split('/')[0];
      this.router.navigate(['/'].concat(
        ['storage', 'id', poolName, 'dataset', 'acl', datasetId],
      ), { queryParams: { homeShare: true } });
      return of(false);
    }
    return of(true);
  };
}
