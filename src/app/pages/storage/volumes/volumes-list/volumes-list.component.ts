import { HttpClient } from '@angular/common/http';
import {
  Component, OnDestroy, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { CoreService } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { AclType } from 'app/enums/acl-type.enum';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { ProductType } from 'app/enums/product-type.enum';
import dataset_helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { Dataset, ExtraDatasetQueryOptions } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableService } from 'app/pages/common/entity/entity-table/entity-table.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { JobService, ValidationService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from '../../../../translate-marker';
import { DatasetFormComponent } from '../datasets/dataset-form';
import { ZvolFormComponent } from '../zvol/zvol-form';
import { VolumesListControlsComponent } from './volumes-list-controls.component';

export interface ZfsPoolData {
  pool: string;
  available: ZfsData;
  available_parsed?: string;
  availStr?: string;
  id?: string;
  is_decrypted?: boolean;
  is_upgraded?: boolean;
  mountpoint?: string;
  name?: string;
  path?: string;
  nodePath?: string;
  parentPath?: string;
  status?: string;
  used?: ZfsData;
  used_parsed?: string;
  used_pct?: string;
  usedStr?: string;
  sed_pct?: string;
  vol_encrypt?: number;
  vol_encryptkey?: string;
  vol_guid?: string;
  vol_name?: string;
  type?: string;
  compression?: string;
  dedup?: string;
  readonly?: string;
  children?: any[];
  dataset_data?: any;
  actions?: any[];
  comments?: string;
  compressionRatio?: any;
  volumesListTableConfig?: VolumesListTableConfig;
}

interface ZfsData {
  value: string | number | null;
  parsed: string | number | null;
  rawValue: string;
  source: string;
}

@UntilDestroy()
export class VolumesListTableConfig {
  hideTopActions = true;
  flattenedVolData: any;
  tableData: TreeNode[] = [];
  columns = [
    { name: T('Name'), prop: 'name', always_display: true },
    { name: T('Type'), prop: 'type', hidden: false },
    {
      name: T('Used'), prop: 'used_parsed', sortBy: 'used.parsed', filesizePipe: false, hidden: false,
    },
    {
      name: T('Available'), prop: 'available_parsed', hidden: false, filesizePipe: false,
    },
    { name: T('Compression'), prop: 'compression' },
    { name: T('Compression Ratio'), prop: 'compressratio' },
    { name: T('Readonly'), prop: 'readonly', hidden: false },
    { name: T('Dedup'), prop: 'dedup' },
    { name: T('Comments'), prop: 'comments' },
    { name: T('Actions'), prop: 'actions', hidden: false },
  ];

  config: any = {
    deleteMsg: {
      key_props: ['name'],
    },
  };

  protected dialogRef: any;
  route_add = ['storage', 'import'];
  route_add_tooltip = T('Create or Import Pool');
  showDefaults = false;
  showSpinner: boolean;
  encryptedStatus: any;
  custActions: any[] = [];
  private vmware_res_status: boolean;
  dialogConf: DialogFormConfiguration;
  restartServices = false;
  subs: any;
  productType = window.localStorage.getItem('product_type') as ProductType;

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private _router: Router,
    private _classId: string,
    private datasetData: any[],
    public mdDialog: MatDialog,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService,
    protected storageService: StorageService,
    protected volumeData: any,
    protected messageService: MessageService,
    protected http: HttpClient,
    protected validationService: ValidationService,
  ) {
    if (typeof (this._classId) !== 'undefined' && this._classId !== '' && volumeData && volumeData['children']) {
      this.tableData = [];
      for (let i = 0; i < volumeData['children'].length; i++) {
        const child = volumeData['children'][i];
        child.parent = volumeData;
        this.tableData.push(this.dataHandler(child));
      }
    }
  }

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'download_key' && this.encryptedStatus > 0) {
      return true;
    }
    return false;
  }

  getEncryptedActions(rowData: Pool): any[] {
    const actions = [];
    const self = this;
    if (rowData.encrypt === 2) {
      if (rowData.is_decrypted) {
        if (self.parentVolumesListComponent.systemdatasetPool != rowData.name) {
          actions.push({
            label: T('Lock'),
            onClick: (row1: Pool) => {
              let p1 = '';
              const self = this;
              this.loader.open();
              this.ws.call('pool.attachments', [row1.id]).pipe(untilDestroyed(this)).subscribe((res: any[]) => {
                if (res.length > 0) {
                  self.translate.get(helptext.encryptMsgA).pipe(untilDestroyed(this)).subscribe((servicesMsgA) => {
                    self.translate.get(helptext.encryptMsgB).pipe(untilDestroyed(this)).subscribe((servicesMsgB) => {
                      p1 = servicesMsgA + `<i>${row1.name}</i>` + servicesMsgB;
                      res.forEach((item) => {
                        p1 += `<br><br>${item.type}:`;
                        item.attachments.forEach((i: string) => {
                          const tempArr = i.split(',');
                          tempArr.forEach((i) => {
                            p1 += `<br> - ${i}`;
                          });
                        });
                      });
                    });
                  });
                }
                this.ws.call('pool.processes', [row1.id]).pipe(untilDestroyed(this)).subscribe((res: any[]) => {
                  const running_processes: any[] = [];
                  const running_unknown_processes: any[] = [];
                  if (res.length > 0) {
                    res.forEach((item) => {
                      if (!item.service) {
                        if (item.name && item.name !== '') {
                          running_processes.push(item);
                        } else {
                          running_unknown_processes.push(item);
                        }
                      }
                    });
                    if (running_processes.length > 0) {
                      self.translate.get(helptext.runningMsg).pipe(untilDestroyed(this)).subscribe((servicesMsg) => {
                        p1 += `<br><br>${servicesMsg} <b>${row1.name}</b>:`;
                        running_processes.forEach((process) => {
                          if (process.name) {
                            p1 += `<br> - ${process.name}`;
                          }
                        });
                      });
                    }
                    if (running_unknown_processes.length > 0) {
                      self.translate.get(helptext.unknownMsg).pipe(untilDestroyed(this)).subscribe((servicesMsg) => {
                        self.translate.get(helptext.terminatedMsg).pipe(untilDestroyed(this)).subscribe((terminatedMsg) => {
                          p1 += `<br><br>${servicesMsg}`;
                          running_unknown_processes.forEach((process) => {
                            if (process.pid) {
                              p1 += `<br> - ${process.pid} - ${process.cmdline.substring(0, 40)}`;
                            }
                          });
                          p1 += `<br><br>${terminatedMsg}`;
                        });
                      });
                    }
                  }
                  this.loader.close();
                  doLock();
                },
                (err) => {
                  this.loader.close();
                  new EntityUtils().handleWSError(helptext.dataErrMsg, err, this.dialogService);
                });
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(helptext.dataErrMsg, err, this.dialogService);
              });
              function doLock(): void {
                const conf: DialogFormConfiguration = {
                  title: T('Enter passphrase to lock pool ') + row1.name + '.',
                  fieldConfig: [
                    {
                      type: 'paragraph',
                      name: 'pool_lock_warning',
                      paraText: helptext.pool_lock_warning_paratext_a + row1.name
                      + helptext.pool_lock_warning_paratext_b,
                      isHidden: false,
                    },
                    {
                      type: 'paragraph',
                      name: 'pool_processes',
                      paraText: p1,
                      isHidden: p1 === '',
                    },
                    {
                      type: 'input',
                      inputType: 'password',
                      name: 'passphrase',
                      placeholder: 'passphrase',
                      togglePw: true,
                      required: true,
                    },
                  ],
                  saveButtonText: T('Lock Pool'),
                  customSubmit(entityDialog: EntityDialogComponent) {
                    const value = entityDialog.formValue;
                    self.loader.open();
                    self.ws.job('pool.lock', [row1.id, value.passphrase]).pipe(untilDestroyed(this)).subscribe(
                      (res) => {
                        if (res.error) {
                          self.loader.close();
                          if (res.exc_info && res.exc_info.extra) {
                            res.extra = res.exc_info.extra;
                          }
                          new EntityUtils().handleWSError(this, res, self.dialogService);
                        }
                        if (res.state === EntityJobState.Success) {
                          self.loader.close();
                          entityDialog.dialogRef.close(true);
                          self.parentVolumesListComponent.repaintMe();
                        }
                      }, (e) => {
                        self.loader.close();
                        new EntityUtils().handleWSError(this, e, self.dialogService);
                      },
                    );
                  },
                };
                self.dialogService.dialogForm(conf);
              }
            },
          });
        }
      } else {
        actions.push({
          label: T('Unlock'),
          onClick: (row1: Pool) => {
            this.unlockAction(row1);
          },
        });
      }

      if (rowData.is_decrypted) {
        actions.push({
          label: T('Encryption Key/Passphrase'),
          onClick: (row1: any) => {
            this._router.navigate(new Array('/').concat(
              ['storage', 'changekey', row1.id],
            ));
          },
        });
      }
    } else if (rowData.encrypt === 1 && rowData.is_decrypted && self.parentVolumesListComponent.systemdatasetPool != rowData.name) {
      actions.push({
        label: T('Encryption Key'),
        onClick: (row1: any) => {
          this._router.navigate(new Array('/').concat(
            ['storage', 'createkey', row1.id],
          ));
        },
      });
    }

    if (rowData.encrypt !== 0 && rowData.is_decrypted) {
      actions.push({
        label: T('Manage Recovery Key'),
        onClick: (row1: any) => {
          this._router.navigate(new Array('/').concat(
            ['storage', 'addkey', row1.id],
          ));
        },
      });

      actions.push({
        label: T('Reset Keys'),
        onClick: (row1: any) => {
          this._router.navigate(new Array('/').concat(
            ['storage', 'rekey', row1.id],
          ));
        },
      });
    }

    if (this.parentVolumesListComponent.has_encrypted_root[rowData.name]
      && this.parentVolumesListComponent.has_key_dataset[rowData.name]) {
      actions.push({
        label: T('Export Dataset Keys'),
        onClick: (row1: any) => {
          const message = helptext.export_keys_message + row1.name;
          const fileName = 'dataset_' + row1.name + '_keys.json';
          this.dialogService.passwordConfirm(message).pipe(untilDestroyed(this)).subscribe((export_keys) => {
            if (export_keys) {
              this.loader.open();
              const mimetype = 'application/json';
              this.ws.call('core.download', ['pool.dataset.export_keys', [row1.name], fileName]).pipe(untilDestroyed(this)).subscribe((res) => {
                this.loader.close();
                const url = res[1];
                this.storageService.streamDownloadFile(this.http, url, fileName, mimetype).pipe(untilDestroyed(this)).subscribe((file) => {
                  if (res !== null && res !== '') {
                    this.storageService.downloadBlob(file, fileName);
                  }
                });
              }, (e) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, e, this.dialogService);
              });
            }
          });
        },
      });
    }

    return actions;
  }

  key_file_updater(file: any, parent: any): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  unlockAction(row1: any): void {
    const self = this;
    this.storageService.poolUnlockServiceChoices(row1.id).pipe(
      map((serviceChoices) => ({
        title: T('Unlock ') + row1.name,
        fieldConfig: [
          {
            type: 'paragraph',
            name: 'unlock_msg',
            paraText: helptext.unlock_msg,
          },
          {
            type: 'input',
            inputType: 'password',
            name: 'passphrase',
            togglePw: true,
            required: true,
            placeholder: helptext.unlockDialog_password_placeholder,
          },
          {
            type: 'upload',
            message: self.messageService,
            updater: self.key_file_updater,
            parent: self,
            hideButton: true,
            name: 'key',
            required: true,
            placeholder: helptext.unlockDialog_recovery_key_placeholder,
            tooltip: helptext.unlockDialog_recovery_key_tooltip,
          },
          {
            type: 'select',
            name: 'services_restart',
            placeholder: helptext.unlockDialog_services_placeholder,
            tooltip: helptext.unlockDialog_services_tooltip,
            multiple: true,
            value: serviceChoices.map((choice) => choice.value),
            options: serviceChoices,
          },
        ],
        afterInit(entityDialog: EntityDialogComponent) {
          self.messageService.messageSourceHasNewMessage$.pipe(untilDestroyed(this)).subscribe((message) => {
            entityDialog.formGroup.controls['key'].setValue(message);
          });
          // these disabled booleans are here to prevent recursion errors, disabling only needs to happen once
          let keyDisabled = false;
          let passphraseDisabled = false;
          entityDialog.formGroup.controls['passphrase'].valueChanges.pipe(untilDestroyed(this)).subscribe((passphrase) => {
            if (!passphraseDisabled) {
              if (passphrase && passphrase !== '') {
                keyDisabled = true;
                entityDialog.setDisabled('key', true, true);
              } else {
                keyDisabled = false;
                entityDialog.setDisabled('key', false, false);
              }
            }
          });
          entityDialog.formGroup.controls['key'].valueChanges.pipe(untilDestroyed(this)).subscribe((key) => {
            if (!keyDisabled) {
              if (key && !passphraseDisabled) {
                passphraseDisabled = true;
                entityDialog.setDisabled('passphrase', true, true);
              }
            }
          });
        },
        saveButtonText: T('Unlock'),
        customSubmit(entityDialog: EntityDialogComponent) {
          let done = false;
          const value = entityDialog.formValue;
          const params = [row1.id, { passphrase: value.passphrase, services_restart: value.services_restart }];
          const dialogRef = self.mdDialog.open(EntityJobComponent, { data: { title: T('Unlocking Pool') }, disableClose: true });
          if (value.key) {
            params[1]['recoverykey'] = true;
            const formData: FormData = new FormData();
            formData.append('data', JSON.stringify({
              method: 'pool.unlock',
              params,
            }));
            formData.append('file', self.subs.file);
            dialogRef.componentInstance.wspost(self.subs.apiEndPoint, formData);
          } else {
            dialogRef.componentInstance.setCall('pool.unlock', params);
            dialogRef.componentInstance.submit();
          }
          dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
            if (!done) {
              dialogRef.close(false);
              entityDialog.dialogRef.close(true);
              self.parentVolumesListComponent.repaintMe();
              self.translate.get(' has been unlocked.').pipe(untilDestroyed(this)).subscribe((unlockTr) => {
                self.dialogService.Info(T('Unlock'), row1.name + unlockTr, '300px', 'info', true);
                done = true;
              });
            }
          });
          dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
            dialogRef.close(false);
            new EntityUtils().handleWSError(self, res, self.dialogService);
          });
        },
      })),
      switchMap((conf) => this.dialogService.dialogForm(conf)),
    ).pipe(untilDestroyed(this)).subscribe(() => {});
  }

  getPoolData(poolId: number): Observable<Pool[]> {
    return this.ws.call('pool.query', [[['id', '=', poolId]]]);
  }

  getActions(rowData: any): any[] {
    rowData.is_passphrase = (!!(rowData.key_format && rowData.key_format.parsed === 'passphrase'));
    let rowDataPathSplit = [];
    const self = this;
    if (rowData.mountpoint) {
      rowDataPathSplit = rowData.mountpoint.split('/');
    }
    let p1 = '';
    const actions = [];
    // workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {
      if (rowData.is_decrypted && rowData.status !== 'OFFLINE') {
        actions.push({
          id: rowData.name,
          name: T('Pool Options'),
          label: T('Pool Options'),
          onClick: (row: any) => {
            // const autotrim = (row.autotrim === 'ON');

            const self = this;
            this.dialogConf = {
              title: helptext.pool_options_dialog.dialog_title + row.name,
              confirmCheckbox: true,
              fieldConfig: [
                {
                  type: 'checkbox',
                  name: 'autotrim',
                  placeholder: helptext.pool_options_dialog.autotrim_placeholder,
                  tooltip: helptext.pool_options_dialog.autotrim_tooltip,
                  value: (row.autotrim.value === 'on'),
                },
              ],
              saveButtonText: helptext.encryption_options_dialog.save_button,
              afterInit() {
              },
              customSubmit(entityDialog: EntityDialogComponent) {
                const formValue = entityDialog.formValue;
                const method = 'pool.update';
                const body: any = {};
                const payload = [row.id];
                body['autotrim'] = (formValue.autotrim ? 'ON' : 'OFF');
                payload.push(body);
                const dialogRef = self.mdDialog.open(EntityJobComponent, {
                  data: { title: helptext.pool_options_dialog.save_pool_options },
                  disableClose: true,
                });
                dialogRef.componentInstance.setDescription(helptext.pool_options_dialog.saving_pool_options);
                dialogRef.componentInstance.setCall(method, payload);
                dialogRef.componentInstance.submit();
                dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
                  if (res) {
                    dialogRef.close();
                    entityDialog.dialogRef.close();
                    self.translate.get(helptext.pool_options_dialog.dialog_saved_message1).pipe(untilDestroyed(this)).subscribe((msg1) => {
                      self.translate.get(helptext.pool_options_dialog.dialog_saved_message2).pipe(untilDestroyed(this)).subscribe((msg2) => {
                        self.dialogService.Info(helptext.pool_options_dialog.dialog_saved_title,
                          msg1 + row.name + msg2);
                        self.parentVolumesListComponent.repaintMe();
                      });
                    });
                  }
                });
                dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
                  if (err) {
                    dialogRef.close();
                    new EntityUtils().handleWSError(entityDialog, err, self.dialogService);
                  }
                });
              },
            };
            this.dialogService.dialogForm(this.dialogConf).pipe(untilDestroyed(this)).subscribe(() => {
            });
          },
        });
      }
      actions.push({
        id: rowData.name,
        name: 'Export/Disconnect',
        label: helptext.exportAction,
        color: 'warn',
        onClick: (row1: any) => {
          const encryptedStatus = row1.encrypt;
          const self = this;

          if (rowData.is_decrypted && rowData.status !== 'UNKNOWN') {
            this.loader.open();
            this.ws.call('pool.attachments', [row1.id]).pipe(untilDestroyed(this)).subscribe((res: any[]) => {
              if (res.length > 0) {
                self.translate.get(helptext.exportMessages.servicesA).pipe(untilDestroyed(this)).subscribe((a) => {
                  self.translate.get(helptext.exportMessages.servicesB).pipe(untilDestroyed(this)).subscribe((b) => {
                    p1 = a + `<i>${row1.name}</i>` + b;
                    res.forEach((item) => {
                      p1 += `<br><b>${item.type}:</b>`;
                      item.attachments.forEach((i: any) => {
                        const tempArr = i.split(',');
                        tempArr.forEach((i: any) => {
                          p1 += `<br> - ${i}`;
                        });
                      });
                    });
                  });
                });
                p1 += '<br /><br />';
              }
              this.ws.call('pool.processes', [row1.id]).pipe(untilDestroyed(this)).subscribe((res: any[]) => {
                const running_processes: any[] = [];
                const running_unknown_processes: any[] = [];
                if (res.length > 0) {
                  res.forEach((item) => {
                    if (!item.service) {
                      if (item.name && item.name !== '') {
                        running_processes.push(item);
                      } else {
                        running_unknown_processes.push(item);
                      }
                    }
                  });
                  if (running_processes.length > 0) {
                    self.translate.get(helptext.exportMessages.running).pipe(untilDestroyed(this)).subscribe((runningMsg) => {
                      p1 += runningMsg + `<b>${row1.name}</b>:`;
                      running_processes.forEach((process) => {
                        if (process.name) {
                          p1 += `<br> - ${process.name}`;
                        }
                      });
                    });
                  }
                  if (running_unknown_processes.length > 0) {
                    self.translate.get(helptext.exportMessages.unknown).pipe(untilDestroyed(this)).subscribe((unknownMsg) => {
                      self.translate.get(helptext.exportMessages.terminated).pipe(untilDestroyed(this)).subscribe((terminatedMsg) => {
                        p1 += '<br><br>' + unknownMsg;
                        running_unknown_processes.forEach((process) => {
                          if (process.pid) {
                            p1 += `<br> - ${process.pid} - ${process.cmdline.substring(0, 40)}`;
                          }
                        });
                        p1 += '<br><br>' + terminatedMsg;
                      });
                    });
                  }
                }
                this.loader.close();
                doDetach();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(self, err, self.dialogService);
              });
            },
            (err) => {
              this.loader.close();
              this.dialogService.errorReport(helptext.exportError, err.reason, err.trace.formatted);
            });
          } else {
            doDetach();
          }

          async function doDetach(): Promise<void> {
            const sysPool = await self.ws.call('systemdataset.config').pipe(map((res) => res['pool'])).toPromise();
            let title: string;
            let warningA: string;
            let warningB: string;
            let unknownA: string;
            let unknownB: string;
            let encrypted: string;
            let sysPoolWarning: string;
            self.translate.get(helptext.exportDialog.warningSysDataset).pipe(untilDestroyed(this)).subscribe((sysWarn) => {
              sysPoolWarning = sysWarn;
              self.translate.get(helptext.exportDialog.title).pipe(untilDestroyed(this)).subscribe((t) => {
                title = t;
                self.translate.get(helptext.exportDialog.warningA).pipe(untilDestroyed(this)).subscribe((a) => {
                  self.translate.get(helptext.exportDialog.warningB).pipe(untilDestroyed(this)).subscribe((b) => {
                    warningA = a;
                    warningB = b;
                    self.translate.get(helptext.exportDialog.unknownStateA).pipe(untilDestroyed(this)).subscribe((ua) => {
                      self.translate.get(helptext.exportDialog.unknownStateB).pipe(untilDestroyed(this)).subscribe((ub) => {
                        self.translate.get(helptext.exportDialog.encryptWarning).pipe(untilDestroyed(this)).subscribe((enc) => {
                          unknownA = ua;
                          unknownB = ub;
                          encrypted = enc;
                        });
                      });
                    });
                  });
                });
                const conf: DialogFormConfiguration = {
                  title: title + row1.name + "'",
                  fieldConfig: [{
                    type: 'paragraph',
                    name: 'sysdataset_warning',
                    paraText: sysPoolWarning,
                    isHidden: sysPool !== row1.name,
                  }, {
                    type: 'paragraph',
                    name: 'pool_detach_warning',
                    paraText: warningA + row1.name
                    + warningB,
                    isHidden: rowData.status === 'UNKNOWN',
                  }, {
                    type: 'paragraph',
                    name: 'unknown_status_detach_warning',
                    paraText: `${unknownA} ${row1.name} ${unknownB}`,
                    isHidden: rowData.status !== 'UNKNOWN',
                  }, {
                    type: 'paragraph',
                    name: 'pool_processes',
                    paraText: p1,
                    isHidden: p1 === '',
                  }, {
                    type: 'paragraph',
                    name: 'pool_detach_warning',
                    paraText: "'" + row1.name + encrypted,
                    isHidden: !(encryptedStatus > 0),
                  }, {
                    type: 'checkbox',
                    name: 'destroy',
                    value: false,
                    placeholder: helptext.exportDialog.destroy,
                    isHidden: rowData.status === 'UNKNOWN',
                  }, {
                    type: 'checkbox',
                    name: 'cascade',
                    value: rowData.status !== 'UNKNOWN',
                    placeholder: helptext.exportDialog.cascade,
                  }, {
                    type: 'input',
                    name: 'nameInput',
                    required: true,
                    isDoubleConfirm: true,
                    maskValue: row1.name,
                    validation: [Validators.pattern(row1.name)],
                    relation: [
                      {
                        action: RelationAction.Hide,
                        when: [{
                          name: 'destroy',
                          value: false,
                        }],
                      },
                    ],
                  }, {
                    type: 'checkbox',
                    name: 'confirm',
                    placeholder: rowData.status === 'UNKNOWN'
                      ? `${helptext.exportDialog.confirm} ${helptext.exportDialog.unknown_status_alt_text}`
                      : `${helptext.exportDialog.confirm}`,
                    required: true,
                  }],
                  isCustActionVisible(actionId: string) {
                    if (actionId == 'download_key' && encryptedStatus === 0) {
                      return false;
                    }
                    return true;
                  },
                  saveButtonText: helptext.exportDialog.saveButton,
                  custActions: [
                    {
                      id: 'download_key',
                      name: helptext.downloadKey,
                      function: () => {
                        const dialogRef = self.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
                        dialogRef.componentInstance.volumeId = row1.id;
                        dialogRef.componentInstance.fileName = 'pool_' + row1.name + '_encryption.key';
                      },
                    }],
                  customSubmit(entityDialog: EntityDialogComponent) {
                    const value = entityDialog.formValue;
                    const dialogRef = self.mdDialog.open(EntityJobComponent, { data: { title: helptext.exporting }, disableClose: true });
                    dialogRef.updateSize('300px');
                    dialogRef.componentInstance.setDescription(helptext.exporting);
                    dialogRef.componentInstance.setCall('pool.export', [row1.id, {
                      destroy: value.destroy,
                      cascade: value.cascade,
                      restart_services: self.restartServices,
                    }]);
                    dialogRef.componentInstance.submit();
                    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
                      entityDialog.dialogRef.close(true);
                      self.translate.get(helptext.exportSuccess).pipe(untilDestroyed(this)).subscribe((msg) => {
                        self.translate.get(helptext.destroyed).pipe(untilDestroyed(this)).subscribe((destroyed) => {
                          if (!value.destroy) {
                            self.dialogService.Info(helptext.exportDisconnect, msg + row1.name + "'");
                          } else {
                            self.dialogService.Info(helptext.exportDisconnect, msg + row1.name + destroyed);
                          }
                          dialogRef.close(true);
                          self.parentVolumesListComponent.repaintMe();
                        });
                      });
                    });
                    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
                      let conditionalErrMessage = '';
                      if (res.error) {
                        if (res.exc_info.extra && res.exc_info.extra['code'] === 'control_services') {
                          entityDialog.dialogRef.close(true);
                          dialogRef.close(true);
                          const stopMsg = self.translate.instant(helptext.exportMessages.onfail.stopServices);
                          const restartMsg = self.translate.instant(helptext.exportMessages.onfail.restartServices);
                          const continueMsg = self.translate.instant(helptext.exportMessages.onfail.continueMessage);

                          if (res.exc_info.extra.stop_services.length > 0) {
                            conditionalErrMessage += '<div class="warning-box">' + stopMsg;
                            res.exc_info.extra.stop_services.forEach((item: string) => {
                              conditionalErrMessage += `<br>- ${item}`;
                            });
                          }
                          if (res.exc_info.extra.restart_services.length > 0) {
                            if (res.exc_info.extra.stop_services.length > 0) {
                              conditionalErrMessage += '<br><br>';
                            }
                            conditionalErrMessage += '<div class="warning-box">' + restartMsg;
                            res.exc_info.extra.restart_services.forEach((item: string) => {
                              conditionalErrMessage += `<br>- ${item}`;
                            });
                          }
                          conditionalErrMessage += '<br><br>' + continueMsg + '</div><br />';
                          self.dialogService.confirm(helptext.exportError,
                            conditionalErrMessage, true, helptext.exportMessages.onfail.continueAction)
                            .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
                              if (res) {
                                self.restartServices = true;
                                this.customSubmit(entityDialog);
                              }
                            });
                        } else if (res.extra && res.extra['code'] === 'unstoppable_processes') {
                          entityDialog.dialogRef.close(true);
                          self.translate.get(helptext.exportMessages.onfail.unableToTerminate).pipe(untilDestroyed(this)).subscribe((msg) => {
                            conditionalErrMessage = msg + res.extra['processes'];
                            dialogRef.close(true);
                            self.dialogService.errorReport(helptext.exportError, conditionalErrMessage, res.exception);
                          });
                        } else {
                          entityDialog.dialogRef.close(true);
                          dialogRef.close(true);
                          self.dialogService.errorReport(helptext.exportError, res.error, res.exception);
                        }
                      } else {
                        entityDialog.dialogRef.close(true);
                        dialogRef.close(true);
                        self.dialogService.errorReport(helptext.exportError, res.error, res.exception);
                      }
                    });
                  },
                };
                self.dialogService.dialogFormWide(conf);
              });
            });
          }
        },
      });

      if (rowData.is_decrypted && rowData.status !== 'OFFLINE') {
        actions.push({
          id: rowData.name,
          name: 'Add Vdevs',
          label: T('Add Vdevs'),
          onClick: (row1: any) => {
            this._router.navigate(new Array('/').concat(
              ['storage', 'manager', row1.id],
            ));
          },
        });
        actions.push({
          id: rowData.name,
          name: 'Scrub Pool',
          label: T('Scrub Pool'),
          onClick: (row1: any) => {
            this.getPoolData(row1.id).pipe(untilDestroyed(this)).subscribe((pools) => {
              if (!pools[0]) {
                return;
              }

              if (pools[0].scan.function === 'SCRUB' && pools[0].scan.state === PoolScanState.Scanning) {
                self.translate.get('Stop the scrub on ').pipe(untilDestroyed(this)).subscribe((msg) => {
                  this.dialogService.confirm(T('Scrub Pool'), msg + row1.name + '?', false, T('Stop Scrub'))
                    .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
                      if (res) {
                        this.loader.open();
                        this.ws.call('pool.scrub', [row1.id, 'STOP']).pipe(untilDestroyed(this)).subscribe(
                          () => {
                            this.loader.close();
                            self.translate.get('Stopping scrub on pool').pipe(untilDestroyed(this)).subscribe((msg) => {
                              this.dialogService.Info(T('Stop Scrub'), `${msg} <i>${row1.name}</i>`, '300px', 'info', true);
                            });
                          },
                          (err) => {
                            this.loader.close();
                            new EntityUtils().handleWSError(this, err, this.dialogService);
                          },
                        );
                      }
                    });
                });
              } else {
                self.translate.get('Start scrub on pool').pipe(untilDestroyed(this)).subscribe((msg) => {
                  this.dialogService.confirm(T('Scrub Pool'), `${msg} <i>${row1.name}</i>?`, false, T('Start Scrub')).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
                    if (res) {
                      this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: T('Scrub Pool') }, disableClose: false });
                      this.dialogRef.componentInstance.setCall('pool.scrub', [row1.id, 'START']);
                      this.dialogRef.componentInstance.submit();
                      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(
                        (jobres: any) => {
                          this.dialogRef.close(false);
                          if (jobres.progress.percent == 100 && jobres.progress.description === 'Scrub finished') {
                            self.translate.get('Scrub complete on pool').pipe(untilDestroyed(this)).subscribe((msg: string) => {
                              this.dialogService.Info(T('Scrub Complete'), `${msg} <i>${row1.name}</i>.`, '300px', 'info', true);
                            });
                          } else {
                            self.translate.get('Stopped the scrub on pool').pipe(untilDestroyed(this)).subscribe((msg: string) => {
                              this.dialogService.Info(T('Stop Scrub'), `${msg} <i>${row1.name}</i>.`, '300px', 'info', true);
                            });
                          }
                        },
                      );
                      this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
                        this.dialogRef.componentInstance.setDescription(err.error);
                      });
                    }
                  });
                });
              }
            });
          },
        });
        actions.push({
          id: rowData.name,
          name: 'Status',
          label: T('Status'),
          onClick: (row1: any) => {
            this._router.navigate(new Array('/').concat(
              ['storage', 'status', row1.id],
            ));
          },
        });
        actions.push({
          id: rowData.name,
          name: T('Expand Pool'),
          label: T('Expand Pool'),
          onClick: (row1: any) => {
            const parent = this;
            const conf: DialogFormConfiguration = {
              title: helptext.expand_pool_dialog.title + row1.name,
              fieldConfig: [
                {
                  type: 'paragraph',
                  name: 'expand_description',
                  paraText: helptext.expand_pool_dialog.message,
                },
                {
                  type: 'input',
                  inputType: 'password',
                  name: 'passphrase',
                  placeholder: helptext.expand_pool_dialog.passphrase_placeholder,
                  togglePw: true,
                  required: true,
                },
              ],
              saveButtonText: helptext.expand_pool_dialog.save_button,
              customSubmit(entityDialog: EntityDialogComponent) {
                doExpand(entityDialog);
              },
            };

            function doExpand(entityDialog?: EntityDialogComponent): void {
              parent.loader.open();
              const payload = [row1.id];
              if (entityDialog) {
                payload.push({ geli: { passphrase: entityDialog.formValue['passphrase'] } });
              }
              parent.ws.job('pool.expand', payload).pipe(untilDestroyed(this)).subscribe(
                (res) => {
                  parent.loader.close();
                  if (res.error) {
                    if (res.exc_info && res.exc_info.extra) {
                      res.extra = res.exc_info.extra;
                    }
                    new EntityUtils().handleWSError(this, res, parent.dialogService, conf.fieldConfig);
                  }
                  if (res.state === EntityJobState.Success) {
                    if (entityDialog) {
                      entityDialog.dialogRef.close(true);
                    }
                    self.translate.get(helptext.expand_pool_success_dialog.message).pipe(untilDestroyed(this)).subscribe((msg) => {
                      parent.dialogService.generalDialog({
                        title: helptext.expand_pool_success_dialog.title,
                        icon: 'info',
                        is_html: true,
                        message: `${msg} <i>${row1.name}</i>`,
                        hideCancel: true,
                      });
                    });
                  }
                },
                (err) => {
                  parent.loader.close();
                  new EntityUtils().handleWSError(this, err, parent.dialogService);
                },
              );
            }

            if (row1.encrypt === 0) {
              self.translate.get(helptext.expand_pool_dialog.title).pipe(untilDestroyed(this)).subscribe((msg) => {
                this.dialogService.generalDialog({
                  title: msg + row1.name,
                  message: helptext.expand_pool_dialog.message,
                  confirmBtnMsg: helptext.expand_pool_dialog.save_button,
                }).pipe(untilDestroyed(this)).subscribe((res) => {
                  if (res) {
                    doExpand();
                  }
                });
              });
            } else {
              self.dialogService.dialogForm(conf);
            }
          },
        });

        if (rowData.is_upgraded === false) {
          actions.push({
            id: rowData.name,
            name: T('Upgrade Pool'),
            label: T('Upgrade Pool'),
            onClick: (row1: any) => {
              this.translate.get(helptext.upgradePoolDialog_warning).pipe(untilDestroyed(this)).subscribe((warning) => {
                this.dialogService
                  .confirm(
                    T('Upgrade Pool'),
                    warning + row1.name,
                  )
                  .pipe(untilDestroyed(this)).subscribe((confirmResult: boolean) => {
                    if (confirmResult === true) {
                      this.loader.open();
                      this.ws.call('pool.upgrade', [rowData.id]).pipe(untilDestroyed(this)).subscribe(
                        () => {
                          this.translate.get(T('Successfully Upgraded ')).pipe(untilDestroyed(this)).subscribe((success_upgrade) => {
                            this.dialogService
                              .Info(
                                T('Upgraded'),
                                success_upgrade + row1.name,
                              )
                              .pipe(untilDestroyed(this)).subscribe(() => {
                                this.parentVolumesListComponent.repaintMe();
                              });
                          });
                        },
                        (res) => {
                          this.translate.get(T('Error Upgrading Pool ')).pipe(untilDestroyed(this)).subscribe((error_upgrade) => {
                            this.dialogService.errorReport(
                              error_upgrade + row1.name,
                              res.message,
                              res.stack,
                            );
                          });
                        },
                        () => this.loader.close(),
                      );
                    }
                  });
              });
            },
          });
        }
      }
    }

    if (rowData.type === 'FILESYSTEM') {
      if (!rowData.locked) {
        actions.push({
          id: rowData.name,
          name: T('Add Dataset'),
          label: T('Add Dataset'),
          onClick: () => {
            this.parentVolumesListComponent.addDataset(rowData.pool, rowData.id);
          },
        });
        actions.push({
          id: rowData.name,
          name: T('Add Zvol'),
          label: T('Add Zvol'),
          onClick: () => {
            this.parentVolumesListComponent.addZvol(rowData.id, true);
          },
        });
      }
      actions.push({
        id: rowData.name,
        name: T('Edit Options'),
        label: T('Edit Options'),
        onClick: () => {
          this.parentVolumesListComponent.editDataset(rowData.pool, rowData.id);
        },
      });
      if (rowDataPathSplit[1] !== 'iocage' && !rowData.locked) {
        actions.push({
          id: rowData.name,
          name: T('Edit Permissions'),
          label: T('Edit Permissions'),
          ttposition: 'left',
          onClick: () => {
            this.ws.call('filesystem.acl_is_trivial', [rowData.mountpoint]).pipe(untilDestroyed(this)).subscribe((acl_is_trivial) => {
              if (acl_is_trivial) {
                this._router.navigate(new Array('/').concat([
                  'storage', 'permissions', rowData.id,
                ]));
              } else {
                this.ws.call('filesystem.getacl', [rowData.mountpoint]).pipe(untilDestroyed(this)).subscribe((acl) => {
                  if (acl.acltype === AclType.Posix1e) {
                    this._router.navigate(new Array('/').concat([
                      'storage', 'id', rowData.pool, 'dataset',
                      'posix-acl', rowData.id,
                    ]));
                  } else {
                    this._router.navigate(new Array('/').concat([
                      'storage', 'id', rowData.pool, 'dataset',
                      'acl', rowData.id,
                    ]));
                  }
                });
              }
            });
          },
        },
        {
          id: rowData.name,
          name: T('User Quotas'),
          label: T('User Quotas'),
          onClick: () => {
            this._router.navigate(new Array('/').concat([
              'storage', 'user-quotas', rowData.id,
            ]));
          },
        },
        {
          id: rowData.name,
          name: T('Group Quotas'),
          label: T('Group Quotas'),
          onClick: () => {
            this._router.navigate(new Array('/').concat([
              'storage', 'group-quotas', rowData.id,
            ]));
          },
        });
      }

      if (rowData.id.indexOf('/') !== -1) {
        actions.push({
          id: rowData.name,
          name: T('Delete Dataset'),
          label: T('Delete Dataset'),
          onClick: (row1: any) => {
            self.translate.get('Delete Dataset').pipe(untilDestroyed(this)).subscribe((msg1) => {
              self.translate.get('The').pipe(untilDestroyed(this)).subscribe((theTr) => {
                self.translate.get('dataset and all snapshots stored with it <b>will be permanently deleted</b>.').pipe(untilDestroyed(this)).subscribe((msg2) => {
                  this.dialogService.doubleConfirm(
                    `${msg1} <i><b>${row1.name}</b></i>`,
                    `${theTr} <i><b>${row1.name}</b></i> ${msg2}`,
                    row1.name,
                    true,
                    T('DELETE DATASET'),
                  ).pipe(untilDestroyed(this)).subscribe((doubleConfirmDialog: boolean) => {
                    if (doubleConfirmDialog) {
                      this.loader.open();
                      this.ws.call('pool.dataset.delete', [rowData.id, { recursive: true }]).pipe(untilDestroyed(this)).subscribe(
                        () => {
                          this.loader.close();
                          this.parentVolumesListComponent.repaintMe();
                        },
                        (e_res) => {
                          this.loader.close();
                          if (e_res.reason.indexOf('Device busy') > -1) {
                            self.translate.get('Force deletion of dataset ').pipe(untilDestroyed(this)).subscribe((msg) => {
                              this.dialogService.confirm(T('Device Busy'), msg + '<i>' + row1.name + '</i>?', false, T('Force Delete')).pipe(untilDestroyed(this)).subscribe(
                                (res: boolean) => {
                                  if (res) {
                                    this.loader.open();
                                    this.ws.call('pool.dataset.delete', [rowData.id, { recursive: true, force: true }]).pipe(untilDestroyed(this)).subscribe(
                                      () => {
                                        this.loader.close();
                                        this.parentVolumesListComponent.repaintMe();
                                      },
                                      (err) => {
                                        this.loader.close();
                                        self.translate.get('Error deleting dataset ').pipe(untilDestroyed(this)).subscribe((msg) => {
                                          this.dialogService.errorReport(msg + '<i>' + row1.name + '</i>.', err.reason, err.stack);
                                        });
                                      },
                                    );
                                  }
                                },
                              );
                            });
                          } else {
                            self.translate.get('Error deleting dataset ').pipe(untilDestroyed(this)).subscribe((msg) => {
                              this.dialogService.errorReport(msg + '<i>' + row1.name + '</i>.', e_res.reason, e_res.stack);
                            });
                          }
                        },
                      );
                    }
                  });
                });
              });
            });
          },
        });
      }
    }
    if (rowData.type === 'VOLUME') {
      actions.push({
        id: rowData.name,
        name: T('Delete Zvol'),
        label: T('Delete Zvol'),
        onClick: (row1: any) => {
          self.translate.get('Delete the zvol ').pipe(untilDestroyed(this)).subscribe((msg1) => {
            self.translate.get(' and all snapshots of it?').pipe(untilDestroyed(this)).subscribe((msg2) => {
              this.dialogService.doubleConfirm(T('Delete '),
                msg1 + '<b><i>' + row1.name + '</i></b>' + msg2, row1.name,
                true, T('Delete Zvol')).pipe(untilDestroyed(this)).subscribe((confirmed: boolean) => {
                if (confirmed === true) {
                  this.loader.open();

                  this.ws.call('pool.dataset.delete', [rowData.id, { recursive: true }]).pipe(untilDestroyed(this)).subscribe(() => {
                    this.loader.close();
                    this.parentVolumesListComponent.repaintMe();
                  }, (res) => {
                    this.loader.close();
                    self.translate.get('Error Deleting zvol ').pipe(untilDestroyed(this)).subscribe((msg) => {
                      this.dialogService.errorReport(msg + row1.id, res.reason, res.stack);
                    });
                  });
                }
              });
            });
          });
        },
      });
      actions.push({
        id: rowData.name,
        name: T('Edit Zvol'),
        label: T('Edit Zvol'),
        onClick: () => {
          this.parentVolumesListComponent.addZvol(rowData.id, false);
        },
      });
    }
    if (rowData.type === 'VOLUME' || rowData.type === 'FILESYSTEM') {
      actions.push({
        id: rowData.name,
        name: T('Create Snapshot'),
        label: T('Create Snapshot'),
        onClick: (row: any) => {
          this.ws.call('vmware.dataset_has_vms', [row.id, false]).pipe(untilDestroyed(this)).subscribe((vmware_res) => {
            this.vmware_res_status = vmware_res;
          });
          this.dialogConf = {
            title: 'One time snapshot of ' + rowData.id,
            fieldConfig: [
              {
                type: 'input',
                name: 'dataset',
                placeholder: helptext.snapshotDialog_dataset_placeholder,
                value: rowData.id,
                isHidden: true,
                readonly: true,
              },
              {
                type: 'input',
                name: 'name',
                placeholder: helptext.snapshotDialog_name_placeholder,
                tooltip: helptext.snapshotDialog_name_tooltip,
                validation: helptext.snapshotDialog_name_validation,
                required: true,
                value: 'manual-' + this.getTimestamp(),
              },
              {
                type: 'checkbox',
                name: 'recursive',
                placeholder: helptext.snapshotDialog_recursive_placeholder,
                tooltip: helptext.snapshotDialog_recursive_tooltip,
                parent: this,
                updater: (parent: any) => {
                  parent.recursiveIsChecked = !parent.recursiveIsChecked;
                  parent.ws.call('vmware.dataset_has_vms', [row.id, parent.recursiveIsChecked]).pipe(untilDestroyed(this)).subscribe((vmware_res: any) => {
                    parent.vmware_res_status = vmware_res;
                    _.find(parent.dialogConf.fieldConfig, { name: 'vmware_sync' })['isHidden'] = !parent.vmware_res_status;
                  });
                },
              },
              {
                type: 'checkbox',
                name: 'vmware_sync',
                placeholder: helptext.vmware_sync_placeholder,
                tooltip: helptext.vmware_sync_tooltip,
                isHidden: !this.vmware_res_status,
              },
            ],
            method_ws: 'zfs.snapshot.create',
            saveButtonText: T('Create Snapshot'),
          };
          this.dialogService.dialogForm(this.dialogConf).pipe(untilDestroyed(this)).subscribe((res) => {
            if (res) {
              this.dialogService.Info(T('Create Snapshot'), T('Snapshot successfully taken.'));
            }
          });
        },
      });

      const rowDataset = _.find(this.datasetData, { id: rowData.id });
      if (rowDataset && rowDataset['origin'] && !!rowDataset['origin'].parsed) {
        actions.push({
          id: rowData.name,
          name: T('Promote Dataset'),
          label: T('Promote Dataset'),
          onClick: (row1: any) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.id]).pipe(untilDestroyed(this)).subscribe(() => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService.Info(T('Promote Dataset'), T('Successfully Promoted ') + row1.id).pipe(untilDestroyed(this)).subscribe(() => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              self.translate.get('Error Promoting dataset ').pipe(untilDestroyed(this)).subscribe((msg) => {
                this.dialogService.errorReport(msg + row1.id, res.reason, res.stack);
              });
            });
          },
        });
      }
    }
    return actions;
  }

  getEncryptedDatasetActions(rowData: any): any[] {
    const encryption_actions = [];
    if (rowData.encrypted) {
      if (rowData.locked) {
        if (rowData.is_encrypted_root && (!rowData.parent || (rowData.parent && !rowData.parent.locked))) {
          encryption_actions.push({
            id: rowData.name,
            name: T('Unlock'),
            label: T('Unlock'),
            onClick: () => {
              // unlock
              this._router.navigate(new Array('/').concat([
                'storage', 'id', rowData.pool, 'dataset',
                'unlock', rowData.id,
              ]));
            },
          });
        }
      } else {
        encryption_actions.push({
          id: rowData.name,
          name: T('Encryption Options'),
          label: T('Encryption Options'),
          onClick: (row: any) => {
            // open encryption options dialog
            let key_child = false;
            for (let i = 0; i < this.datasetData.length; i++) {
              const ds = this.datasetData[i];
              if (ds['id'].startsWith(row.id) && ds.id !== row.id
                && ds.encryption_root && (ds.id === ds.encryption_root)
                && ds.key_format && ds.key_format.value && ds.key_format.value === 'HEX') {
                key_child = true;
                break;
              }
            }
            const can_inherit = (row.parent && row.parent.encrypted);
            const passphrase_parent = (row.parent && row.parent.key_format && row.parent.key_format.value === 'PASSPHRASE');
            const is_key = (passphrase_parent ? false : (key_child ? true : !row.is_passphrase));
            let pbkdf2iters = 350000; // will pull from row when it has been added to the payload
            if (row.pbkdf2iters && row.pbkdf2iters && row.pbkdf2iters.rawvalue !== '0') {
              pbkdf2iters = row.pbkdf2iters.rawvalue;
            }
            const self = this;
            this.dialogConf = {
              title: helptext.encryption_options_dialog.dialog_title + row.id,
              fieldConfig: [
                {
                  type: 'checkbox',
                  name: 'inherit_encryption',
                  class: 'inline',
                  width: '50%',
                  placeholder: helptext.encryption_options_dialog.inherit_placeholder,
                  tooltip: helptext.encryption_options_dialog.inherit_tooltip,
                  value: !row.is_encrypted_root,
                  isHidden: !can_inherit,
                  disabled: !can_inherit,
                },
                {
                  type: 'select',
                  name: 'encryption_type',
                  placeholder: dataset_helptext.dataset_form_encryption.encryption_type_placeholder,
                  tooltip: dataset_helptext.dataset_form_encryption.encryption_type_tooltip,
                  value: (is_key ? 'key' : 'passphrase'),
                  options: dataset_helptext.dataset_form_encryption.encryption_type_options,
                  isHidden: passphrase_parent || key_child,
                },
                {
                  type: 'checkbox',
                  name: 'generate_key',
                  placeholder: dataset_helptext.dataset_form_encryption.generate_key_checkbox_placeholder,
                  tooltip: dataset_helptext.dataset_form_encryption.generate_key_checkbox_tooltip,
                  disabled: !is_key,
                  isHidden: !is_key,
                },
                {
                  type: 'textarea',
                  name: 'key',
                  placeholder: dataset_helptext.dataset_form_encryption.key_placeholder,
                  tooltip: dataset_helptext.dataset_form_encryption.key_tooltip,
                  validation: dataset_helptext.dataset_form_encryption.key_validation,
                  required: true,
                  disabled: !is_key,
                  isHidden: !is_key,
                },
                {
                  type: 'input',
                  name: 'passphrase',
                  inputType: 'password',
                  placeholder: dataset_helptext.dataset_form_encryption.passphrase_placeholder,
                  tooltip: dataset_helptext.dataset_form_encryption.passphrase_tooltip,
                  validation: dataset_helptext.dataset_form_encryption.passphrase_validation,
                  togglePw: true,
                  required: true,
                  disabled: is_key,
                  isHidden: is_key,
                },
                {
                  type: 'input',
                  placeholder: dataset_helptext.dataset_form_encryption.confirm_passphrase_placeholder,
                  name: 'confirm_passphrase',
                  inputType: 'password',
                  required: true,
                  togglePw: true,
                  validation: this.validationService.matchOtherValidator('passphrase'),
                  disabled: is_key,
                  isHidden: is_key,
                },
                {
                  type: 'input',
                  name: 'pbkdf2iters',
                  placeholder: dataset_helptext.dataset_form_encryption.pbkdf2iters_placeholder,
                  tooltip: dataset_helptext.dataset_form_encryption.pbkdf2iters_tooltip,
                  required: true,
                  value: pbkdf2iters,
                  validation: dataset_helptext.dataset_form_encryption.pbkdf2iters_validation,
                  disabled: is_key,
                  isHidden: is_key,
                },
                {
                  type: 'input',
                  name: 'algorithm',
                  placeholder: dataset_helptext.dataset_form_encryption.algorithm_placeholder,
                  disabled: true,
                  value: (row.encryption_algorithm && row.encryption_algorithm.value) ? row.encryption_algorithm.value : '',
                },
                {
                  type: 'checkbox',
                  name: 'confirm',
                  placeholder: helptext.encryption_options_dialog.confirm_checkbox,
                  required: true,
                },
              ],
              saveButtonText: helptext.encryption_options_dialog.save_button,
              afterInit(entityDialog: EntityDialogComponent) {
                const inherit_encryption_fg = entityDialog.formGroup.controls['inherit_encryption'];
                const encryption_type_fg = entityDialog.formGroup.controls['encryption_type'];
                const encryption_type_fc = _.find(entityDialog.fieldConfig, { name: 'encryption_type' });
                const generate_key_fg = entityDialog.formGroup.controls['generate_key'];

                const all_encryption_fields = ['encryption_type', 'passphrase', 'confirm_passphrase', 'pbkdf2iters', 'generate_key', 'key'];

                if (inherit_encryption_fg.value) { // if already inheriting show as inherit
                  for (let i = 0; i < all_encryption_fields.length; i++) {
                    entityDialog.setDisabled(all_encryption_fields[i], true, true);
                  }
                }
                inherit_encryption_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((inherit) => {
                  if (inherit) {
                    for (let i = 0; i < all_encryption_fields.length; i++) {
                      entityDialog.setDisabled(all_encryption_fields[i], inherit, inherit);
                    }
                  } else {
                    entityDialog.setDisabled('encryption_type', inherit, inherit);
                    if (passphrase_parent || key_child) { // keep hidden if passphrase parent;
                      encryption_type_fc.isHidden = true;
                    }
                    const key = (encryption_type_fg.value === 'key');
                    entityDialog.setDisabled('passphrase', key, key);
                    entityDialog.setDisabled('confirm_passphrase', key, key);
                    entityDialog.setDisabled('pbkdf2iters', key, key);
                    entityDialog.setDisabled('generate_key', !key, !key);
                    if (key) {
                      const gen_key = generate_key_fg.value;
                      entityDialog.setDisabled('key', gen_key, gen_key);
                    } else {
                      entityDialog.setDisabled('key', true, true);
                    }
                  }
                });

                encryption_type_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((enc_type) => {
                  const key = (enc_type === 'key');
                  entityDialog.setDisabled('generate_key', !key, !key);
                  if (key) {
                    const gen_key = generate_key_fg.value;
                    entityDialog.setDisabled('key', gen_key, gen_key);
                  } else {
                    entityDialog.setDisabled('key', true, true);
                  }
                  entityDialog.setDisabled('passphrase', key, key);
                  entityDialog.setDisabled('confirm_passphrase', key, key);
                  entityDialog.setDisabled('pbkdf2iters', key, key);
                });

                generate_key_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((gen_key) => {
                  if (!inherit_encryption_fg.value && encryption_type_fg.value === 'key') {
                    entityDialog.setDisabled('key', gen_key, gen_key);
                  }
                });
              },
              customSubmit(entityDialog: any) {
                const formValue = entityDialog.formValue;
                let method = 'pool.dataset.change_key';
                const body: any = {};
                const payload = [row.id];
                if (formValue.inherit_encryption) {
                  if (row.is_encrypted_root) { // only try to change to inherit if not currently inheriting
                    method = 'pool.dataset.inherit_parent_encryption_properties';
                    entityDialog.loader.open();
                    entityDialog.ws.call(method, payload).pipe(untilDestroyed(this)).subscribe(() => {
                      entityDialog.loader.close();
                      self.dialogService.Info(helptext.encryption_options_dialog.dialog_saved_title,
                        helptext.encryption_options_dialog.dialog_saved_message1 + row.id + helptext.encryption_options_dialog.dialog_saved_message2);
                      entityDialog.dialogRef.close();
                      self.parentVolumesListComponent.repaintMe();
                    }, (err: any) => {
                      entityDialog.loader.close();
                      new EntityUtils().handleWSError(entityDialog, err, self.dialogService);
                    });
                  } else { // just close the dialog if the inherit checkbox is checked but we are already inheriting
                    entityDialog.dialogRef.close();
                  }
                } else {
                  if (formValue.encryption_type === 'key') {
                    body['generate_key'] = formValue.generate_key;
                    if (!formValue.generate_key) {
                      body['key'] = formValue.key;
                    }
                  } else {
                    body['passphrase'] = formValue.passphrase;
                    body['pbkdf2iters'] = formValue.pbkdf2iters;
                  }
                  payload.push(body);
                  const dialogRef = self.mdDialog.open(EntityJobComponent, {
                    data: { title: helptext.encryption_options_dialog.save_encryption_options },
                    disableClose: true,
                  });
                  dialogRef.componentInstance.setDescription(helptext.encryption_options_dialog.saving_encryption_options);
                  dialogRef.componentInstance.setCall(method, payload);
                  dialogRef.componentInstance.submit();
                  dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
                    if (res) {
                      dialogRef.close();
                      entityDialog.dialogRef.close();
                      self.translate.get(helptext.encryption_options_dialog.dialog_saved_message1).pipe(untilDestroyed(this)).subscribe((msg1) => {
                        self.translate.get(helptext.encryption_options_dialog.dialog_saved_message2).pipe(untilDestroyed(this)).subscribe((msg2) => {
                          self.dialogService.Info(helptext.encryption_options_dialog.dialog_saved_title,
                            msg1 + row.id + msg2);
                          self.parentVolumesListComponent.repaintMe();
                        });
                      });
                    }
                  });
                  dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
                    if (err) {
                      dialogRef.close();
                      new EntityUtils().handleWSError(entityDialog, err, self.dialogService);
                    }
                  });
                }
              },
            };
            this.dialogService.dialogForm(this.dialogConf).pipe(untilDestroyed(this)).subscribe(() => {
            });
          },
        });
        if (rowData.is_encrypted_root && rowData.is_passphrase) {
          encryption_actions.push({
            id: rowData.name,
            name: T('Lock'),
            label: T('Lock'),
            onClick: (row: any) => {
              // lock
              const params = [row.id];
              let force_umount = false;
              this.translate.get(helptext.lock_dataset_dialog.dialog_title).pipe(untilDestroyed(this)).subscribe((titleTr) => {
                this.translate.get(helptext.lock_dataset_dialog.dialog_message).pipe(untilDestroyed(this)).subscribe((messageTr) => {
                  const ds = this.dialogService.confirm(titleTr + row.name, `${messageTr} ${row.name}?`,
                    false, helptext.lock_dataset_dialog.button,
                    true, helptext.lock_dataset_dialog.checkbox_message, 'pool.dataset.lock', params);

                  ds.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe((res: any) => {
                    force_umount = res;
                  });
                  ds.afterClosed().pipe(
                    filter(Boolean),
                    untilDestroyed(this),
                  ).subscribe(() => {
                    const lockDescription = this.translate.instant(helptext.lock_dataset_dialog.locking_dataset_description);
                    const dialogRef = this.mdDialog.open(EntityJobComponent, {
                      data: { title: helptext.lock_dataset_dialog.locking_dataset },
                      disableClose: true,
                    });
                    dialogRef.componentInstance.setDescription(lockDescription + rowData.name);
                    params.push({ force_umount });
                    dialogRef.componentInstance.setCall(ds.componentInstance.method, params);
                    dialogRef.componentInstance.submit();
                    let done = false;
                    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
                      if (!done) {
                        dialogRef.close(false);
                        done = true;
                        this.parentVolumesListComponent.repaintMe();
                      }
                    });

                    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: any) => {
                      dialogRef.close(false);
                      new EntityUtils().handleWSError(this, res, this.dialogService);
                    });
                  });
                });
              });
            },
          });
        }
        if (rowData.encrypted && rowData.key_loaded && rowData.encryption_root === rowData.id && !rowData.is_passphrase) {
          const fileName = 'dataset_' + rowData.name + '_key.txt';
          const mimetype = 'text/plain';
          const message = helptext.export_keys_message + rowData.id;
          encryption_actions.push({
            id: rowData.id,
            name: T('Export Key'),
            label: T('Export Key'),
            onClick: () => {
              this.dialogService.passwordConfirm(message).pipe(untilDestroyed(this)).subscribe((export_keys) => {
                if (export_keys) {
                  const dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: T('Retrieving Key') }, disableClose: true });
                  dialogRef.componentInstance.setCall('pool.dataset.export_key', [rowData.id]);
                  dialogRef.componentInstance.submit();
                  dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: any) => {
                    dialogRef.close();
                    this.dialogService.confirm(`Key for ${rowData.id}`, res.result, true, T('Download Key'), false,
                      '', '', '', '', false, T('Close')).pipe(untilDestroyed(this)).subscribe((download: boolean) => {
                      if (download) {
                        this.loader.open();
                        this.ws.call('core.download', ['pool.dataset.export_key', [rowData.id, true], fileName]).pipe(untilDestroyed(this)).subscribe((res: any) => {
                          this.loader.close();
                          const url = res[1];
                          this.storageService.streamDownloadFile(this.http, url, fileName, mimetype).pipe(untilDestroyed(this)).subscribe((file) => {
                            if (res !== null && res !== '') {
                              this.storageService.downloadBlob(file, fileName);
                            }
                          });
                        }, (e) => {
                          this.loader.close();
                          new EntityUtils().handleWSError(this, e, this.dialogService);
                        });
                      }
                    });
                  });
                }
              });
            },
          });
        }
      }
    }
    return encryption_actions;
  }

  clickAction(rowData: any): void {
    const editPermissions = rowData.actions[0].actions.find((o: any) => o.name === 'Edit Permissions');
    if (!rowData.locked && editPermissions) {
      if (!rowData.id.includes('/')) {
        editPermissions.disabled = true;
        editPermissions.matTooltip = helptext.permissions_edit_msg1;
      } else {
        editPermissions.disabled = false;
        editPermissions.matTooltip = null;
      }
    }
  }

  getTimestamp(): string {
    const dateTime = new Date();
    return format(dateTime, 'yyyy-MM-dd_HH-mm');
  }

  dataHandler(data: any): TreeNode {
    const node: TreeNode = {};
    node.data = data;
    parent = data.parent;
    this.getMoreDatasetInfo(data, parent);
    node.data.group_actions = true;
    let actions_title = helptext.dataset_actions;
    if (data.type === DatasetType.Volume) {
      actions_title = helptext.zvol_actions;
    }
    const actions = [{ title: actions_title, actions: this.getActions(data) }];
    if (data.type === DatasetType.Filesystem || data.type === DatasetType.Volume) {
      const encryption_actions = this.getEncryptedDatasetActions(data);
      if (encryption_actions.length > 0) {
        actions.push({ title: helptext.encryption_actions_title, actions: encryption_actions });
      }
    }
    node.data.actions = actions;

    node.children = [];

    if (data.children) {
      for (let i = 0; i < data.children.length; i++) {
        const child = data.children[i];
        child.parent = data;
        node.children.push(this.dataHandler(child));
      }
      node.children.sort((a, b) => a.data.id.localeCompare(b.data.id));
    }
    delete node.data.children;

    return node;
  }

  getMoreDatasetInfo(dataObj: any, parent: any): void {
    const dataset_data2 = this.datasetData;
    this.translate.get(T('Inherits')).pipe(untilDestroyed(this)).subscribe((inherits) => {
      for (const k in dataset_data2) {
        if (dataset_data2[k].id === dataObj.id) {
          if (dataset_data2[k].compression) {
            dataset_data2[k].compression.source !== 'INHERITED'
              ? dataObj.compression = (dataset_data2[k].compression.parsed)
              : dataObj.compression = (inherits + ' (' + dataset_data2[k].compression.parsed + ')');
          }
          if (dataset_data2[k].compressratio) {
            dataset_data2[k].compressratio.source !== 'INHERITED'
              ? dataObj.compressratio = (dataset_data2[k].compressratio.parsed)
              : dataObj.compressratio = (inherits + ' (' + dataset_data2[k].compressratio.parsed + ')');
          }
          if (dataset_data2[k].readonly) {
            dataset_data2[k].readonly.source !== 'INHERITED'
              ? dataObj.readonly = (dataset_data2[k].readonly.parsed)
              : dataObj.readonly = (inherits + ' (' + dataset_data2[k].readonly.parsed + ')');
          }
          if (dataset_data2[k].deduplication) {
            dataset_data2[k].deduplication.source !== 'INHERITED'
              ? dataObj.dedup = (dataset_data2[k].deduplication.parsed)
              : dataObj.dedup = (inherits + ' (' + dataset_data2[k].deduplication.parsed + ')');
          }
          if (dataset_data2[k].comments) {
            dataset_data2[k].comments.source !== 'INHERITED'
              ? dataObj.comments = (dataset_data2[k].comments.parsed)
              : dataObj.comments = ('');
          }
        }
        // add name, available and used into the data object
        dataObj.name = dataObj.name.split('/').pop();
        dataObj.available_parsed = this.storageService.convertBytestoHumanReadable(dataObj.available.parsed || 0);
        dataObj.used_parsed = this.storageService.convertBytestoHumanReadable(dataObj.used.parsed || 0);
        dataObj.is_encrypted_root = (dataObj.id === dataObj.encryption_root);
        if (dataObj.is_encrypted_root) {
          this.parentVolumesListComponent.has_encrypted_root[parent.pool] = true;
        }
        dataObj.non_encrypted_on_encrypted = (!dataObj.encrypted && parent.encrypted);
      }
    });
  }
}

@Component({
  selector: 'app-volumes-list',
  styleUrls: ['./volumes-list.component.scss'],
  templateUrl: './volumes-list.component.html',
  providers: [],
})
export class VolumesListComponent extends EntityTableComponent implements OnInit, OnDestroy {
  title = T('Pools');
  zfsPoolRows: ZfsPoolData[] = [];
  conf = new VolumesListTableConfig(
    this,
    this.router,
    '',
    [],
    this.mdDialog,
    this.ws,
    this.dialogService,
    this.loader,
    this.translate,
    this.storage,
    {},
    this.messageService,
    this.http,
    this.validationService,
  );

  actionComponent = {
    getActions: (row: Pool) => {
      const actions: any[] = [
        {
          name: 'pool_actions',
          title: helptext.pool_actions_title,
          actions: this.conf.getActions(row),
        },
      ];

      if (row.status !== PoolStatus.Offline) {
        const encryptionActions = {
          name: 'encryption_actions',
          title: helptext.encryption_actions_title,
          actions: (<VolumesListTableConfig> this.conf).getEncryptedActions(row),
        };
        actions.push(encryptionActions);
      }

      return actions;
    },
    conf: new VolumesListTableConfig(
      this,
      this.router,
      '',
      [],
      this.mdDialog,
      this.ws,
      this.dialogService,
      this.loader,
      this.translate,
      this.storage,
      {},
      this.messageService,
      this.http,
      this.validationService,
    ),
  };

  expanded = false;
  paintMe = true;
  systemdatasetPool: any;
  has_encrypted_root: { [pool: string]: boolean } = {};
  has_key_dataset: { [pool: string]: boolean } = {};
  entityEmptyConf: EmptyConfig = {
    type: EmptyType.first_use,
    large: true,
    title: T('No Pools'),
    message: `${T('It seems you haven\'t configured pools yet.')} ${T('Please click the button below to create a pool.')}`,
    button: {
      label: T('Create pool'),
      action: this.createPool.bind(this),
    },
  };
  protected addZvolComponent: ZvolFormComponent;
  protected addDatasetFormComponent: DatasetFormComponent;
  protected editDatasetFormComponent: DatasetFormComponent;
  protected aroute: ActivatedRoute;
  private refreshTableSubscription: Subscription;
  private datasetQuery: 'pool.dataset.query' = 'pool.dataset.query';
  /*
   * Please note that extra options are special in that they are passed directly to ZFS.
   * This is why 'encryptionroot' is included in order to get 'encryption_root' in the response
   * */
  private datasetQueryOptions: QueryParams<Dataset, ExtraDatasetQueryOptions> = [[], {
    extra: {
      properties: [
        'type',
        'used',
        'available',
        'compression',
        'readonly',
        'dedup',
        'org.freenas:description',
        'compressratio',
        'encryption',
        'encryptionroot',
        'keystatus',
        'keyformat',
        'mountpoint',
      ],
    },
  }];

  readonly PoolStatus = PoolStatus;

  constructor(
    protected core: CoreService,
    protected router: Router,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected mdDialog: MatDialog,
    protected translate: TranslateService,
    public sorter: StorageService,
    protected job: JobService,
    protected storage: StorageService,
    protected pref: PreferencesService,
    protected messageService: MessageService,
    protected http: HttpClient,
    modalService: ModalService,
    public tableService: EntityTableService,
    protected validationService: ValidationService,
  ) {
    super(core, router, ws, dialogService, loader, translate, sorter, job, pref, mdDialog, modalService);

    this.actionsConfig = { actionType: VolumesListControlsComponent, actionConfig: this };
    this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
  }

  repaintMe(): void {
    this.showDefaults = false;
    this.paintMe = false;
    this.ngOnInit();
  }

  ngOnDestroy(): void {
    if (this.refreshTableSubscription) {
      this.refreshTableSubscription.unsubscribe();
    }
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner = true;

    this.systemdatasetPool = await this.ws.call('systemdataset.config').pipe(map((res) => res.pool)).toPromise();

    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }

    this.has_key_dataset = {};
    this.has_encrypted_root = {};
    this.ws.call('pool.dataset.query_encrypted_roots_keys').pipe(untilDestroyed(this)).subscribe((res) => {
      for (const key in res) {
        if (res.hasOwnProperty(key)) {
          const pool = key.split('/')[0];
          this.has_key_dataset[pool] = true;
        }
      }
    });

    if (!this.refreshTableSubscription) {
      this.refreshTableSubscription = this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
        this.repaintMe();
      });
    }

    combineLatest([
      this.ws.call('pool.query', []),
      this.ws.call(this.datasetQuery, this.datasetQueryOptions),
    ]).pipe(untilDestroyed(this)).subscribe(async ([pools, datasets]: [any[], any[]]) => {
      // TODO: Additional fields added on frontend.
      if (pools.length > 0) {
        for (const pool of pools) {
          pool.is_upgraded = await this.ws.call('pool.is_upgraded', [pool.id]).toPromise();
          if (!pool.is_decrypted) {
            pool.status = 'LOCKED';
          }

          /* Filter out system datasets */
          const pChild = datasets.find((set) => set.name === pool.name);
          if (pChild) {
            pChild.children = pChild.children.filter((child: any) => child.name.indexOf(`${pool.name}/.system`) === -1 && child.name.indexOf(`${pool.name}/.glusterfs`) === -1);
          }
          pool.children = pChild ? [pChild] : [];

          pool.volumesListTableConfig = new VolumesListTableConfig(
            this,
            this.router,
            pool.id,
            datasets,
            this.mdDialog,
            this.ws,
            this.dialogService,
            this.loader,
            this.translate,
            this.storage,
            pool,
            this.messageService,
            this.http,
            this.validationService,
          );
          pool.type = 'zpool';

          if (pool.children && pool.children[0]) {
            try {
              pool.children[0].is_encrypted_root = (pool.children[0].id === pool.children[0].encryption_root);
              if (pool.children[0].is_encrypted_root) {
                this.has_encrypted_root[pool.name] = true;
              }
              pool.children[0].available_parsed = this.storage.convertBytestoHumanReadable(pool.children[0].available.parsed || 0);
              pool.children[0].used_parsed = this.storage.convertBytestoHumanReadable(pool.children[0].used.parsed || 0);
              pool.availStr = filesize(pool.children[0].available.parsed, { standard: 'iec' });
              pool.children[0].has_encrypted_children = false;
              for (let i = 0; i < datasets.length; i++) {
                const ds = datasets[i];
                if (ds['id'].startsWith(pool.children[0].id) && ds.id !== pool.children[0].id && ds.encrypted) {
                  pool.children[0].has_encrypted_children = true;
                  break;
                }
              }
            } catch (error) {
              pool.availStr = '' + pool.children[0].available.parsed;
              pool.children[0].available_parsed = 'Unknown';
              pool.children[0].used_parsed = 'Unknown';
            }

            try {
              const used_pct = pool.children[0].used.parsed / (pool.children[0].used.parsed + pool.children[0].available.parsed);
              pool.usedStr = '' + filesize(pool.children[0].used.parsed, { standard: 'iec' }) + ' (' + Math.round(used_pct * 100) + '%)';
            } catch (error) {
              pool.usedStr = '' + pool.children[0].used.parsed;
            }
          }

          this.zfsPoolRows.push(pool);
        }
      }

      this.zfsPoolRows = this.sorter.tableSorter(this.zfsPoolRows, 'name', 'asc');

      if (this.zfsPoolRows.length === 1) {
        this.expanded = true;
      }

      this.paintMe = true;

      this.showDefaults = true;
      this.showSpinner = false;
    }, (res) => {
      this.showDefaults = true;
      this.showSpinner = false;

      this.dialogService.errorReport(T('Error getting pool data.'), res.message, res.stack);
    });

    this.addZvolComponent = new ZvolFormComponent(this.router, this.aroute, this.ws, this.loader,
      this.dialogService, this.storageService, this.translate, this.modalService);

    this.addDatasetFormComponent = new DatasetFormComponent(
      this.router, this.aroute, this.ws, this.loader, this.dialogService, this.storageService, this.modalService,
    );
  }

  addZvol(id: string, isNew: boolean): void {
    this.addZvolComponent.setParent(id);
    this.addZvolComponent.isNew = isNew;
    this.modalService.open('slide-in-form', this.addZvolComponent, id);
  }

  addDataset(pool: any, id: string): void {
    this.addDatasetFormComponent.setParent(id);
    this.addDatasetFormComponent.setVolId(pool);
    this.addDatasetFormComponent.setTitle(T('Add Dataset'));
    this.modalService.open('slide-in-form', this.addDatasetFormComponent, id);
  }

  editDataset(pool: any, id: string): void {
    this.editDatasetFormComponent = new DatasetFormComponent(
      this.router, this.aroute, this.ws, this.loader, this.dialogService, this.storageService, this.modalService,
    );

    this.editDatasetFormComponent.setPk(id);
    this.editDatasetFormComponent.setVolId(pool);
    this.editDatasetFormComponent.setTitle(T('Edit Dataset'));
    this.modalService.open('slide-in-form', this.editDatasetFormComponent, id);
  }

  createPool(): void {
    this.router.navigate(['/storage/manager']);
  }
}
