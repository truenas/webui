import { Component, ElementRef, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { CoreService } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { EntityTableComponent, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErdService } from 'app/services/erd.service';
import { WebSocketService } from 'app/services/ws.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TreeNode } from 'primeng/api';
import { map, switchMap } from 'rxjs/operators';
import helptext from '../../../../helptext/storage/volumes/volume-list';
import dataset_helptext from '../../../../helptext/storage/volumes/datasets/dataset-form';
import { JobService, RestService } from '../../../../services/';
import { StorageService } from '../../../../services/storage.service';
import { T } from '../../../../translate-marker';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { MessageService } from '../../../common/entity/entity-form/services/message.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../../common/entity/utils';
import { combineLatest } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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

export class VolumesListTableConfig implements InputTableConf {
  public hideTopActions = true;
  public flattenedVolData: any;
  public tableData: TreeNode[] = [];
  public columns: Array < any > = [
    { name: 'Name', prop: 'name', always_display: true  },
    { name: 'Type', prop: 'type', },
    { name: 'Used', prop: 'used_parsed', filesizePipe: false},
    { name: 'Available', prop: 'available_parsed', filesizePipe: false},
    { name: 'Compression', prop: 'compression', hidden: true },
    { name: 'Compression Ratio', prop: 'compressratio', hidden: true },
    { name: 'Readonly', prop: 'readonly', },
    { name: 'Dedup', prop: 'deduplication', hidden: true },
    { name: 'Comments', prop: 'comments', hidden: true }
  ];

  public config: any = {
    deleteMsg: {
      key_props: ['name']
    },
  };

  protected dialogRef: any;
  public route_add = ["storage", "pools", "import"];
  public route_add_tooltip = T("Create or Import Pool");
  public showDefaults: boolean = false;
  public showSpinner:boolean;
  public encryptedStatus: any;
  public custActions: Array<any> = [];
  private vmware_res_status: boolean;
  public dialogConf: DialogFormConfiguration;
  public restartServices = false;
  public subs: any;
  public message_subscription: any;
  public productType = window.localStorage.getItem('product_type');

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private _router: Router,
    private _classId: string,
    private datasetData: Array<any>,
    public mdDialog: MatDialog,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService,
    protected storageService: StorageService,
    protected volumeData: Object,
    protected messageService: MessageService,
    protected http: HttpClient,
  ) {
    if (typeof (this._classId) !== "undefined" && this._classId !== "" && volumeData && volumeData['children']) {
      this.tableData = [];
      for (let i = 0; i < volumeData['children'].length; i++) {
        const child = volumeData['children'][i];
        child.parent = volumeData;
        this.tableData.push(this.dataHandler(child));
      }
    }
  }

  isCustActionVisible(actionname: string) {
    if (actionname === 'download_key' && this.encryptedStatus > 0) {
      return true;
    } else {
      return false;
    }
  }

  getEncryptedActions(rowData: any) {
    const actions = [], self = this;
    if (rowData.encrypt === 2) {
      if (rowData.is_decrypted) {
        if (self.parentVolumesListComponent.systemdatasetPool != rowData.name) {
          actions.push({
            label: T("Lock"),
            onClick: (row1) => {
              let p1 = '';
              const self = this;
              this.loader.open();
              this.ws.call('pool.attachments', [row1.id]).subscribe((res) => {
                if (res.length > 0) {
                  p1 = T('These services depend on pool ') + `<i>${row1.name}</i>` + T(' and will be disrupted if the pool is locked:');
                  res.forEach((item) => {
                    p1 += `<br><br>${item.type}:`;
                    item.attachments.forEach((i) => {
                      const tempArr = i.split(',');
                      tempArr.forEach((i) => {
                        p1 += `<br> - ${i}`
                      })
                    })

                  })
                }
                this.ws.call('pool.processes', [row1.id]).subscribe((res) => {
                  const running_processes = [];
                  const running_unknown_processes = [];
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
                      p1 += `<br><br>These running services are using <b>${row1.name}</b>:`;
                      running_processes.forEach((process) =>  {
                        if (process.name) {
                          p1 += `<br> - ${process.name}`
                        }

                      });
                    };
                    if (running_unknown_processes.length > 0) {
                      p1 += '<br><br>These unknown processes are using this pool:';
                      running_unknown_processes.forEach((process) => {
                        if (process.pid) {
                          p1 += `<br> - ${process.pid} - ${process.cmdline.substring(0,40)}`;
                        }
                      });
                      p1 += `<br><br>WARNING: These unknown processes will be terminated while locking the pool.`;
                    }
                  };
                  this.loader.close();
                  doLock();
                },
                (err) => {
                  this.loader.close();
                  new EntityUtils().handleWSError(T("Error gathering data on pool."), err, this.dialogService);
                });
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(T("Error gathering data on pool."), err, this.dialogService);
              });
              function doLock() {
                const conf: DialogFormConfiguration = {
                title: T("Enter passphrase to lock pool ") + row1.name + '.',
                fieldConfig: [
                  {
                    type: 'paragraph',
                    name: 'pool_lock_warning',
                    paraText: helptext.pool_lock_warning_paratext_a + row1.name +
                      helptext.pool_lock_warning_paratext_b,
                    isHidden: false
                  },
                  {
                    type: 'paragraph',
                    name: 'pool_processes',
                    paraText: p1,
                    isHidden: p1 === '' ? true : false
                  },
                  {
                    type: 'input',
                    inputType: 'password',
                    name: 'passphrase',
                    placeholder: 'passphrase',
                    togglePw: true,
                    required: true
                  }
                ],
                saveButtonText: T("Lock Pool"),
                customSubmit: function (entityDialog) {
                  const value = entityDialog.formValue;
                  self.loader.open();
                  self.ws.job('pool.lock', [row1.id, value.passphrase]).subscribe(
                    res => {
                    if (res.error) {
                      self.loader.close();
                      if (res.exc_info && res.exc_info.extra) {
                        res.extra = res.exc_info.extra;
                      }
                      new EntityUtils().handleWSError(this, res, self.dialogService);
                    }
                    if (res.state === 'SUCCESS') {
                      self.loader.close();
                      entityDialog.dialogRef.close(true);
                      self.parentVolumesListComponent.repaintMe();
                    }
                  }, e => {
                    self.loader.close();
                    new EntityUtils().handleWSError(this, e, self.dialogService);
                  });
                }
              }
              self.dialogService.dialogForm(conf);
            }
          }});
        }
      } else {
        actions.push({
          label: T("Unlock"),
          onClick: (row1) => {
            this.unlockAction(row1);
          }
        });
      }

      if (rowData.is_decrypted) {
        actions.push({
          label: T("Encryption Key/Passphrase"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "changekey", row1.id]));
          }
        });
      }

    } else if (rowData.encrypt === 1 && rowData.is_decrypted && self.parentVolumesListComponent.systemdatasetPool != rowData.name) {
      actions.push({
        label: T("Encryption Key"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "createkey", row1.id]));
        }
      });
    }

    if (rowData.encrypt !== 0 && rowData.is_decrypted) {

      actions.push({
        label: T("Manage Recovery Key"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "addkey", row1.id]));
        }
      });

      actions.push({
        label: T("Reset Keys"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "rekey", row1.id]));

        }
      });
    }

    if (this.parentVolumesListComponent.has_encrypted_root[rowData.name]) {
      actions.push({
        label: T("Export Dataset Keys"),
        onClick: (row1) => {
          const title = helptext.export_keys_title  + row1.name;
          const message = helptext.export_keys_message + row1.name;
          const fileName = "dataset_" + row1.name + "_keys.json";
          this.dialogService.confirm(title, message, false, helptext.export_keys_button).subscribe(export_keys => {
            if (export_keys) {
              this.loader.open();
              const mimetype = 'application/json';
              this.ws.call('core.download', ['pool.dataset.export_keys', [row1.name], fileName]).subscribe(res => {
                this.loader.close();
                const url = res[1];
                this.storageService.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
                  if(res !== null && res !== "") {
                    this.storageService.downloadBlob(file, fileName);
                  }
                });
              }, (e) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, e, this.dialogService);
              });
            }
          });
        }
      });
    }

    return actions;
  }

  key_file_updater(file: any, parent: any){
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = {"apiEndPoint":file.apiEndPoint, "file": fileBrowser.files[0]}
    }
  }

  unlockAction(row1) {
    const self = this;
    this.storageService.poolUnlockServiceChoices(row1.id).pipe(
      map(serviceChoices => {
        return {
          title: T("Unlock ") + row1.name,
          fieldConfig: [
            {
              type: 'paragraph',
              name: 'unlock_msg',
              paraText: helptext.unlock_msg,
            },
            {
              type : 'input',
              inputType: 'password',
              name : 'passphrase',
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
              value: serviceChoices.map(choice => choice.value),
              options: serviceChoices
            }
          ],
          afterInit: function(entityDialog) {
                self.message_subscription = self.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
                  entityDialog.formGroup.controls['key'].setValue(message);
                });
                // these disabled booleans are here to prevent recursion errors, disabling only needs to happen once
                let keyDisabled = false;
                let passphraseDisabled = false;
                entityDialog.formGroup.controls['passphrase'].valueChanges.subscribe((passphrase) => {
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
                entityDialog.formGroup.controls['key'].valueChanges.subscribe((key) => {
                  if (!keyDisabled) {
                    if (key && !passphraseDisabled) {
                      passphraseDisabled = true;
                      entityDialog.setDisabled('passphrase', true, true);
                    }
                  }
                });
          },
          saveButtonText: T("Unlock"),
          customSubmit: function (entityDialog) {
            let done = false;
            const value = entityDialog.formValue;
            const params = [row1.id, {passphrase: value.passphrase, services_restart: value.services_restart}]
            let dialogRef = self.mdDialog.open(EntityJobComponent, {data: {"title":"Unlocking Pool"}, disableClose: true});
            if(value.key) {
              params[1]['recoverykey'] = true;
              const formData: FormData = new FormData();
              formData.append('data', JSON.stringify({
                "method": "pool.unlock",
                "params": params
              }));
              formData.append('file', self.subs.file);
              dialogRef.componentInstance.wspost(self.subs.apiEndPoint, formData);
            } else {
              dialogRef.componentInstance.setCall('pool.unlock', params);
              dialogRef.componentInstance.submit();
            }
            dialogRef.componentInstance.success.subscribe((res) => {
              if (!done) {
                dialogRef.close(false);
                entityDialog.dialogRef.close(true);
                self.parentVolumesListComponent.repaintMe();
                self.dialogService.Info(T("Unlock"), row1.name + T(" has been unlocked."), '300px', "info", true);
                done = true;
              }
            });
            dialogRef.componentInstance.failure.subscribe((res) => {
              dialogRef.close(false);
              new EntityUtils().handleWSError(self, res ,self.dialogService);
            });
          }
        };
      }),
      switchMap(conf => this.dialogService.dialogForm(conf))
    ).subscribe(() => {})
  }

  getPoolData(poolId: number) {
    return this.ws.call('pool.query', [
      [
        ["id", "=", poolId]
      ]
    ]);
  }

  getActions(rowData: any) {
    rowData.is_passphrase = (rowData.key_format && rowData.key_format.parsed === 'passphrase' ? true : false);
    let rowDataPathSplit = [];
    const self = this;
    if (rowData.mountpoint) {
      rowDataPathSplit = rowData.mountpoint.split('/');
    }
    let p1 = '';
    const actions = [];
    //workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {
      actions.push({
        id: rowData.name,
        name: 'Export/Disconnect',
        label: T("Export/Disconnect"),
        onClick: (row1) => {
          let encryptedStatus = row1.encrypt,
          self = this;

          if (rowData.is_decrypted && rowData.status !== 'UNKNOWN') {
            this.loader.open();
            this.ws.call('pool.attachments', [row1.id]).subscribe((res) => {
              if (res.length > 0) {
                p1 = T('These services depend on pool ') + `<i>${row1.name}</i>` +
                  T(' and will be disrupted if the pool is detached:');
                res.forEach((item) => {
                  p1 += `<br><br>${item.type}:`;
                  item.attachments.forEach((i) => {
                    let tempArr = i.split(',');
                    tempArr.forEach((i) => {
                      p1 += `<br> - ${i}`
                    })
                  })

                })
              }
              this.ws.call('pool.processes', [row1.id]).subscribe((res) => {
                let running_processes = [];
                let running_unknown_processes = [];
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
                    p1 += `<br><br>` + T('These running services are using ') + `<b>${row1.name}</b>:`;
                    running_processes.forEach((process) =>  {
                      if (process.name) {
                        p1 += `<br> - ${process.name}`
                      }

                    });
                  };
                  if (running_unknown_processes.length > 0) {
                    p1 += `<br><br>` + T('These unknown processes are using this pool: ');
                    running_unknown_processes.forEach((process) => {
                      if (process.pid) {
                        p1 += `<br> - ${process.pid} - ${process.cmdline.substring(0,40)}`;
                      }
                    });
                    p1 += `<br><br>` + T('WARNING: These unknown processes will be terminated while exporting the pool. ');
                  }
                };
                this.loader.close();
                doDetach();
              },
              (err) => {
                this.loader.close()
                new EntityUtils().handleWSError(self, err, self.dialogService);
              });
            },
            (err) => {
              this.loader.close();
              this.dialogService.errorReport(T("Error exporting/disconnecting pool."), err.reason, err.trace.formatted);
            })
          } else {
            doDetach();
          }

          function doDetach() {
            const conf: DialogFormConfiguration = {
              title: T("Export/disconnect pool: '") + row1.name + "'",
              fieldConfig: [{
                type: 'paragraph',
                name: 'pool_detach_warning',
                paraText: helptext.detachDialog_pool_detach_warning_paratext_a + row1.name +
                  helptext.detachDialog_pool_detach_warning_paratext_b,
                isHidden: rowData.status === 'UNKNOWN' ? true : false
              }, {
                type: 'paragraph',
                name: 'unknown_status_detach_warning',
                paraText: `${helptext.detachWarningForUnknownState.message_a} ${row1.name} ${helptext.detachWarningForUnknownState.message_b}`,
                isHidden: rowData.status === 'UNKNOWN' ? false : true
              },{
                type: 'paragraph',
                name: 'pool_processes',
                paraText: p1,
                isHidden: p1 === '' ? true : false
              },{
                type: 'paragraph',
                name: 'pool_detach_warning',
                paraText: "'" + row1.name + helptext.detachDialog_pool_detach_warning__encrypted_paratext,
                isHidden: encryptedStatus > 0 ? false : true
              }, {
                type: 'checkbox',
                name: 'destroy',
                value: false,
                placeholder: helptext.detachDialog_pool_detach_destroy_checkbox_placeholder,
                isHidden: rowData.status === 'UNKNOWN' ? true : false
              }, {
                type: 'checkbox',
                name: 'cascade',
                value: rowData.status === 'UNKNOWN' ? false : true,
                placeholder: helptext.detachDialog_pool_detach_cascade_checkbox_placeholder,
              },{
                type: 'input',
                name: 'nameInput',
                required: true,
                isDoubleConfirm: true,
                maskValue: row1.name,
                validation: [Validators.pattern(row1.name)],
                relation : [
                  {
                    action : 'HIDE',
                    when : [ {
                      name : 'destroy',
                      value : false,
                    } ]
                  },
                ]
              },{
                type: 'checkbox',
                name: 'confirm',
                placeholder: rowData.status === 'UNKNOWN' ?
                  `${helptext.detachDialog_pool_detach_confim_checkbox_placeholder} ${helptext.unknown_status_alt_text}` :
                  `${helptext.detachDialog_pool_detach_confim_checkbox_placeholder}`,
                required: true
              }],
              isCustActionVisible(actionId: string) {
                if (actionId == 'download_key' && encryptedStatus === 0) {
                  return false;
                } else {
                  return true;
                }
              },
              saveButtonText: T('Export/Disconnect'),
              custActions: [
                {
                  id: 'download_key',
                  name: T('Download Key'),
                  function: () => {
                    const dialogRef = self.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
                    dialogRef.componentInstance.volumeId = row1.id;
                    dialogRef.componentInstance.fileName = 'pool_' + row1.name + '_encryption.key';
                  }
                }],
              customSubmit: function (entityDialog) {
                const value = entityDialog.formValue;
                let dialogRef = self.mdDialog.open(EntityJobComponent, {data: {"title":T("Exporting Pool")}, disableClose: true});
                dialogRef.updateSize('300px');
                dialogRef.componentInstance.setDescription(T("Exporting Pool..."));
                dialogRef.componentInstance.setCall("pool.export", [row1.id, { destroy: value.destroy, cascade: value.cascade, restart_services: self.restartServices }]);
                dialogRef.componentInstance.submit();
                dialogRef.componentInstance.success.subscribe(res=>{
                  entityDialog.dialogRef.close(true);
                  if (!value.destroy) {
                    self.dialogService.Info(T("Export/Disconnect Pool"), T("Successfully exported/disconnected '") + row1.name + "'");
                  } else {
                    self.dialogService.Info(T("Export/Disconnect Pool"), T("Successfully exported/disconnected '") + row1.name +
                    T("'. All data on that pool was destroyed."));
                  }
                  dialogRef.close(true);
                  self.parentVolumesListComponent.repaintMe();
                }),
                dialogRef.componentInstance.failure.subscribe((res) => {
                  let conditionalErrMessage = '';
                  if (res.error) {
                    if (res.exc_info.extra && res.exc_info.extra['code'] === 'control_services') {
                      entityDialog.dialogRef.close(true);
                      dialogRef.close(true);
                      if (res.exc_info.extra.stop_services.length > 0) {
                        conditionalErrMessage += `<div class="warning-box">` + T('These services must be stopped to export the pool:');
                        res.exc_info.extra.stop_services.forEach((item) => {
                          conditionalErrMessage += `<br>- ${item}`;
                        });
                      }
                      if (res.exc_info.extra.restart_services.length > 0) {
                        if (res.exc_info.extra.stop_services.length > 0) {
                          conditionalErrMessage += '<br><br>';
                        }
                        conditionalErrMessage += `<div class="warning-box">` + T('These services must be restarted to export the pool:');
                        res.exc_info.extra.restart_services.forEach((item) => {
                          conditionalErrMessage += `<br>- ${item}`;
                        });
                      }
                      conditionalErrMessage += `<br><br>`+ T('Exporting/disconnecting will continue after services have been managed.') + `</div><br />`;
                        self.dialogService.confirm(T("Error exporting/disconnecting pool."),
                          conditionalErrMessage, true, T('Manage Services and Continue'))
                            .subscribe((res) => {
                              if (res) {
                                self.restartServices = true;
                                this.customSubmit(entityDialog);
                              }
                          })
                    } else if (res.extra && res.extra['code'] === 'unstoppable_processes') {
                      entityDialog.dialogRef.close(true);

                      conditionalErrMessage =
                      T('Unable to terminate processes which are using this pool: ') + res.extra['processes'];
                      dialogRef.close(true);
                      self.dialogService.errorReport(T("Error exporting/disconnecting pool."), conditionalErrMessage, res.exception);
                    } else {
                      entityDialog.dialogRef.close(true);
                      dialogRef.close(true);
                      self.dialogService.errorReport(T("Error exporting/disconnecting pool."), res.error, res.exception);
                    }
                  } else {
                    entityDialog.dialogRef.close(true);
                    dialogRef.close(true);
                    self.dialogService.errorReport(T("Error exporting/disconnecting pool."), res.error, res.exception);
                  };
                });
              }
            }
            self.dialogService.dialogFormWide(conf);
          }
        }
    });

      if (rowData.is_decrypted) {
        actions.push({
          id: rowData.name,
          name: 'Add Vdevs',
          label: T("Add Vdevs"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "manager", row1.id]));
          }
        });
        actions.push({
          id: rowData.name,
          name: 'Scrub Pool',
          label: T("Scrub Pool"),
          onClick: (row1) => {
            this.getPoolData(row1.id).subscribe((res) => {
              if (res[0]) {
                if (res[0].scan.function === "SCRUB" && res[0].scan.state === "SCANNING") {
                  const message = "Stop the scrub on " + row1.name + "?";
                  this.dialogService.confirm("Scrub Pool", message, false, T("Stop Scrub")).subscribe((res) => {
                    if (res) {
                      this.loader.open();
                      this.ws.call('pool.scrub', [row1.id, 'STOP']).subscribe(
                        (res) => {
                          this.loader.close();
                          this.dialogService.Info(T("Stop Scrub"), T('Stopping scrub on pool <i>') + row1.name + '</i>.', '300px', "info", true);
                        },
                        (err) => {
                          this.loader.close();
                          new EntityUtils().handleWSError(this, err, this.dialogService);
                        }
                      )
                    }
                  });
                } else {
                  const message = T("Start scrub on pool <i>") + row1.name + "</i>?";
                  this.dialogService.confirm("Scrub Pool", message, false, T("Start Scrub")).subscribe((res) => {
                    if (res) {
                      this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { "title": T('Scrub Pool') }, disableClose: false });
                      this.dialogRef.componentInstance.setCall('pool.scrub', [row1.id, 'START']);
                      this.dialogRef.componentInstance.submit();
                      this.dialogRef.componentInstance.success.subscribe(
                        (jobres) => {
                          this.dialogRef.close(false);
                          if (jobres.progress.percent == 100 && jobres.progress.description === "Scrub finished") {
                            this.dialogService.Info(T('Scrub Complete'), T('Scrub complete on pool <i>') + row1.name + "</i>.", '300px', "info", true);
                          } else {
                            this.dialogService.Info(T('Stop Scrub'), T('Stopped the scrub on pool <i>') + row1.name + "</i>.", '300px', "info", true);
                          }
                        }
                      );
                      this.dialogRef.componentInstance.failure.subscribe((err) => {
                        this.dialogRef.componentInstance.setDescription(err.error);
                      });
                    }
                  });
                }
              }
            })
          }
        });
        actions.push({
          id: rowData.name,
          name: 'Status',
          label: T("Status"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat(
              ["storage", "pools", "status", row1.id]));
          }
        });
        actions.push({
          id: rowData.name,
          name: T('Expand Pool'),
          label: T("Expand Pool"),
          onClick: (row1) => {
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
                  required: true
                }
              ],
              saveButtonText: helptext.expand_pool_dialog.save_button,
              customSubmit: function (entityDialog) {
                doExpand(entityDialog);
              }
            }

            function doExpand(entityDialog?) {
              parent.loader.open();
              const payload = [row1.id];
              if (entityDialog) {
                payload.push({"geli": {"passphrase": entityDialog.formValue['passphrase']}});
              }
              parent.ws.job('pool.expand', payload).subscribe(
                (res) => {
                  parent.loader.close();
                  if (res.error) {
                    if (res.exc_info && res.exc_info.extra) {
                      res.extra = res.exc_info.extra;
                    }
                    new EntityUtils().handleWSError(this, res, parent.dialogService, conf.fieldConfig);
                  }
                  if (res.state === 'SUCCESS') {
                    if (entityDialog) {
                      entityDialog.dialogRef.close(true);
                    }
                    parent.dialogService.generalDialog({
                      title: helptext.expand_pool_success_dialog.title,
                      icon: 'info',
                      is_html: true,
                      message: `${helptext.expand_pool_success_dialog.message} <i>${row1.name}</i>`,
                      hideCancel: true,
                    });
                  }
                },
                (err) => {
                  parent.loader.close();
                  new EntityUtils().handleWSError(this, err, parent.dialogService);
                }
              )
            }


            if (row1.encrypt === 0) {
              this.dialogService.generalDialog({
                title: helptext.expand_pool_dialog.title + row1.name,
                message: helptext.expand_pool_dialog.message,
                confirmBtnMsg: helptext.expand_pool_dialog.save_button,
              }).subscribe((res) => {
                if (res) {
                  doExpand();
                }
              })
            } else {
              self.dialogService.dialogForm(conf);
            }
          }
        });

        if (rowData.is_upgraded === false) {
          actions.push({
            id: rowData.name,
            name: T('Upgrade Pool'),
            label: T("Upgrade Pool"),
            onClick: (row1) => {
              this.translate.get(helptext.upgradePoolDialog_warning).subscribe(warning => {
                this.dialogService
                  .confirm(
                    T("Upgrade Pool"),
                      warning + row1.name
                  )
                  .subscribe(confirmResult => {
                    if (confirmResult === true) {
                      this.loader.open();
                      this.ws.call("pool.upgrade", [rowData.id]).subscribe(
                        res => {
                          this.translate.get(T("Successfully Upgraded ")).subscribe(success_upgrade => {
                            this.dialogService
                              .Info(
                                T("Upgraded"),
                                  success_upgrade + row1.name
                              )
                              .subscribe(infoResult => {
                                this.parentVolumesListComponent.repaintMe();
                            });
                          });
                        },
                        res => {
                          this.translate.get(T("Error Upgrading Pool ")).subscribe(error_upgrade => {
                            this.dialogService.errorReport(
                              error_upgrade + row1.name,
                              res.message,
                              res.stack
                            );
                          });
                        },
                        () => this.loader.close()
                      );
                    }
                  });
                });
            }
          });
        }
      }
    }

    if (rowData.type === "FILESYSTEM") {
      if (!rowData.locked) {
        actions.push({
          id: rowData.name,
          name: T('Add Dataset'),
          label: T("Add Dataset"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "pools", "id", row1.id.split('/')[0], "dataset",
              "add", row1.id
            ]));
          }
        });
        actions.push({
          id: rowData.name,
          name: T('Add Zvol'),
          label: T("Add Zvol"),
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "pools", "id", row1.id.split('/')[0], "zvol", "add",
              row1.id
            ]));
          }
        });
      }
      actions.push({
        id: rowData.name,
        name: T('Edit Options'),
        label: T("Edit Options"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.id.split('/')[0], "dataset",
            "edit", row1.id
          ]));
        }
      });
      if (rowDataPathSplit[1] !== "iocage" && !rowData.locked) {
            actions.push({
              id: rowData.name,
              name: T('Edit Permissions'),
              label: T("Edit Permissions"),
              ttposition: 'left',
              onClick: (row1) => {
                this._router.navigate(new Array('/').concat([
                  "storage", "pools", "permissions", row1.id
                ]));
              }
            },
            {
              id: rowData.name,
              name: T('Edit ACL'),
              label: T("Edit ACL"),
              matTooltip: helptext.acl_edit_msg,
              isHidden: this.productType === 'SCALE' ? true : false, // Temporary, for SCALE
              ttposition: 'left',
              onClick: (row1) => {
                this._router.navigate(new Array('/').concat([
                  "storage", "pools", "id", row1.id.split('/')[0], "dataset",
                  "acl", row1.id
                ]));
              }
            },
            {
              id: rowData.name,
              name: T('User Quotas'),
              label: T('User Quotas'),
              onClick: (row1) => {
                this._router.navigate(new Array('/').concat([
                  "storage", "pools", "user-quotas", row1.id
                ]));
              }
            },
            {
              id: rowData.name,
              name: T('Group Quotas'),
              label: T('Group Quotas'),
              onClick: (row1) => {
                this._router.navigate(new Array('/').concat([
                  "storage", "pools", "group-quotas", row1.id
                ]));
              }
            },
          );
      }

      if (rowData.id.indexOf('/') !== -1) {
        actions.push({
          id: rowData.name,
          name: T('Delete Dataset'),
          label: T("Delete Dataset"),
          onClick: (row1) => {
            this.dialogService.doubleConfirm(
              T('Delete Dataset <i><b>') + row1.name + '</b></i>',
              T('The <i><b>') + row1.name + "</b></i> dataset and all snapshots stored with it <b>will be permanently deleted<b>.",
              row1.name,
              true,
              T("DELETE DATASET")
            ).subscribe((doubleConfirmDialog) => {
              if (doubleConfirmDialog) {
                this.loader.open();
                this.ws.call('pool.dataset.delete', [row1.id, {"recursive": true}]).subscribe(
                  (wsResp) => {
                    this.loader.close();
                    this.parentVolumesListComponent.repaintMe();
                  },
                  (e_res) => {
                    this.loader.close();
                    if (e_res.reason.indexOf('Device busy') > -1) {
                      this.dialogService.confirm(T('Device Busy'), T('Force deletion of dataset ') + "<i>" + row1.name + "</i>?", false, T('Force Delete')).subscribe(
                        (res) => {
                          if (res) {
                            this.loader.open();
                            this.ws.call('pool.dataset.delete', [row1.id, {"recursive": true, "force": true}]).subscribe(
                              (wsres) => {
                                this.loader.close();
                                this.parentVolumesListComponent.repaintMe();
                              },
                              (err) => {
                                this.loader.close();
                                this.dialogService.errorReport(T("Error deleting dataset ") + "<i>" + row1.name + "</i>.", err.reason, err.stack);
                              }
                            );
                          }
                        }
                      )
                    } else {
                      this.dialogService.errorReport(T("Error deleting dataset ") + "<i>" + row1.name + "</i>.", e_res.reason, e_res.stack);
                    }
                });
              }
            });
          }
        });

      }


    }
    if (rowData.type === "VOLUME") {
      actions.push({
        id: rowData.name,
        name: T('Delete Zvol'),
        label: T("Delete Zvol"),
        onClick: (row1) => {
          this.dialogService.doubleConfirm(T("Delete "),
            T("Delete the zvol ") + "<b><i>" + row1.name + "</i></b>"+ T(" and all snapshots of it?"), row1.name,
            true, T('Delete Zvol')).subscribe((confirmed) => {
            if (confirmed === true) {
              this.loader.open();

              this.ws.call('pool.dataset.delete', [row1.id, {"recursive": true}]).subscribe((wsResp) => {
                this.loader.close();
                this.parentVolumesListComponent.repaintMe();

              }, (res) => {
                this.loader.close();
                this.dialogService.errorReport(T("Error Deleting zvol ") + row1.id, res.reason, res.stack);
              });
            }
          });

        }
      });
      actions.push({
        id: rowData.name,
        name: T('Edit Zvol'),
        label: T("Edit Zvol"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.id.split('/')[0], "zvol", "edit",
            row1.id
          ]));
        }
      });


    }
    if (rowData.type === "zvol" || rowData.type === "FILESYSTEM") {
      actions.push({
        id: rowData.name,
        name: T('Create Snapshot'),
        label: T("Create Snapshot"),
        onClick: (row) => {
          this.ws.call('vmware.dataset_has_vms',[row.id, false]).subscribe((vmware_res)=>{
            this.vmware_res_status = vmware_res;
          })
          this.dialogConf = {
            title: "One time snapshot of " + row.id,
            fieldConfig: [
              {
                type: 'input',
                name: 'dataset',
                placeholder: helptext.snapshotDialog_dataset_placeholder,
                value: row.id,
                isHidden: true,
                readonly: true
              },
              {
                type: 'input',
                name: 'name',
                placeholder: helptext.snapshotDialog_name_placeholder,
                tooltip: helptext.snapshotDialog_name_tooltip,
                validation: helptext.snapshotDialog_name_validation,
                required: true,
                value: "manual" + '-' + this.getTimestamp()
              },
              {
                type: 'checkbox',
                name: 'recursive',
                placeholder: helptext.snapshotDialog_recursive_placeholder,
                tooltip: helptext.snapshotDialog_recursive_tooltip,
                parent: this,
                updater: parent => {
                  parent.recursiveIsChecked = !parent.recursiveIsChecked;
                  parent.ws.call('vmware.dataset_has_vms',[row.id, parent.recursiveIsChecked]).subscribe((vmware_res)=>{
                    parent.vmware_res_status = vmware_res;
                    _.find(parent.dialogConf.fieldConfig, {name : "vmware_sync"})['isHidden'] = !parent.vmware_res_status;
                  });
                }
              },
              {
                type: 'checkbox',
                name: 'vmware_sync',
                placeholder: helptext.vmware_sync_placeholder,
                tooltip: helptext.vmware_sync_tooltip,
                isHidden: !this.vmware_res_status
              }
            ],
            method_ws: "zfs.snapshot.create",
            saveButtonText: T("Create Snapshot"),
          }
          this.dialogService.dialogForm(this.dialogConf).subscribe((res) => {
            if (res) {
              this.dialogService.Info(T("Create Snapshot"), T("Snapshot successfully taken."));
            }
          });
        }
      });

      let rowDataset = _.find(this.datasetData, { id: rowData.id });
      if (rowDataset && rowDataset['origin'] && !!rowDataset['origin'].parsed) {
        actions.push({
          id: rowData.name,
          name: T('Promote Dataset'),
          label: T("Promote Dataset"),
          onClick: (row1) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.id]).subscribe((wsResp) => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService.Info(T("Promote Dataset"), T("Successfully Promoted ") + row1.id).subscribe((infoResult) => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              this.dialogService.errorReport(T("Error Promoting dataset ") + row1.id, res.reason, res.stack);
            });
          }
        });
      }
    }
    return actions;
  }

  getEncryptedDatasetActions(rowData) {
    const encryption_actions = [];
    if (rowData.encrypted) {
      if (rowData.locked){
        if (rowData.is_encrypted_root && (!rowData.parent || (rowData.parent && !rowData.parent.locked))) {
          encryption_actions.push({
            id:rowData.name,
            name: T('Unlock'),
            label: T('Unlock'),
            onClick: (row1) => {
              //unlock
              this._router.navigate(new Array('/').concat([
                "storage", "pools", "id", row1.id.split('/')[0], "dataset",
                "unlock", row1.id
              ]));
            }
          });
        }
      } else {
        encryption_actions.push({
          id: rowData.name,
          name: T('Encryption Options'),
          label: T('Encryption Options'),
          onClick: (row) => {
            // open encryption options dialog
            let key_child = false;
            for (let i = 0; i < this.datasetData.length; i++) {
              let ds = this.datasetData[i];
              if (ds['id'].startsWith(row.id) && ds.id !== row.id && 
                ds.encryption_root && (ds.id === ds.encryption_root) && 
                ds.key_format && ds.key_format.value && ds.key_format.value === 'HEX') {
                key_child = true;
                break;
              }
            }
            const can_inherit = (row.parent && row.parent.encrypted);
            const passphrase_parent = (row.parent && row.parent.key_format && row.parent.key_format.value === 'PASSPHRASE');
            const is_key = (passphrase_parent? false : (key_child? true : !row.is_passphrase));
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
                  value: (is_key? 'key' : 'passphrase'),
                  options: dataset_helptext.dataset_form_encryption.encryption_type_options,
                  isHidden: passphrase_parent || key_child
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
                  type: 'checkbox',
                  name: 'confirm',
                  placeholder: helptext.encryption_options_dialog.confirm_checkbox,
                  required: true,
                }
              ],
              saveButtonText: helptext.encryption_options_dialog.save_button,
              afterInit: function(entityDialog) {
                const inherit_encryption_fg = entityDialog.formGroup.controls['inherit_encryption'];
                const encryption_type_fg = entityDialog.formGroup.controls['encryption_type'];
                const encryption_type_fc = _.find(entityDialog.fieldConfig, {name: 'encryption_type'});
                const generate_key_fg = entityDialog.formGroup.controls['generate_key'];

                const all_encryption_fields = ['encryption_type', 'passphrase', 'pbkdf2iters', 'generate_key', 'key'];

                if (inherit_encryption_fg.value) { // if already inheriting show as inherit
                  for (let i = 0; i < all_encryption_fields.length; i++) {
                    entityDialog.setDisabled(all_encryption_fields[i], true, true);
                  }
                }
                const inherit_encryption_subscription = inherit_encryption_fg.valueChanges.subscribe(inherit => {
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

                const encryption_type_subscription = encryption_type_fg.valueChanges.subscribe(enc_type => {
                  const key = (enc_type === 'key');
                  entityDialog.setDisabled('generate_key', !key, !key);
                  if (key) {
                    const gen_key = generate_key_fg.value;
                    entityDialog.setDisabled('key', gen_key, gen_key);
                  } else {
                    entityDialog.setDisabled('key', true, true);
                  }
                  entityDialog.setDisabled('passphrase', key, key);
                  entityDialog.setDisabled('pbkdf2iters', key, key);
                });

                const generate_key_subscription = generate_key_fg.valueChanges.subscribe(gen_key => {
                  if (!inherit_encryption_fg.value && encryption_type_fg.value === 'key') {
                    entityDialog.setDisabled('key', gen_key, gen_key);
                  }
                });
              },
              customSubmit: function(entityDialog) {
                const formValue = entityDialog.formValue;
                let method = 'pool.dataset.change_key';
                const body = {};
                const payload = [row.id];
                if (formValue.inherit_encryption) {
                  method = 'pool.dataset.inherit_parent_encryption_properties';
                  entityDialog.loader.open();
                  entityDialog.ws.call(method, payload).subscribe(res => {
                    entityDialog.loader.close();
                    self.dialogService.Info(helptext.encryption_options_dialog.dialog_saved_title, 
                      helptext.encryption_options_dialog.dialog_saved_message1 + row.id + helptext.encryption_options_dialog.dialog_saved_message2);
                    entityDialog.dialogRef.close();
                    self.parentVolumesListComponent.repaintMe();
                  }, (err) => {
                    entityDialog.loader.close();
                    new EntityUtils().handleWSError(entityDialog, err, self.dialogService);
                  });
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
                  const dialogRef = self.mdDialog.open(EntityJobComponent, {data: {"title":helptext.encryption_options_dialog.save_encryption_options}, disableClose: true});
                  dialogRef.componentInstance.setDescription(helptext.encryption_options_dialog.saving_encryption_options);
                  dialogRef.componentInstance.setCall(method, payload);
                  dialogRef.componentInstance.submit();
                  dialogRef.componentInstance.success.subscribe(res=>{
                    if (res) {
                      dialogRef.close()
                      entityDialog.dialogRef.close();
                      self.dialogService.Info(helptext.encryption_options_dialog.dialog_saved_title, 
                        helptext.encryption_options_dialog.dialog_saved_message1 + row.id + helptext.encryption_options_dialog.dialog_saved_message2);
                      self.parentVolumesListComponent.repaintMe();
                    }
                  });
                  dialogRef.componentInstance.failure.subscribe(err =>{
                    if (err) {
                      dialogRef.close();
                      new EntityUtils().handleWSError(entityDialog, err, self.dialogService);
                    }
                  })
                }
              }
            }
            this.dialogService.dialogForm(this.dialogConf).subscribe((res) => {
            });
          }
        });
        if (rowData.is_encrypted_root && rowData.is_passphrase) {
          encryption_actions.push({
            id: rowData.name,
            name: T('Lock'),
            label: T('Lock'),
            onClick: (row) => {
              // lock
              const title = helptext.lock_dataset_dialog.dialog_title + row.name;
              const message = helptext.lock_dataset_dialog.dialog_message + row.name + '?'
              const params = [row.id];
              let force_umount = false;
              const ds = this.dialogService.confirm(title, message, false, helptext.lock_dataset_dialog.button, 
                true, helptext.lock_dataset_dialog.checkbox_message, 'pool.dataset.lock', params);
              
              ds.componentInstance.switchSelectionEmitter.subscribe((res) => {
                force_umount = res;
              });
              ds.afterClosed().subscribe((status)=>{
                if(status){
                  this.loader.open();
                  params.push({'force_umount':force_umount});
                  this.ws.call(
                    ds.componentInstance.method,params).subscribe((res)=>{
                      this.loader.close();
                      this.parentVolumesListComponent.repaintMe();
                    }, (err)=>{
                      this.loader.close();
                      new EntityUtils().handleWSError(this, err, this.dialogService);
                    });
                }
              });  
            }
          });
        }
      }
    }
    return encryption_actions;
  }

  clickAction(rowData) {
    let aclEditDisabled = false;
    let permissionsEditDisabled = false;
    if (!rowData.locked) {
      this.ws.call('filesystem.acl_is_trivial', ['/mnt/' + rowData.id]).subscribe(acl_is_trivial => {
        !rowData.id.includes('/') || !acl_is_trivial ? permissionsEditDisabled = true : permissionsEditDisabled = false;
        rowData.id.includes('/') ? aclEditDisabled = false : aclEditDisabled = true;
        let editACL = rowData.actions[0].actions.find(o => o.name === 'Edit ACL');
          if (editACL) {
            editACL.disabled = aclEditDisabled;
          }
        let editPermissions = rowData.actions[0].actions.find(o => o.name === 'Edit Permissions')
        if (editPermissions) {
          editPermissions.disabled = permissionsEditDisabled;
          aclEditDisabled ? editPermissions.matTooltip = helptext.permissions_edit_msg1 :
          editPermissions.matTooltip = helptext.permissions_edit_msg2
        }
      })
    }
  }

  getTimestamp() {
    let dateTime = new Date();
    return moment(dateTime).format("YYYY-MM-DD_HH-mm");
  }

  dataHandler(data: any): TreeNode {
    const node: TreeNode = {};
    node.data = data;
    parent = data.parent;
    this.getMoreDatasetInfo(data, parent);
    node.data.group_actions = true;
    let actions_title = helptext.dataset_actions;
    if (data.type === 'zvol') {
      actions_title = helptext.zvol_actions;
    }
    const actions = [{title: actions_title, actions: this.getActions(data)}];
    if (data.type === 'FILESYSTEM') {
      const encryption_actions = this.getEncryptedDatasetActions(data);
      if (encryption_actions.length > 0) {
        actions.push({title: helptext.encryption_actions_title, actions: encryption_actions});
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
    }
    delete node.data.children;
    return node;
  }

  getMoreDatasetInfo(dataObj, parent) {
    const dataset_data2 = this.datasetData;
    this.translate.get(T("Inherits")).subscribe(inherits => {
      for (const k in dataset_data2) {
        if (dataset_data2[k].id === dataObj.id) {
          if (dataset_data2[k].compression) {
            dataset_data2[k].compression.source !== "INHERITED"
              ? dataObj.compression = (dataset_data2[k].compression.parsed)
              : dataObj.compression = (inherits + " (" + dataset_data2[k].compression.parsed + ")");
          }
          if (dataset_data2[k].compressratio) {
            dataset_data2[k].compressratio.source !== "INHERITED"
              ? dataObj.compressratio = (dataset_data2[k].compressratio.parsed)
              : dataObj.compressratio = (inherits + " (" + dataset_data2[k].compressratio.parsed + ")");
          }
          if (dataset_data2[k].readonly) {
            dataset_data2[k].readonly.source !== "INHERITED"
              ? dataObj.readonly = (dataset_data2[k].readonly.parsed)
              : dataObj.readonly = (inherits + " (" + dataset_data2[k].readonly.parsed + ")");
          }
          if (dataset_data2[k].deduplication) {
            dataset_data2[k].deduplication.source !== "INHERITED"
              ? dataObj.dedup = (dataset_data2[k].deduplication.parsed)
              : dataObj.dedup = (inherits + " (" + dataset_data2[k].deduplication.parsed + ")");
          }
          if (dataset_data2[k].comments) {
            dataset_data2[k].comments.source !== "INHERITED"
              ? dataObj.comments = (dataset_data2[k].comments.parsed)
              : dataObj.comments = ("");
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
  styleUrls: ['./volumes-list.component.css'],
  templateUrl: './volumes-list.component.html',
  providers: []
})
export class VolumesListComponent extends EntityTableComponent implements OnInit {

  title = T("Pools");
  zfsPoolRows: ZfsPoolData[] = [];
  conf: InputTableConf = new VolumesListTableConfig(this, this.router, "", [], this.mdDialog, this.ws, this.dialogService, this.loader, this.translate, this.storage, {}, this.messageService, this.http);

  actionComponent = {
    getActions: (row) => {
      return [
        {
          name: 'pool_actions',
          title: helptext.pool_actions_title,
          actions: this.conf.getActions(row),
        },
        {
          name: 'encryption_actions',
          title: helptext.encryption_actions_title,
          actions: (<VolumesListTableConfig>this.conf).getEncryptedActions(row),
        }
      ];
    },
    conf: new VolumesListTableConfig(this, this.router, "", [], this.mdDialog, this.ws, this.dialogService, this.loader, this.translate, this.storage, {}, this.messageService, this.http)
  };

  expanded = false;
  public paintMe = true;
  public isFooterConsoleOpen: boolean;
  public systemdatasetPool: any;
  public has_encrypted_root = {};

  constructor(protected core: CoreService ,protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected mdDialog: MatDialog, protected erdService: ErdService, protected translate: TranslateService,
    public sorter: StorageService, protected job: JobService, protected storage: StorageService, protected pref: PreferencesService, protected messageService: MessageService, protected http:HttpClient) {
    super(core, rest, router, ws, _eRef, dialogService, loader, erdService, translate, sorter, job, pref, mdDialog);
  }

  public repaintMe() {
    this.showDefaults = false;
    this.paintMe = false;
    this.ngOnInit();
  }

  async ngOnInit(): Promise<void> {
    this.showSpinner = true;

    this.systemdatasetPool = await this.ws.call('systemdataset.config').pipe(map(res => res.pool)).toPromise;

    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }



    combineLatest(this.ws.call('pool.query', []), this.ws.call('pool.dataset.query', [])).subscribe(async ([pools, datasets]) => {
      if (pools.length > 0) {
        for (const pool of pools) {
          pool.is_upgraded = await this.ws.call('pool.is_upgraded', [pool.id]).toPromise();
          if (!pool.is_decrypted) {
            pool.status = 'LOCKED';
          }

          /* Filter out system datasets */
          const pChild = datasets.find(set => set.name === pool.name);
          if (pChild) {
            pChild.children = pChild.children.filter(child => child.name.indexOf(`${pool.name}/.system`) === -1);
          }
          pool.children = pChild ? [pChild] : [];

          pool.volumesListTableConfig = new VolumesListTableConfig(this, this.router, pool.id, datasets, this.mdDialog, this.ws, this.dialogService, this.loader, this.translate, this.storage, pool, this.messageService, this.http);
          pool.type = 'zpool';

          if (pool.children && pool.children[0]) {
            try {
              pool.children[0].is_encrypted_root = (pool.children[0].id === pool.children[0].encryption_root);
              if (pool.children[0].is_encrypted_root) {
                this.has_encrypted_root[pool.name] = true;
              }
              pool.children[0].available_parsed = this.storage.convertBytestoHumanReadable(pool.children[0].available.parsed || 0);
              pool.children[0].used_parsed = this.storage.convertBytestoHumanReadable(pool.children[0].used.parsed || 0);
              pool.availStr = (<any>window).filesize(pool.children[0].available.parsed, { standard: "iec" });
              pool.children[0].has_encrypted_children = false;
              for (let i = 0; i < datasets.length; i++) {
                const ds = datasets[i];
                if (ds['id'].startsWith(pool.children[0].id) && ds.id !== pool.children[0].id && ds.encrypted) {
                  pool.children[0].has_encrypted_children = true;
                  break;
                }
              }
            } catch (error) {
              pool.availStr = "" + pool.children[0].available.parsed;
              pool.children[0].available_parsed = "Unknown";
              pool.children[0].used_parsed = "Unknown";
            }

            try {
              const used_pct =  pool.children[0].used.parsed / (pool.children[0].used.parsed + pool.children[0].available.parsed);
              const spacerStr = pool.healthy ? ': ' : '';
              pool.usedStr = spacerStr + (<any>window).filesize(pool.children[0].used.parsed, { standard: "iec" }) + " (" + Math.round(used_pct * 100) + "%)";
            } catch (error) {
              pool.usedStr = "" + pool.children[0].used.parsed;
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

      this.dialogService.errorReport(T("Error getting pool data."), res.message, res.stack);
    });

    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });
  }
}
