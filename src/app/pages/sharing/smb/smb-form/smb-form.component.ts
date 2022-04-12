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
  catchError, debounceTime, map, switchMap, tap,
} from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingSmb, shared } from 'app/helptext/sharing';
import { Option } from 'app/interfaces/option.interface';
import { SmbPresets, SmbShare } from 'app/interfaces/smb-share.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  AppLoaderService, DialogService, WebSocketService,
} from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'smb-form',
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
  private stripACLWarningSent = false;
  private mangleWarningSent = false;
  private isTimeMachineOn = false;
  private mangle: boolean;

  title: string = helptextSharingSmb.formTitleAdd;

  private hostsAllowOnLoad: string[] = [];
  private hostsDenyOnLoad: string[] = [];

  get isNew(): boolean {
    return !this.existingSmbShare;
  }

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  presets: SmbPresets;
  protected presetFields: (keyof SmbShare)[] = [];

  options: { [key: string]: Observable<Option[]> } = {
    purpose$: this.ws.call('sharing.smb.presets').pipe(
      map((presets) => {
        this.presets = presets;
        const options: Option[] = [];
        for (const presetName in presets) {
          options.push({ label: presets[presetName].verbose_name, value: presetName });
        }
        return options;
      }),
      tap(() => {
        if (this.isNew) {
          this.form.get('purpose').setValue('DEFAULT_SHARE');
        }
      }),
    ),
  };

  form = this.formBuilder.group({
    path: ['', Validators.required],
    name: ['', [forbiddenValues(this.namesInUse), Validators.required]],
    purpose: [''],
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
  ) {
    this.ws.call('sharing.smb.query', []).pipe(
      map((shares) => shares.map((share) => share.name)),
      untilDestroyed(this),
    ).subscribe((shareNames) => {
      ['global', ...shareNames].forEach((name) => this.namesInUse.push(name));
    });
  }

  ngOnInit(): void {
    this.form.get('purpose').valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        this.clearPresets();
        if (!this.presets[value]) {
          return;
        }
        for (const param in this.presets[value].params) {
          this.presetFields.push(param as keyof SmbShare);
          const ctrl = this.form.get(param);
          if (ctrl && param !== 'auxsmbconf') {
            ctrl.setValue(this.presets[value].params[param as keyof SmbShare]);
            ctrl.disable();
          }
        }
      },
    );

    this.form.get('afp').valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      this.afpConfirm(value);
    });

    const pathFormControl = this.form.get('path');
    /*  If name is empty, auto-populate after path selection */
    pathFormControl.valueChanges.pipe(debounceTime(50), untilDestroyed(this)).subscribe((path) => {
      const nameControl = this.form.get('name');
      if (path && !nameControl.value) {
        const name = path.split('/').pop();
        nameControl.setValue(name);
      }

      if (!this.stripACLWarningSent) {
        this.ws.call('filesystem.acl_is_trivial', [path]).pipe(untilDestroyed(this)).subscribe((res) => {
          if (!res && !this.form.get('acl').value) {
            this.stripACLWarningSent = true;
            this.showStripAclWarning();
          }
        });
      }
    });

    this.form.get('acl').valueChanges.pipe(debounceTime(100)).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res && pathFormControl.value && !this.stripACLWarningSent) {
        this.ws.call('filesystem.acl_is_trivial', [pathFormControl.value])
          .pipe(untilDestroyed(this)).subscribe((res) => {
            if (!res) {
              this.stripACLWarningSent = true;
              this.showStripAclWarning();
            }
          });
      }
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
    this.hostsAllowOnLoad = smbShare.hostsallow ? [...smbShare.hostsallow] : [];
    this.mangle = smbShare.aapl_name_mangling;
    this.hostsDenyOnLoad = smbShare.hostsdeny ? [...smbShare.hostsdeny] : [];
    this.isTimeMachineOn = smbShare.timemachine;
    this.title = helptextSharingSmb.formTitleEdit;
    const index = this.namesInUse.findIndex((name) => name === smbShare.name);
    if (index >= 0) {
      this.namesInUse.splice(index, 1);
    }
    this.form.get('aapl_name_mangling').valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value !== this.mangle && !this.mangleWarningSent) {
        this.mangleWarningSent = true;
        this.dialog.confirm({
          title: helptextSharingSmb.manglingDialog.title,
          message: helptextSharingSmb.manglingDialog.message,
          hideCheckBox: true,
          buttonMsg: helptextSharingSmb.manglingDialog.action,
          hideCancel: true,
        }).pipe(untilDestroyed(this)).subscribe();
      }
    });
    this.form.patchValue(smbShare);
  }

  /* If user blurs name field with empty value, try to auto-populate based on path */
  blurEventName(): void {
    const pathControl = this.form.get('path');
    const nameControl = this.form.get('name');
    if (pathControl.value && !nameControl.value) {
      nameControl.setValue(pathControl.value.split('/').pop());
    }
  }

  toggleAdvancedMode(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  restartService(source: string): void {
    const confirmOptions = {
      title: helptextSharingSmb.restart_smb_dialog.title,
      message:
        source === 'timemachine'
          ? helptextSharingSmb.restart_smb_dialog.message_time_machine
          : helptextSharingSmb.restart_smb_dialog.message_allow_deny,
      hideCheckBox: true,
      buttonMsg: helptextSharingSmb.restart_smb_dialog.title,
      cancelMsg: helptextSharingSmb.restart_smb_dialog.cancel_btn,
    };
    this.dialog.confirm(confirmOptions).pipe(
      untilDestroyed(this),
    ).subscribe((res: boolean) => {
      if (res) {
        this.loader.open();
        this.ws.call('service.restart', [ServiceName.Cifs]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.loader.close();
            this.dialog
              .info(
                helptextSharingSmb.restarted_smb_dialog.title,
                helptextSharingSmb.restarted_smb_dialog.message,
                '250px',
              )
              .pipe(untilDestroyed(this)).subscribe(() => {
                this.checkAclActions();
              });
          },
          (err) => {
            this.loader.close();
            this.dialog.errorReport('Error', err.err, err.backtrace);
          },
        );
      } else if (source === 'timemachine') {
        this.checkAllowDeny();
      } else {
        this.checkAclActions();
      }
    });
  }

  checkAllowDeny(): void {
    if (
      !_.isEqual(this.hostsAllowOnLoad, this.form.get('hostsallow').value)
      || !_.isEqual(this.hostsDenyOnLoad, this.form.get('hostsdeny').value)
    ) {
      this.restartService('allowdeny');
    } else {
      this.checkAclActions();
    }
  }

  checkAclActions(): void {
    const sharePath: string = this.form.get('path').value;
    const datasetId = sharePath.replace('/mnt/', '');
    const poolName = datasetId.split('/')[0];
    const homeShare = this.form.get('home').value;
    const aclRoute = ['storage', 'id', poolName, 'dataset', 'acl', datasetId];

    if (homeShare && this.isNew) {
      this.router.navigate(['/'].concat(aclRoute), { queryParams: { homeShare: true } });
      return;
    }
    // If this call returns true OR an [ENOENT] err comes back, just return to table
    // because the pool or ds is encrypted. Otherwise, do the next checks
    this.ws.call('pool.dataset.path_in_locked_datasets', [sharePath])
      .pipe(untilDestroyed(this))
      .subscribe(
        (res) => {
          this.dialog.closeAllDialogs();
          if (!res) {
            this.ws.call('service.query', [])
              .pipe(
                map((response) => _.find(response, { service: ServiceName.Cifs })),
                switchMap((cifsService) => {
                  this.dialog.closeAllDialogs();
                  if (cifsService.enable) {
                    return of();
                  }

                  /**
                   * Allow user to enable cifs service, then ask about editing
                   * dataset ACL.
                   */
                  return this.dialog.confirm({
                    title: shared.dialog_title,
                    message: shared.dialog_message,
                    hideCheckBox: true,
                    buttonMsg: shared.dialog_button,
                  }).pipe(
                    switchMap((doEnableService) => {
                      if (doEnableService) {
                        return this.ws.call('service.update', [cifsService.id, { enable: true }]).pipe(
                          switchMap(() => this.ws.call('service.start', [cifsService.service])),
                          switchMap(() => {
                            return this.dialog.info(
                              this.translate.instant('{service} Service', { service: 'SMB' }),
                              this.translate.instant('The {service} service has been enabled.', { service: 'SMB' }),
                              '250px',
                              'info',
                            );
                          }),
                          catchError((error) => {
                            return this.dialog.errorReport(error.error, error.reason, error.trace.formatted);
                          }),
                        );
                      }
                      return of(true);
                    }),
                  );
                }),
                untilDestroyed(this),
              )
              .subscribe(
                () => {},
                (error) => new EntityUtils().handleWsError(this, error, this.dialog),
              );
          }
        },
        (err) => {
          if (err.reason.includes('[ENOENT]')) {
            this.dialog.closeAllDialogs();
          } else {
          // If some other err comes back from filesystem.path_is_encrypted
            this.dialog.errorReport(helptextSharingSmb.action_edit_acl_dialog.title, err.reason, err.trace.formatted);
          }
        },
      );
  }

  afpConfirm(value: boolean): void {
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
      if (smbShare.timemachine && !this.isTimeMachineOn) {
        this.restartService('timemachine');
      } else {
        this.checkAllowDeny();
      }
      this.slideInService.close();
    },
    (error) => {
      this.isLoading = false;
      this.cdr.markForCheck();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}
