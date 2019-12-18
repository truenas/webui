import { Component, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, JobService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import {TreeNode} from 'primeng/api';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { MessageService } from '../../../common/entity/entity-form/services/message.service';

import { ErdService } from 'app/services/erd.service';
import { T } from '../../../../translate-marker';
import { StorageService } from '../../../../services/storage.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import helptext from '../../../../helptext/storage/volumes/volume-list';

import { CoreService } from 'app/core/services/core.service';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PreferencesService } from 'app/core/services/preferences.service';
import { Validators } from '@angular/forms';
import { inherits } from 'util';

export interface ZfsPoolData {
  avail?: number;
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
  used?: number;
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

export class VolumesListTableConfig implements InputTableConf {
  public hideTopActions = true;
  public flattenedVolData: any;
  public resource_name = 'storage/volume';
  public tableData: TreeNode[] = [];
  public columns: Array < any > = [
    { name: 'Name', prop: 'name', always_display: true  },
    { name: 'Type', prop: 'type', },
    { name: 'Used', prop: 'used', filesizePipe: true},
    { name: 'Available', prop: 'avail', filesizePipe: true},
    { name: 'Compression', prop: 'compression', hidden: true },
    { name: 'Compression Ratio', prop: 'compressratio', hidden: true },
    { name: 'Readonly', prop: 'readonly', },
    { name: 'Dedup', prop: 'dedup', hidden: true },
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

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private _router: Router,
    private _classId: string,
    private title: string,
    private datasetData: Object,
    public mdDialog: MatDialog,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService,
    protected storageService: StorageService,
    protected volumeData: Object,
    protected messageService: MessageService
  ) {

    if (typeof (this._classId) !== "undefined" && this._classId !== "" && volumeData && volumeData['children']) {
      const resource_name = this.resource_name + "/" + this._classId;
      this.tableData = [];
      for (let i = 0; i < volumeData['children'].length; i++) {
        this.tableData.push(this.dataHandler(volumeData['children'][i]));
      }
    }
  }

  isCustActionVisible(actionname: string) {
    if (actionname === 'download_key' && this.encryptedStatus !== '') {
      return true;
    } else {
      return false;
    }
  }

  getEncryptedActions(rowData: any) {
    const actions = [], self = this;
    if (rowData.vol_encrypt === 2) {
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
                  p1 = `These services depend on pool <i>${row1.name}</i> and will be disrupted if the pool is locked:`;
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
                    required: true
                  }
                ],
                saveButtonText: T("Lock Pool"),
                customSubmit: function (entityDialog) {
                  const value = entityDialog.formValue;
                  self.loader.open();
                  self.rest.post(self.resource_name + "/" + row1.name + "/lock/",
                    { body: JSON.stringify({passphrase : value.passphrase}) }).subscribe((restPostResp) => {
                      entityDialog.dialogRef.close(true);
                      self.loader.close();
                      self.parentVolumesListComponent.repaintMe();
                  }, (res) => {
                    self.loader.close();
                    if (res.message) {
                      self.dialogService.errorReport(T("Error locking pool."), res.message, res.stack);
                    }
                    else {
                      new EntityUtils().handleError(this, res);
                    }
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

    } else if (rowData.vol_encrypt === 1 && rowData.is_decrypted && self.parentVolumesListComponent.systemdatasetPool != rowData.name) {
      actions.push({
        label: T("Encryption Key"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "pools", "createkey", row1.id]));
        }
      });
    }

    if (rowData.is_decrypted) {

      actions.push({
        label: T("Recovery Key"),
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
          title: "Unlock " + row1.name,
          fieldConfig: [
            {
              type : 'input',
              inputType: 'password',
              name : 'passphrase',
              togglePw: true,
              placeholder: helptext.unlockDialog_password_placeholder,
            },
            {
              type: 'upload',
              message: self.messageService,
              updater: self.key_file_updater,
              parent: self,
              hideButton: true, 
              name: 'key',
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
          },
          saveButtonText: T("Unlock"),
          customSubmit: function (entityDialog) {
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
              dialogRef.close(false);
              entityDialog.dialogRef.close(true);
              self.parentVolumesListComponent.repaintMe();
              self.dialogService.Info(T("Unlock"), row1.name + T(" has been unlocked."), '300px', "info", true);
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
    let rowDataPathSplit = [];
    const self = this;
    if (rowData.path) {
      rowDataPathSplit = rowData.path.split('/');
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
          let encryptedStatus = row1.vol_encryptkey,
          self = this;
          if (rowData.is_decrypted && rowData.status !== 'UNKNOWN') {
            this.loader.open();
            this.ws.call('pool.attachments', [row1.id]).subscribe((res) => {
              if (res.length > 0) {
                p1 = `These services depend on pool <i>${row1.name}</i> and will be disrupted if the pool is detached:`;
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
                    p1 += `<br><br>WARNING: These unknown processes will be terminated while exporting the pool.`;
                  }
                };
                this.loader.close();
                doDetach();
            })
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
            title: "Export/disconnect pool: '" + row1.name + "'",
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
              isHidden: encryptedStatus !== '' ? false : true
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
              if (actionId == 'download_key' && encryptedStatus === '') {
                return false;
              } else {
                return true;
              }
            },
            saveButtonText: T('Export/Disconnect'),
            custActions: [
              {
                id: 'download_key',
                name: 'Download Key',
                function: () => {
                  const dialogRef = self.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
                  dialogRef.componentInstance.volumeId = row1.id;
                  dialogRef.componentInstance.fileName = 'pool_' + row1.name + '_encryption.key';
                }
              }],
            customSubmit: function (entityDialog) {
              const value = entityDialog.formValue;
              let dialogRef = self.mdDialog.open(EntityJobComponent, {data: {"title":"Exporting Pool"}, disableClose: true});
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
                if (res.error && res.error.includes('EBUSY')) {
                  if (res.exc_info.extra && res.exc_info.extra['code'] === 'services_restart') {
                    entityDialog.dialogRef.close(true);
                    dialogRef.close(true);
                    conditionalErrMessage = '<div class="warning-box">Warning: These services must be restarted to export the pool:<br>';
                    res.exc_info.extra.services.forEach((item) => {
                      conditionalErrMessage += `<br>- ${item}`;
                    })
                    conditionalErrMessage += '<br><br>Exporting/disconnecting will continue after services have been restarted.</div><br />';
                      self.dialogService.confirm(T("Error exporting/disconnecting pool."),
                        conditionalErrMessage, true, 'Restart Services and Continue')
                          .subscribe((res) => {
                            if (res) {
                              self.restartServices = true;
                              this.customSubmit(entityDialog);
                            }
                        })
                  } else if (res.extra && res.extra['code'] === 'unstoppable_processes') {
                    entityDialog.dialogRef.close(true);

                    conditionalErrMessage =
                    `Unable to terminate processes which are using this pool: ${res.extra['processes']}`;
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
          name: 'Extend',
          label: T("Extend"),
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
                          if (jobres.progress.percent == 100) {
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

        if (rowData.is_upgraded === false) {

          actions.push({
            id: rowData.name,
            name: T('Upgrade Pool'),
            label: T("Upgrade Pool"),
            onClick: (row1) => {

              this.dialogService.confirm(T("Upgrade Pool"), helptext.upgradePoolDialog_warning + row1.name).subscribe((confirmResult) => {
                  if (confirmResult === true) {
                    this.loader.open();

                    this.rest.post("storage/volume/" + row1.id + "/upgrade", { body: JSON.stringify({}) }).subscribe((restPostResp) => {
                      this.loader.close();

                      this.dialogService.Info(T("Upgraded"), T("Successfully Upgraded ") + row1.name).subscribe((infoResult) => {
                        this.parentVolumesListComponent.repaintMe();
                      });
                    }, (res) => {
                      this.loader.close();
                      this.dialogService.errorReport(T("Error Upgrading Pool ") + row1.name, res.message, res.stack);
                    });
                  }
                });

            }
          });
        }
      }
    }

    if (rowData.type === "dataset") {
      actions.push({
        id: rowData.name,
        name: T('Add Dataset'),
        label: T("Add Dataset"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "dataset",
            "add", row1.path
          ]));
        }
      });
      actions.push({
        id: rowData.name,
        name: T('Add Zvol'),
        label: T("Add Zvol"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "zvol", "add",
            row1.path
          ]));
        }
      });
      actions.push({
        id: rowData.name,
        name: T('Edit Options'),
        label: T("Edit Options"),
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "pools", "id", row1.path.split('/')[0], "dataset",
            "edit", row1.path
          ]));
        }
      });
      if (rowDataPathSplit[1] !== "iocage") {
        let optionDisabled;
        rowData.path.includes('/') ? optionDisabled = false : optionDisabled = true;
        actions.push({
          id: rowData.name,
          name: T('Edit Permissions'),
          label: T("Edit Permissions"),
          disabled: optionDisabled,
          matTooltip: helptext.permissions_edit_msg,
          ttposition: 'left',
          onClick: (row1) => {
            this.ws.call('filesystem.acl_is_trivial', ['/mnt/' + row1.path]).subscribe(acl_is_trivial => {
              if (acl_is_trivial) {
                this._router.navigate(new Array('/').concat([
                  "storage", "pools", "permissions", row1.path
                ]));
              } else {
                this.dialogService.confirm(T("Dataset has complex ACLs"),
                  T("This dataset has ACLs that are too complex to be edited with \
                    the permissions editor.  Open in ACL editor instead?"),
                  true, T("EDIT ACL")).subscribe(edit_acl => {
                    if (edit_acl) {
                        this._router.navigate(new Array('/').concat([
                          "storage", "pools", "id", row1.path.split('/')[0], "dataset",
                          "acl", row1.path
                        ]));
                      }
                });
              }
            });
          }
        },
        {
          id: rowData.name,
          name: T('Edit ACL'),
          label: T("Edit ACL"),
          disabled: optionDisabled,
          matTooltip: helptext.acl_edit_msg,
          ttposition: 'left',
          onClick: (row1) => {
            this._router.navigate(new Array('/').concat([
              "storage", "pools", "id", row1.path.split('/')[0], "dataset",
              "acl", row1.path
            ]));
          }
        },
        );
      }

      if (rowData.path.indexOf('/') !== -1) {
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
                this.ws.call('pool.dataset.delete', [row1.path, {"recursive": true}]).subscribe(
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
                            this.ws.call('pool.dataset.delete', [row1.path, {"recursive": true, "force": true}]).subscribe(
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
    if (rowData.type === "zvol") {
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

              this.ws.call('pool.dataset.delete', [row1.path, {"recursive": true}]).subscribe((wsResp) => {
                this.loader.close();
                this.parentVolumesListComponent.repaintMe();

              }, (res) => {
                this.loader.close();
                this.dialogService.errorReport(T("Error Deleting zvol ") + row1.path, res.reason, res.stack);
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
            "storage", "pools", "id", row1.path.split('/')[0], "zvol", "edit",
            row1.path
          ]));
        }
      });


    }
    if (rowData.type === "zvol" || rowData.type === "dataset") {
      actions.push({
        id: rowData.name,
        name: T('Create Snapshot'),
        label: T("Create Snapshot"),
        onClick: (row) => {
          this.ws.call('vmware.dataset_has_vms',[row.path, false]).subscribe((vmware_res)=>{
            this.vmware_res_status = vmware_res;
          })
          this.dialogConf = {
            title: "One time snapshot of " + row.path,
            fieldConfig: [
              {
                type: 'input',
                name: 'dataset',
                placeholder: helptext.snapshotDialog_dataset_placeholder,
                value: row.path,
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
                updater: this.updater
              },
              {
                type: 'checkbox',
                name: 'vmware_sync',
                placeholder: helptext.vmware_sync_placeholder,
                tooltip: helptext.vmware_sync_tooltip,
                isHidden: !this.vmware_res_status
              }
            ],
            method_rest: "storage/snapshot",
            saveButtonText: T("Create Snapshot"),
          }
          this.dialogService.dialogForm(this.dialogConf).subscribe((res) => {
            if (res) {
              this.dialogService.Info(T("Create Snapshot"), T("Snapshot successfully taken."));
            }
          });
        }
      });

      let rowDataset = _.find(this.datasetData, { id: rowData.path });
      if (rowDataset && rowDataset['origin'] && !!rowDataset['origin'].parsed) {
        actions.push({
          id: rowData.name,
          name: T('Promote Dataset'),
          label: T("Promote Dataset"),
          onClick: (row1) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.path]).subscribe((wsResp) => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService.Info(T("Promote Dataset"), T("Successfully Promoted ") + row1.path).subscribe((infoResult) => {
                this.parentVolumesListComponent.repaintMe();
              });
            }, (res) => {
              this.loader.close();
              this.dialogService.errorReport(T("Error Promoting dataset ") + row1.path, res.reason, res.stack);
            });
          }
        });
      }
    }
    return actions;
  }

  updater(parent: any) {
    parent.recursiveIsChecked = !parent.recursiveIsChecked;
    parent.ws.call('vmware.dataset_has_vms',[parent.title, parent.recursiveIsChecked]).subscribe((vmware_res)=>{
      parent.vmware_res_status = vmware_res;
      _.find(parent.dialogConf.fieldConfig, {name : "vmware_sync"})['isHidden'] = !parent.vmware_res_status;
    })
  }

  getTimestamp() {
    let dateTime = new Date();
    return moment(dateTime).format("YYYY-MM-DD_hh-mm");
  }

  dataHandler(data: any): TreeNode {
    const node: TreeNode = {};
    node.data = data;
    this.getMoreDatasetInfo(data);
    node.data.actions = this.getActions(data);

    node.children = [];

    if (data.children) {
      for (let i = 0; i < data.children.length; i++) {
        node.children.push(this.dataHandler(data.children[i]));
      }
    }
    delete node.data.children;
    return node;
  }

  getMoreDatasetInfo(dataObj) {
    const dataset_data2 = this.datasetData;
    this.translate.get(T("Inherits")).subscribe(inherits => {
      for (const k in dataset_data2) {
        if (dataset_data2[k].id === dataObj.path) {
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
  conf: InputTableConf = new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.storage, {}, this.messageService);

  actionComponent = {
    getActions: (row) => {
      return this.conf.getActions(row);
    },
    conf: new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.storage, {}, this.messageService)
  };

  actionEncryptedComponent = {
    getActions: (row) => {
      return (<VolumesListTableConfig>this.conf).getEncryptedActions(row);
    },
    conf: new VolumesListTableConfig(this, this.router, "", "Pools", {}, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.storage, {}, this.messageService)
  };

  expanded = false;
  public paintMe = true;
  public isFooterConsoleOpen: boolean;
  public systemdatasetPool: any;

  constructor(protected core: CoreService ,protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialogService: DialogService, protected loader: AppLoaderService,
    protected mdDialog: MatDialog, protected erdService: ErdService, protected translate: TranslateService,
    public sorter: StorageService, protected job: JobService, protected storage: StorageService, protected pref: PreferencesService, protected messageService: MessageService) {
    super(core, rest, router, ws, _eRef, dialogService, loader, erdService, translate, sorter, job, pref, mdDialog);
  }

  public repaintMe() {
    this.showDefaults = false;
    this.paintMe = false;
    this.ngOnInit();
  }

  ngOnInit(): void {
    this.showSpinner = true;

    while (this.zfsPoolRows.length > 0) {
      this.zfsPoolRows.pop();
    }

    Observable
    .zip(this.ws.call('pool.dataset.query', []), this.rest.get("storage/volume", {})).subscribe(res => {
      const datasetData = res[0];
      if (res[1] && res[1].data) {
      const volumeData = res[1].data;
        for (let i = 0; i < volumeData.length; i++) {
          const volume = volumeData[i];
          volume.volumesListTableConfig = new VolumesListTableConfig(this, this.router, volume.id, volume.name, datasetData, this.mdDialog, this.rest, this.ws, this.dialogService, this.loader, this.translate, this.storage, volume, this.messageService);
          volume.type = 'zpool';

          if (volume.children && volume.children[0]) {
            try {
              volume.availStr = (<any>window).filesize(volume.children[0].avail, { standard: "iec" });
            } catch (error) {
              volume.availStr = "" + volume.children[0].avail;
            }

            try {
              let used_pct =  volume.children[0].used / (volume.children[0].used + volume.children[0].avail);
              volume.usedStr = ": " + (<any>window).filesize(volume.children[0].used, { standard: "iec" }) + " (" + Math.round(used_pct * 100) + "%)";
            } catch (error) {
              volume.usedStr = "" + volume.children[0].used;
            }
          }

          this.zfsPoolRows.push(volume);
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

    this.ws.call('systemdataset.config').subscribe((res) => {
      this.systemdatasetPool = res.pool;
    })
  }
}
