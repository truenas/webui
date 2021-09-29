import { HttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { DatasetEncryptionType } from 'app/enums/dataset-encryption-type.enum';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { ProductType } from 'app/enums/product-type.enum';
import dataset_helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { DatasetChangeKeyParams } from 'app/interfaces/dataset-change-key.interface';
import { DatasetLockParams } from 'app/interfaces/dataset-lock.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { PoolProcess } from 'app/interfaces/pool-process.interface';
import { PoolUnlockQuery } from 'app/interfaces/pool-unlock-query.interface';
import { Pool, PoolExpandParams } from 'app/interfaces/pool.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  VolumesListDataset,
  VolumesListPool,
} from 'app/pages/storage/volumes/volumes-list/volumes-list-pool.interface';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import {
  AppLoaderService, DialogService, StorageService, ValidationService, WebSocketService,
} from 'app/services';
import { T } from 'app/translate-marker';

export class VolumesListTableConfig implements EntityTableConfig {
  hideTopActions = true;
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

  config = {
    deleteMsg: {
      key_props: ['name'],
    },
  };

  protected dialogRef: MatDialogRef<EntityJobComponent>;
  route_add = ['storage', 'import'];
  route_add_tooltip = T('Create or Import Pool');
  showDefaults = false;
  showSpinner: boolean;
  // TODO: Unused?
  encryptedStatus: number;
  private vmware_res_status: boolean;
  dialogConf: DialogFormConfiguration;
  restartServices = false;
  subs: Subs;
  productType = window.localStorage.getItem('product_type') as ProductType;

  private recursiveIsChecked = false;

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private router: Router,
    private classId: string,
    private datasetData: Dataset[],
    public mdDialog: MatDialog,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService,
    protected storageService: StorageService,
    protected volumeData: VolumesListPool,
    protected messageService: MessageService,
    protected http: HttpClient,
    protected validationService: ValidationService,
  ) {
    if (typeof (this.classId) !== 'undefined' && this.classId !== '' && volumeData && volumeData['children']) {
      this.tableData = [];
      for (let i = 0; i < volumeData['children'].length; i++) {
        const child = volumeData['children'][i];
        child.parent = volumeData;
        this.tableData.push(this.dataHandler(child));
      }
    }
  }

  destroy(): void {
    console.info(`The ${this.constructor.name} has been destroyed`);
  }

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'download_key' && this.encryptedStatus > 0) {
      return true;
    }
    return false;
  }

  getEncryptedActions(rowData: VolumesListPool): EntityTableAction[] {
    const actions = [];

    if (this.parentVolumesListComponent.has_encrypted_root[rowData.name]
      && this.parentVolumesListComponent.has_key_dataset[rowData.name]) {
      actions.push({
        label: T('Export Dataset Keys'),
        onClick: (row1: VolumesListPool) => {
          const message = helptext.export_keys_message + row1.name;
          const fileName = 'dataset_' + row1.name + '_keys.json';
          this.dialogService.passwordConfirm(message).pipe(untilDestroyed(this, 'destroy')).subscribe((export_keys) => {
            if (export_keys) {
              this.loader.open();
              const mimetype = 'application/json';
              this.ws.call('core.download', ['pool.dataset.export_keys', [row1.name], fileName]).pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                this.loader.close();
                const url = res[1];
                this.storageService.streamDownloadFile(this.http, url, fileName, mimetype)
                  .pipe(untilDestroyed(this, 'destroy'))
                  .subscribe((file) => {
                    if (res !== null && (res as any) !== '') {
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

    return actions as EntityTableAction[];
  }

  keyFileUpdater(file: FormUploadComponent, parent: this): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  unlockAction(row1: VolumesListPool): void {
    this.storageService.poolUnlockServiceOptions(row1.id).pipe(
      map((serviceOptions) => ({
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
            message: this.messageService,
            updater: this.keyFileUpdater,
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
            value: serviceOptions.map((option) => option.value),
            options: serviceOptions,
          },
        ],
        afterInit: (entityDialog: EntityDialogComponent) => {
          this.messageService.messageSourceHasNewMessage$.pipe(untilDestroyed(this, 'destroy')).subscribe((message) => {
            entityDialog.formGroup.controls['key'].setValue(message);
          });
          // these disabled booleans are here to prevent recursion errors, disabling only needs to happen once
          let keyDisabled = false;
          let passphraseDisabled = false;
          entityDialog.formGroup.controls['passphrase'].valueChanges.pipe(untilDestroyed(this, 'destroy')).subscribe((passphrase) => {
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
          entityDialog.formGroup.controls['key'].valueChanges.pipe(untilDestroyed(this, 'destroy')).subscribe((key) => {
            if (!keyDisabled) {
              if (key && !passphraseDisabled) {
                passphraseDisabled = true;
                entityDialog.setDisabled('passphrase', true, true);
              }
            }
          });
        },
        saveButtonText: T('Unlock'),
        customSubmit: (entityDialog: EntityDialogComponent) => {
          let done = false;
          const value = entityDialog.formValue;
          const params: PoolUnlockQuery = [
            row1.id as any,
            { passphrase: value.passphrase, services_restart: value.services_restart },
          ];
          const dialogRef = this.mdDialog.open(EntityJobComponent, {
            data: { title: T('Unlocking Pool') },
            disableClose: true,
          });
          if (value.key) {
            params[1]['recoverykey'] = true;
            const formData: FormData = new FormData();
            formData.append('data', JSON.stringify({
              method: 'pool.unlock',
              params,
            }));
            formData.append('file', this.subs.file);
            dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
          } else {
            dialogRef.componentInstance.setCall('pool.unlock', params);
            dialogRef.componentInstance.submit();
          }
          dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
            if (!done) {
              dialogRef.close(false);
              entityDialog.dialogRef.close(true);
              this.parentVolumesListComponent.repaintMe();
              const unlockTr = this.translate.instant(' has been unlocked.');
              this.dialogService.info(T('Unlock'), row1.name + unlockTr, '300px', 'info', true);
              done = true;
            }
          });
          dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
            dialogRef.close(false);
            new EntityUtils().handleWSError(this, res, this.dialogService);
          });
        },
      } as DialogFormConfiguration)),
      switchMap((conf) => this.dialogService.dialogForm(conf)),
    ).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {});
  }

  getPoolData(poolId: number): Observable<Pool[]> {
    return this.ws.call('pool.query', [[['id', '=', poolId]]]);
  }

  getActions(rowData: VolumesListPool | VolumesListDataset): EntityTableAction[] {
    (rowData as any).is_passphrase = (!!('key_format' in rowData && rowData.key_format.parsed === 'passphrase'));
    let rowDataPathSplit: string[] = [];
    if ('mountpoint' in rowData && rowData.mountpoint) {
      rowDataPathSplit = rowData.mountpoint.split('/');
    }
    let p1 = '';
    const actions = [];
    // workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {
      if (rowData.status !== PoolStatus.Offline) {
        actions.push({
          id: rowData.name,
          name: T('Pool Options'),
          label: T('Pool Options'),
          onClick: (row: VolumesListPool) => {
            this.dialogConf = {
              title: this.translate.instant('Edit Pool Options for {name}', { name: row.name }),
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
              customSubmit: (entityDialog: EntityDialogComponent) => {
                const formValue = entityDialog.formValue;
                const method = 'pool.update';
                const payload = [
                  row.id,
                  { autotrim: formValue.autotrim ? 'ON' : 'OFF' },
                ];
                const dialogRef = this.mdDialog.open(EntityJobComponent, {
                  data: { title: helptext.pool_options_dialog.save_pool_options },
                  disableClose: true,
                });
                dialogRef.componentInstance.setDescription(helptext.pool_options_dialog.saving_pool_options);
                dialogRef.componentInstance.setCall(method, payload);
                dialogRef.componentInstance.submit();
                dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((res: Job<Pool>) => {
                  if (res) {
                    dialogRef.close();
                    entityDialog.dialogRef.close();
                    this.dialogService.info(
                      helptext.pool_options_dialog.dialog_saved_title,
                      this.translate.instant('Pool options for {poolName} successfully saved.', { poolName: row.name }),
                      '500px', 'info',
                    );
                    this.parentVolumesListComponent.repaintMe();
                  }
                });
                dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((err) => {
                  if (err) {
                    dialogRef.close();
                    new EntityUtils().handleWSError(entityDialog, err, this.dialogService);
                  }
                });
              },
            };
            this.dialogService.dialogForm(this.dialogConf).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
            });
          },
        });
      }
      actions.push({
        id: rowData.name,
        name: 'Export/Disconnect',
        label: helptext.exportAction,
        color: 'warn',
        onClick: (row1: VolumesListPool) => {
          const doDetach = async (): Promise<void> => {
            const sysPool = await this.ws.call('systemdataset.config').pipe(map((res) => res['pool'])).toPromise();
            const title = this.translate.instant(helptext.exportDialog.title);
            const warningA = this.translate.instant(helptext.exportDialog.warningA);
            const warningB = this.translate.instant(helptext.exportDialog.warningB);
            const unknownA = this.translate.instant(helptext.exportDialog.unknownStateA);
            const unknownB = this.translate.instant(helptext.exportDialog.unknownStateB);
            const sysPoolWarning = this.translate.instant(helptext.exportDialog.warningSysDataset);
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
                paraText: warningA + row1.name + warningB,
                isHidden: rowData.status === PoolStatus.Unknown,
              }, {
                type: 'paragraph',
                name: 'unknown_status_detach_warning',
                paraText: `${unknownA} ${row1.name} ${unknownB}`,
                isHidden: rowData.status !== PoolStatus.Unknown,
              }, {
                type: 'paragraph',
                name: 'pool_processes',
                paraText: p1,
                isHidden: p1 === '',
              }, {
                type: 'checkbox',
                name: 'destroy',
                value: false,
                placeholder: helptext.exportDialog.destroy,
                isHidden: rowData.status === PoolStatus.Unknown,
              }, {
                type: 'checkbox',
                name: 'cascade',
                value: rowData.status !== PoolStatus.Unknown,
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
                placeholder: rowData.status === PoolStatus.Unknown
                  ? `${helptext.exportDialog.confirm} ${helptext.exportDialog.unknown_status_alt_text}`
                  : `${helptext.exportDialog.confirm}`,
                required: true,
              }],
              saveButtonText: helptext.exportDialog.saveButton,
              customSubmit: (entityDialog: EntityDialogComponent) => {
                const value = entityDialog.formValue;
                const dialogRef = this.mdDialog.open(EntityJobComponent, {
                  data: { title: helptext.exporting },
                  disableClose: true,
                });
                dialogRef.updateSize('300px');
                dialogRef.componentInstance.setDescription(helptext.exporting);
                dialogRef.componentInstance.setCall('pool.export', [row1.id, {
                  destroy: value.destroy,
                  cascade: value.cascade,
                  restart_services: this.restartServices,
                }]);
                dialogRef.componentInstance.submit();
                dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
                  entityDialog.dialogRef.close(true);
                  const msg = this.translate.instant(helptext.exportSuccess);
                  const destroyed = this.translate.instant(helptext.destroyed);
                  if (!value.destroy) {
                    this.dialogService.info(helptext.exportDisconnect, msg + row1.name + "'", '500px', 'info');
                  } else {
                    this.dialogService.info(helptext.exportDisconnect, msg + row1.name + destroyed, '500px', 'info');
                  }
                  dialogRef.close(true);
                  this.parentVolumesListComponent.repaintMe();
                });
                dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                  let conditionalErrMessage = '';
                  if (res.error) {
                    if (res.exc_info.extra && res.exc_info.extra['code'] === 'control_services') {
                      entityDialog.dialogRef.close(true);
                      dialogRef.close(true);
                      const stopMsg = this.translate.instant(helptext.exportMessages.onfail.stopServices);
                      const restartMsg = this.translate.instant(helptext.exportMessages.onfail.restartServices);
                      const continueMsg = this.translate.instant(helptext.exportMessages.onfail.continueMessage);
                      if ((res.exc_info.extra.stop_services as string[]).length > 0) {
                        conditionalErrMessage += '<div class="warning-box">' + stopMsg;
                        (res.exc_info.extra.stop_services as string[]).forEach((item) => {
                          conditionalErrMessage += `<br>- ${item}`;
                        });
                      }
                      if ((res.exc_info.extra.restart_services as string[]).length > 0) {
                        if ((res.exc_info.extra.stop_services as string[]).length > 0) {
                          conditionalErrMessage += '<br><br>';
                        }
                        conditionalErrMessage += '<div class="warning-box">' + restartMsg;
                        (res.exc_info.extra.restart_services as string[]).forEach((item) => {
                          conditionalErrMessage += `<br>- ${item}`;
                        });
                      }
                      conditionalErrMessage += '<br><br>' + continueMsg + '</div><br />';
                      this.dialogService.confirm({
                        title: helptext.exportError,
                        message: conditionalErrMessage,
                        hideCheckBox: true,
                        buttonMsg: helptext.exportMessages.onfail.continueAction,
                      }).pipe(
                        filter(Boolean),
                        untilDestroyed(this, 'destroy'),
                      ).subscribe(() => {
                        this.restartServices = true;
                        entityDialog.conf.customSubmit(entityDialog);
                      });
                    } else if ((res as any).extra && (res as any).extra['code'] === 'unstoppable_processes') {
                      entityDialog.dialogRef.close(true);
                      const msg = this.translate.instant(helptext.exportMessages.onfail.unableToTerminate);
                      conditionalErrMessage = msg + (res as any).extra['processes'];
                      dialogRef.close(true);
                      this.dialogService.errorReport(helptext.exportError, conditionalErrMessage, res.exception);
                    } else {
                      entityDialog.dialogRef.close(true);
                      dialogRef.close(true);
                      this.dialogService.errorReport(helptext.exportError, res.error, res.exception);
                    }
                  } else {
                    entityDialog.dialogRef.close(true);
                    dialogRef.close(true);
                    this.dialogService.errorReport(helptext.exportError, res.error, res.exception);
                  }
                });
              },
            };
            this.dialogService.dialogFormWide(conf);
          };

          if (rowData.status !== PoolStatus.Unknown) {
            this.loader.open();
            this.ws.call('pool.attachments', [row1.id]).pipe(untilDestroyed(this, 'destroy')).subscribe((attachments) => {
              if (attachments.length > 0) {
                p1 = this.translate.instant(helptext.exportMessages.services, { name: row1.name });
                attachments.forEach((item) => {
                  p1 += `<br><b>${item.type}:</b>`;
                  item.attachments.forEach((i) => {
                    const tempArr = i.split(',');
                    tempArr.forEach((i) => {
                      p1 += `<br> - ${i}`;
                    });
                  });
                });
                p1 += '<br /><br />';
              }
              this.ws.call('pool.processes', [row1.id]).pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                const running_processes: PoolProcess[] = [];
                const running_unknown_processes: PoolProcess[] = [];
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
                    const runningMsg = this.translate.instant(helptext.exportMessages.running);
                    p1 += runningMsg + `<b>${row1.name}</b>:`;
                    running_processes.forEach((process) => {
                      if (process.name) {
                        p1 += `<br> - ${process.name}`;
                      }
                    });
                  }
                  if (running_unknown_processes.length > 0) {
                    p1 += '<br><br>' + this.translate.instant(helptext.exportMessages.unknown);
                    running_unknown_processes.forEach((process) => {
                      if (process.pid) {
                        p1 += `<br> - ${process.pid} - ${process.cmdline.substring(0, 40)}`;
                      }
                    });
                    p1 += '<br><br>' + this.translate.instant(helptext.exportMessages.terminated);
                  }
                }
                this.loader.close();
                doDetach();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              });
            },
            (err) => {
              this.loader.close();
              this.dialogService.errorReport(helptext.exportError, err.reason, err.trace.formatted);
            });
          } else {
            doDetach();
          }
        },
      });

      if (rowData.status !== PoolStatus.Offline) {
        actions.push({
          id: rowData.name,
          name: 'Add Vdevs',
          label: T('Add Vdevs'),
          onClick: (row1: VolumesListPool) => {
            this.router.navigate(['/', 'storage', 'manager', row1.id]);
          },
        });
        actions.push({
          id: rowData.name,
          name: 'Scrub Pool',
          label: T('Scrub Pool'),
          onClick: (row1: VolumesListPool) => {
            this.getPoolData(row1.id).pipe(untilDestroyed(this, 'destroy')).subscribe((pools) => {
              if (!pools[0]) {
                return;
              }

              if (pools[0].scan.function === PoolScanFunction.Scrub && pools[0].scan.state === PoolScanState.Scanning) {
                const message = this.translate.instant('Stop the scrub on {poolName}?', { poolName: row1.name });
                this.dialogService.confirm({
                  message,
                  title: this.translate.instant('Scrub Pool'),
                  buttonMsg: this.translate.instant('Stop Scrub'),
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this, 'destroy'),
                ).subscribe(() => {
                  this.loader.open();
                  this.ws.call('pool.scrub', [row1.id, PoolScrubAction.Stop]).pipe(untilDestroyed(this, 'destroy')).subscribe(
                    () => {
                      this.loader.close();
                      const msg = this.translate.instant('Stopping scrub on pool');
                      this.dialogService.info(T('Stop Scrub'), `${msg} <i>${row1.name}</i>`, '300px', 'info', true);
                    },
                    (err) => {
                      this.loader.close();
                      new EntityUtils().handleWSError(this, err, this.dialogService);
                    },
                  );
                });
              } else {
                const message = this.translate.instant('Start scrub on pool <i>{poolName}</i>?', { poolName: row1.name });
                this.dialogService.confirm({
                  message,
                  title: this.translate.instant('Scrub Pool'),
                  buttonMsg: this.translate.instant('Start Scrub'),
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this, 'destroy'),
                ).subscribe(() => {
                  this.dialogRef = this.mdDialog.open(EntityJobComponent, {
                    data: { title: T('Scrub Pool') },
                  });
                  this.dialogRef.componentInstance.setCall('pool.scrub', [row1.id, PoolScrubAction.Start]);
                  this.dialogRef.componentInstance.submit();
                  this.dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((jobres) => {
                    this.dialogRef.close(false);
                    if (jobres.progress.percent == 100 && jobres.progress.description === 'Scrub finished') {
                      this.dialogService.info(
                        this.translate.instant('Scrub Complete'),
                        this.translate.instant('Scrub complete on pool <i>{poolName}</i>.', { poolName: row1.name }),
                        '300px',
                        'info',
                        true,
                      );
                    } else {
                      this.dialogService.info(
                        this.translate.instant('Scrub Stopped'),
                        this.translate.instant('Stopped the scrub on pool <i>{poolName}</i>.', { poolName: row1.name }),
                        '300px',
                        'info',
                        true,
                      );
                    }
                  });
                  this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((err) => {
                    this.dialogRef.componentInstance.setDescription(err.error);
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
          onClick: (row1: VolumesListPool) => {
            this.router.navigate(['/', 'storage', 'status', row1.id]);
          },
        });
        actions.push({
          id: rowData.name,
          name: T('Expand Pool'),
          label: T('Expand Pool'),
          onClick: (row1: VolumesListPool) => {
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

            const doExpand = (entityDialog?: EntityDialogComponent): void => {
              this.loader.open();
              const payload: PoolExpandParams = [row1.id];
              if (entityDialog) {
                payload.push({ geli: { passphrase: entityDialog.formValue['passphrase'] } });
              }
              this.ws.job('pool.expand', payload).pipe(untilDestroyed(this, 'destroy')).subscribe(
                (res) => {
                  this.loader.close();
                  if (res.error) {
                    if (res.exc_info && res.exc_info.extra) {
                      (res as any).extra = res.exc_info.extra;
                    }
                    new EntityUtils().handleWSError(this, res, this.dialogService, conf.fieldConfig);
                  }
                  if (res.state === JobState.Success) {
                    if (entityDialog) {
                      entityDialog.dialogRef.close(true);
                    }
                    this.dialogService.generalDialog({
                      title: helptext.expand_pool_success_dialog.title,
                      icon: 'info',
                      is_html: true,
                      message: this.translate.instant('Successfully expanded pool <i>{poolName}</i>', { poolName: row1.name }),
                      hideCancel: true,
                    });
                  }
                },
                (err) => {
                  this.loader.close();
                  new EntityUtils().handleWSError(this, err, this.dialogService);
                },
              );
            };

            this.dialogService.generalDialog({
              title: this.translate.instant(helptext.expand_pool_dialog.title) + row1.name,
              message: helptext.expand_pool_dialog.message,
              confirmBtnMsg: helptext.expand_pool_dialog.save_button,
            }).pipe(
              filter(Boolean),
              untilDestroyed(this, 'destroy'),
            ).subscribe(() => doExpand());
          },
        });

        if (!rowData.is_upgraded) {
          actions.push({
            id: rowData.name,
            name: T('Upgrade Pool'),
            label: T('Upgrade Pool'),
            onClick: (row1: VolumesListPool) => {
              this.dialogService.confirm({
                title: this.translate.instant('Upgrade Pool'),
                message: this.translate.instant(helptext.upgradePoolDialog_warning) + row1.name,
              }).pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              ).subscribe(() => {
                this.loader.open();
                this.ws.call('pool.upgrade', [rowData.id]).pipe(untilDestroyed(this, 'destroy')).subscribe(
                  () => {
                    this.dialogService.info(
                      this.translate.instant('Upgraded'),
                      this.translate.instant('Successfully Upgraded {poolName}.', { poolName: row1.name }),
                      '500px',
                      'info',
                    ).pipe(untilDestroyed(this)).subscribe(() => {
                      this.parentVolumesListComponent.repaintMe();
                    });
                  },
                  (res) => {
                    this.dialogService.errorReport(
                      this.translate.instant('Error Upgrading Pool {poolName}', { poolName: row1.name }),
                      res.message,
                      res.stack,
                    );
                  },
                  () => this.loader.close(),
                );
              });
            },
          });
        }
      }
    }

    if (rowData.type === DatasetType.Filesystem) {
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
          name: T('View Permissions'),
          label: T('View Permissions'),
          ttposition: 'left',
          onClick: (row: VolumesListDataset) => {
            this.parentVolumesListComponent.viewingPermissionsForDataset = row;
          },
        },
        {
          id: rowData.name,
          name: T('User Quotas'),
          label: T('User Quotas'),
          onClick: () => {
            this.router.navigate(['/', 'storage', 'user-quotas', rowData.id]);
          },
        },
        {
          id: rowData.name,
          name: T('Group Quotas'),
          label: T('Group Quotas'),
          onClick: () => {
            this.router.navigate(['/', 'storage', 'group-quotas', rowData.id]);
          },
        });
      }

      if (rowData.id.indexOf('/') !== -1) {
        actions.push({
          id: rowData.name,
          name: T('Delete Dataset'),
          label: T('Delete Dataset'),
          onClick: (row1: VolumesListDataset) => {
            const datasetName = row1.name;

            this.loader.open();
            combineLatest([
              this.ws.call('pool.dataset.attachments', [row1.id]),
              this.ws.call('pool.dataset.processes', [row1.id]),
            ]).pipe(untilDestroyed(this, 'destroy')).subscribe(
              ([attachments, processes]) => {
                if (attachments.length > 0) {
                  p1 = this.translate.instant(helptext.datasetDeleteMsg, { name: datasetName });
                  attachments.forEach((item) => {
                    p1 += `<br><b>${item.type}:</b>`;
                    item.attachments.forEach((i) => {
                      const tempArr = i.split(',');
                      tempArr.forEach((i) => {
                        p1 += `<br> - ${i}`;
                      });
                    });
                  });
                  p1 += '<br /><br />';
                }

                const running_processes: PoolProcess[] = [];
                const running_unknown_processes: PoolProcess[] = [];
                if (processes.length > 0) {
                  processes.forEach((item) => {
                    if (!item.service) {
                      if (item.name && item.name !== '') {
                        running_processes.push(item);
                      } else {
                        running_unknown_processes.push(item);
                      }
                    }
                  });
                  if (running_processes.length > 0) {
                    const runningMsg = this.translate.instant(helptext.exportMessages.running);
                    p1 += runningMsg + `<b>${datasetName}</b>:`;
                    running_processes.forEach((process) => {
                      if (process.name) {
                        p1 += `<br> - ${process.name}`;
                      }
                    });
                  }
                  if (running_unknown_processes.length > 0) {
                    p1 += '<br><br>' + this.translate.instant(helptext.exportMessages.unknown);
                    running_unknown_processes.forEach((process) => {
                      if (process.pid) {
                        p1 += `<br> - ${process.pid} - ${process.cmdline.substring(0, 40)}`;
                      }
                    });
                    p1 += '<br><br>' + this.translate.instant(helptext.exportMessages.terminated);
                  }
                }

                doDelete();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              },
            );

            const doDelete = (): void => {
              this.loader.close();
              this.dialogService.doubleConfirm(
                this.translate.instant('Delete Dataset <i><b>{datasetName}</b></i>', { datasetName }),
                this.translate.instant(
                  'The <i><b>{datasetName}</b></i> dataset and all snapshots stored with it <b>will be permanently deleted</b>.',
                  { datasetName },
                ) + '<br><br>' + p1,
                datasetName,
                true,
                this.translate.instant('DELETE DATASET'),
              ).pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              ).subscribe(() => {
                this.loader.open();
                this.ws.call('pool.dataset.delete', [rowData.id, { recursive: true }]).pipe(untilDestroyed(this, 'destroy')).subscribe(
                  () => {
                    this.loader.close();
                    this.parentVolumesListComponent.repaintMe();
                  },
                  (e_res) => {
                    this.loader.close();
                    if (e_res.reason.indexOf('Device busy') > -1) {
                      this.dialogService.confirm({
                        title: this.translate.instant('Device Busy'),
                        message: this.translate.instant('Force deletion of dataset <i>{datasetName}</i>?', { datasetName }),
                        buttonMsg: this.translate.instant('Force Delete'),
                      }).pipe(
                        filter(Boolean),
                        untilDestroyed(this, 'destroy'),
                      ).subscribe(() => {
                        this.loader.open();
                        this.ws.call('pool.dataset.delete', [rowData.id, {
                          recursive: true,
                          force: true,
                        }]).pipe(untilDestroyed(this, 'destroy')).subscribe(
                          () => {
                            this.loader.close();
                            this.parentVolumesListComponent.repaintMe();
                          },
                          (err) => {
                            this.loader.close();
                            this.dialogService.errorReport(
                              this.translate.instant(
                                'Error deleting dataset {datasetName}.', { datasetName },
                              ),
                              err.reason,
                              err.stack,
                            );
                          },
                        );
                      });
                    } else {
                      this.dialogService.errorReport(
                        this.translate.instant(
                          'Error deleting dataset {datasetName}.', { datasetName },
                        ),
                        e_res.reason,
                        e_res.stack,
                      );
                    }
                  },
                );
              });
            };
          },
        });
      }
    }
    if (rowData.type === DatasetType.Volume) {
      actions.push({
        id: rowData.name,
        name: T('Delete Zvol'),
        label: T('Delete Zvol'),
        onClick: (row1: VolumesListDataset) => {
          const zvolName = row1.name;
          this.dialogService.doubleConfirm(
            this.translate.instant('Delete'),
            this.translate.instant('Delete the zvol {zvolName} and all snapshots of it?', { zvolName }),
            zvolName,
            true,
            this.translate.instant('Delete Zvol'),
          ).pipe(
            filter(Boolean),
            untilDestroyed(this, 'destroy'),
          ).subscribe(() => {
            this.loader.open();

            this.ws.call('pool.dataset.delete', [rowData.id, { recursive: true }]).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
              this.loader.close();
              this.parentVolumesListComponent.repaintMe();
            }, (res) => {
              this.loader.close();
              this.dialogService.errorReport(
                this.translate.instant(
                  'Error deleting zvol {zvolName}.', { zvolName },
                ),
                res.reason,
                res.stack,
              );
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
    if (rowData.type === DatasetType.Volume || rowData.type === DatasetType.Filesystem) {
      actions.push({
        id: rowData.name,
        name: T('Create Snapshot'),
        label: T('Create Snapshot'),
        onClick: (row: VolumesListDataset) => {
          this.ws.call('vmware.dataset_has_vms', [row.id, false]).pipe(untilDestroyed(this, 'destroy')).subscribe((vmware_res) => {
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
                updater: (parent: VolumesListTableConfig) => {
                  parent.recursiveIsChecked = !parent.recursiveIsChecked;
                  parent.ws.call('vmware.dataset_has_vms', [row.id, parent.recursiveIsChecked]).pipe(untilDestroyed(parent, 'destroy')).subscribe((vmware_res) => {
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
          this.dialogService.dialogForm(this.dialogConf).pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
            if (res) {
              this.dialogService.info(T('Create Snapshot'), T('Snapshot successfully taken.'), '500px', 'info');
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
          onClick: (row1: VolumesListDataset) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.id]).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService.info(T('Promote Dataset'), T('Successfully Promoted ') + row1.id, '500px', 'info').pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              const msg = this.translate.instant('Error Promoting dataset ');
              this.dialogService.errorReport(msg + row1.id, res.reason, res.stack);
            });
          },
        });
      }
    }
    return actions as EntityTableAction[];
  }

  getEncryptedDatasetActions(rowData: VolumesListDataset): EntityTableAction[] {
    const encryption_actions = [];
    if (rowData.encrypted) {
      if (rowData.locked) {
        if (rowData.is_encrypted_root
          && (!rowData.parent || (rowData.parent && !(rowData.parent as VolumesListDataset).locked))) {
          encryption_actions.push({
            id: rowData.name,
            name: T('Unlock'),
            label: T('Unlock'),
            onClick: () => {
              // unlock
              this.router.navigate([
                '/', 'storage', 'id', rowData.pool, 'dataset',
                'unlock', rowData.id,
              ]);
            },
          });
        }
      } else {
        encryption_actions.push({
          id: rowData.name,
          name: T('Encryption Options'),
          label: T('Encryption Options'),
          onClick: (row: VolumesListDataset) => {
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
            const can_inherit = (row.parent && (row.parent as VolumesListDataset).encrypted);
            const passphrase_parent = row.parent
              && (row.parent as VolumesListDataset).key_format
              && (row.parent as VolumesListDataset).key_format.value === DatasetEncryptionType.Passphrase;
            const is_key = (passphrase_parent ? false : (key_child ? true : !row.is_passphrase));
            let pbkdf2iters = '350000'; // will pull from row when it has been added to the payload
            if (row.pbkdf2iters && row.pbkdf2iters && row.pbkdf2iters.rawvalue !== '0') {
              pbkdf2iters = row.pbkdf2iters.rawvalue;
            }
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
              afterInit: (entityDialog: EntityDialogComponent) => {
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
                inherit_encryption_fg.valueChanges.pipe(untilDestroyed(this, 'destroy')).subscribe((inherit) => {
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

                encryption_type_fg.valueChanges.pipe(untilDestroyed(this, 'destroy')).subscribe((enc_type) => {
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

                generate_key_fg.valueChanges.pipe(untilDestroyed(this, 'destroy')).subscribe((gen_key) => {
                  if (!inherit_encryption_fg.value && encryption_type_fg.value === 'key') {
                    entityDialog.setDisabled('key', gen_key, gen_key);
                  }
                });
              },
              customSubmit: (entityDialog: EntityDialogComponent) => {
                const formValue = entityDialog.formValue;
                let method: ApiMethod = 'pool.dataset.change_key';
                if (formValue.inherit_encryption) {
                  if (row.is_encrypted_root) { // only try to change to inherit if not currently inheriting
                    method = 'pool.dataset.inherit_parent_encryption_properties';
                    entityDialog.loader.open();
                    entityDialog.ws.call(method, [row.id]).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
                      entityDialog.loader.close();
                      this.dialogService.info(
                        helptext.encryption_options_dialog.dialog_saved_title,
                        this.translate.instant('Encryption options for {id} successfully saved.', { id: row.id }),
                        '500px',
                        'info',
                      );
                      entityDialog.dialogRef.close();
                      this.parentVolumesListComponent.repaintMe();
                    }, (err: WebsocketError) => {
                      entityDialog.loader.close();
                      new EntityUtils().handleWSError(entityDialog, err, this.dialogService);
                    });
                  } else { // just close the dialog if the inherit checkbox is checked but we are already inheriting
                    entityDialog.dialogRef.close();
                  }
                } else {
                  const body = {} as DatasetChangeKeyParams;
                  if (formValue.encryption_type === 'key') {
                    body['generate_key'] = formValue.generate_key;
                    if (!formValue.generate_key) {
                      body['key'] = formValue.key;
                    }
                  } else {
                    body['passphrase'] = formValue.passphrase;
                    body['pbkdf2iters'] = formValue.pbkdf2iters;
                  }
                  const dialogRef = this.mdDialog.open(EntityJobComponent, {
                    data: { title: helptext.encryption_options_dialog.save_encryption_options },
                    disableClose: true,
                  });
                  dialogRef.componentInstance.setDescription(
                    helptext.encryption_options_dialog.saving_encryption_options,
                  );
                  dialogRef.componentInstance.setCall(method, [row.id as any, body]);
                  dialogRef.componentInstance.submit();
                  dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((res: any) => {
                    if (res) {
                      dialogRef.close();
                      entityDialog.dialogRef.close();
                      this.dialogService.info(
                        helptext.encryption_options_dialog.dialog_saved_title,
                        this.translate.instant('Encryption options for {id} successfully saved.', { id: row.id }),
                        '500px',
                        'info',
                      );
                      this.parentVolumesListComponent.repaintMe();
                    }
                  });
                  dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((err) => {
                    if (err) {
                      dialogRef.close();
                      new EntityUtils().handleWSError(entityDialog, err, this.dialogService);
                    }
                  });
                }
              },
            };
            this.dialogService.dialogForm(this.dialogConf).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
            });
          },
        });
        if (rowData.is_encrypted_root && rowData.is_passphrase) {
          encryption_actions.push({
            id: rowData.name,
            name: T('Lock'),
            label: T('Lock'),
            onClick: (row: VolumesListDataset) => {
              const datasetName = row.name;
              const params: DatasetLockParams = [row.id];
              let force_umount = false;
              const ds = this.dialogService.confirm({
                title: this.translate.instant('Lock Dataset {datasetName}', { datasetName }),
                message: this.translate.instant('Lock Dataset {datasetName}?', { datasetName }),
                buttonMsg: this.translate.instant('Lock'),
                secondaryCheckBox: true,
                secondaryCheckBoxMsg: this.translate.instant('Force unmount'),
                method: 'pool.dataset.lock',
                data: params,
              });
              ds.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this, 'destroy')).subscribe((res: boolean) => {
                force_umount = res;
              });
              ds.afterClosed().pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              ).subscribe(() => {
                const dialogRef = this.mdDialog.open(EntityJobComponent, {
                  data: { title: helptext.lock_dataset_dialog.locking_dataset },
                  disableClose: true,
                });
                dialogRef.componentInstance.setDescription(
                  this.translate.instant('Locking dataset {datasetName}', { datasetName: rowData.name }),
                );
                params.push({ force_umount });
                dialogRef.componentInstance.setCall(ds.componentInstance.method, params);
                dialogRef.componentInstance.submit();
                let done = false;
                dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
                  if (!done) {
                    dialogRef.close(false);
                    done = true;
                    this.parentVolumesListComponent.repaintMe();
                  }
                });

                dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                  dialogRef.close(false);
                  new EntityUtils().handleWSError(this, res, this.dialogService);
                });
              });
            },
          });
        }
        if (
          rowData.encrypted
          && rowData.key_loaded
          && rowData.encryption_root === rowData.id
          && !rowData.is_passphrase
        ) {
          const fileName = 'dataset_' + rowData.name + '_key.txt';
          const mimetype = 'text/plain';
          const message = helptext.export_keys_message + rowData.id;
          encryption_actions.push({
            id: rowData.id,
            name: T('Export Key'),
            label: T('Export Key'),
            onClick: () => {
              this.dialogService.passwordConfirm(message).pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              ).subscribe(() => {
                const dialogRef = this.mdDialog.open(EntityJobComponent, {
                  data: { title: T('Retrieving Key') },
                  disableClose: true,
                });
                dialogRef.componentInstance.setCall('pool.dataset.export_key', [rowData.id]);
                dialogRef.componentInstance.submit();
                dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((res: Job<string>) => {
                  dialogRef.close();
                  this.dialogService.confirm({
                    title: this.translate.instant('Key for {id}', { id: rowData.id }),
                    message: res.result,
                    hideCheckBox: true,
                    buttonMsg: this.translate.instant('Download Key'),
                    cancelMsg: this.translate.instant('Close'),
                  }).pipe(
                    filter(Boolean),
                    untilDestroyed(this, 'destroy'),
                  ).subscribe(() => {
                    this.loader.open();
                    this.ws.call('core.download', ['pool.dataset.export_key', [rowData.id, true], fileName]).pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                      this.loader.close();
                      const url = res[1];
                      this.storageService.streamDownloadFile(this.http, url, fileName, mimetype)
                        .pipe(untilDestroyed(this, 'destroy'))
                        .subscribe((file) => {
                          if (res !== null) {
                            this.storageService.downloadBlob(file, fileName);
                          }
                        });
                    }, (e) => {
                      this.loader.close();
                      new EntityUtils().handleWSError(this, e, this.dialogService);
                    });
                  });
                });
              });
            },
          });
        }
      }
    }
    return encryption_actions as EntityTableAction[];
  }

  getTimestamp(): string {
    const dateTime = new Date();
    return format(dateTime, 'yyyy-MM-dd_HH-mm');
  }

  dataHandler(tempData: any): TreeNode {
    const data: VolumesListDataset = tempData;
    const node: TreeNode = {};
    node.data = data;
    this.getMoreDatasetInfo(data, data.parent);
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

  getMoreDatasetInfo(dataObj: VolumesListDataset, parent: VolumesListDataset | VolumesListPool): void {
    const inherits = this.translate.instant(T('Inherits'));
    this.datasetData.forEach((dataset) => {
      if (dataset.id === dataObj.id) {
        if (dataset.compression) {
          if (dataset.compression.source !== 'INHERITED') {
            dataObj.compression = (dataset.compression.parsed);
          } else {
            dataObj.compression = (inherits + ' (' + dataset.compression.parsed + ')');
          }
        }
        if (dataset.compressratio) {
          if (dataset.compressratio.source !== 'INHERITED') {
            dataObj.compressratio = (dataset.compressratio.parsed);
          } else {
            dataObj.compressratio = (inherits + ' (' + dataset.compressratio.parsed + ')');
          }
        }
        if (dataset.readonly) {
          if (dataset.readonly.source !== 'INHERITED') {
            dataObj.readonly = (dataset.readonly.parsed) as any;
          } else {
            dataObj.readonly = (inherits + ' (' + dataset.readonly.parsed + ')');
          }
        }
        if (dataset.deduplication) {
          if (dataset.deduplication.source !== 'INHERITED') {
            dataObj.dedup = (dataset.deduplication.parsed);
          } else {
            dataObj.dedup = (inherits + ' (' + dataset.deduplication.parsed + ')');
          }
        }
        if (dataset.comments) {
          if (dataset.comments.source !== 'INHERITED') {
            dataObj.comments = (dataset.comments.parsed);
          } else {
            dataObj.comments = ('');
          }
        }
      }
      // add name, available and used into the data object
      dataObj.name = dataObj.name.split('/').pop();
      dataObj.available_parsed = this.storageService.convertBytestoHumanReadable(dataObj.available.parsed || 0);
      dataObj.used_parsed = this.storageService.convertBytestoHumanReadable(dataObj.used.parsed || 0);
      dataObj.is_encrypted_root = (dataObj.id === dataObj.encryption_root);
      if (dataObj.is_encrypted_root) {
        this.parentVolumesListComponent.has_encrypted_root[(parent as VolumesListDataset).pool] = true;
      }
      dataObj.non_encrypted_on_encrypted = (!dataObj.encrypted && (parent as VolumesListDataset).encrypted);
    });
  }
}
