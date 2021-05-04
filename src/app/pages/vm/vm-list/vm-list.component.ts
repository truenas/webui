import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { ProductType } from '../../../enums/product-type.enum';

import {
  WebSocketService, StorageService, AppLoaderService, DialogService, RestService, VmService, NetworkService,
} from '../../../services';
import { ModalService } from 'app/services/modal.service';
import { MessageService } from '../../common/entity/entity-form/services/message.service';
import { TranslateService } from '@ngx-translate/core';
import { PreferencesService } from 'app/core/services/preferences.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog } from '@angular/material/dialog';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { T } from '../../../translate-marker';
import globalHelptext from '../../../helptext/global-helptext';
import helptext from '../../../helptext/vm/vm-list';
import wizardHelptext from '../../../helptext/vm/vm-wizard/vm-wizard';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { VMWizardComponent } from '../vm-wizard/vm-wizard.component';
import { Validators } from '@angular/forms';
import { ServiceStatus } from 'app/enums/service-status.enum';

@Component({
  selector: 'vm-list',
  template: `
    <div class="vm-summary">
        <p *ngIf="availMem"><strong>{{memTitle | translate}}</strong> {{availMem}} - {{memWarning | translate}}</p>
    </div>
    <entity-table [title]='title' [conf]='this'></entity-table>`,
  styleUrls: ['./vm-list.component.css'],
  providers: [VmService, MessageService],
})
export class VMListComponent implements OnDestroy {
  title = 'Virtual Machines';
  protected queryCall: 'vm.query' = 'vm.query';
  protected wsDelete: 'vm.delete' = 'vm.delete';
  protected route_add: string[] = ['vm', 'wizard'];
  protected route_edit: string[] = ['vm', 'edit'];
  protected dialogRef: any;
  private eventSubscription: Subscription;
  private productType = window.localStorage.getItem('product_type') as ProductType;
  protected addComponent: VMWizardComponent;

  entityList: any;
  columns: any[] = [
    { name: T('Name'), prop: 'name', always_display: true },
    {
      name: T('State'), prop: 'state', always_display: true, toggle: true,
    },
    { name: T('Autostart'), prop: 'autostart', checkbox: true },
    { name: T('Virtual CPUs'), prop: 'vcpus', hidden: true },
    { name: T('Cores'), prop: 'cores', hidden: true },
    { name: T('Threads'), prop: 'threads', hidden: true },
    { name: T('Memory Size'), prop: 'memory', hidden: true },
    { name: T('Boot Loader Type'), prop: 'bootloader', hidden: true },
    { name: T('System Clock'), prop: 'time', hidden: true },
    { name: T('Display Port'), prop: 'port', hidden: true },
    { name: T('Description'), prop: 'description', hidden: true },
    { name: T('Shutdown Timeout'), prop: 'shutdown_timeout', hidden: true },
  ];
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Name',
      key_props: ['name'],
    },
  };

  protected wsMethods: { [name: string]: ApiMethod } = {
    start: 'vm.start',
    restart: 'vm.restart',
    stop: 'vm.stop',
    poweroff: 'vm.poweroff',
    update: 'vm.update',
    clone: 'vm.clone',
    getAvailableMemory: 'vm.get_available_memory',
  };

  availMem: string;
  memTitle = wizardHelptext.vm_mem_title;
  memWarning = wizardHelptext.memory_warning;

  constructor(
    private ws: WebSocketService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private router: Router, protected dialog: MatDialog,
    private http: HttpClient, private modalService: ModalService, private rest: RestService,
    private vmService: VmService, private networkService: NetworkService,
    private messageService: MessageService, private prefService: PreferencesService,
    private translate: TranslateService,
  ) {
    if (this.productType !== ProductType.Scale) {
      this.columns.push({ name: T('Com Port'), prop: 'com_port', hidden: true });
    }
  }

  ngOnInit() {
    this.refreshVMWizard();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshVMWizard();
    });

    this.modalService.onClose$.subscribe(
      (res) => {
        this.entityList.getData();
      },
    );
  }

  refreshVMWizard() {
    this.addComponent = new VMWizardComponent(this.rest, this.ws, this.vmService, this.networkService, this.loader,
      this.dialog, this.messageService, this.dialogService, this.storageService, this.prefService,
      this.translate, this.modalService);
  }

  afterInit(entityList: any) {
    this.checkMemory();
    this.entityList = entityList;
    this.eventSubscription = this.ws.subscribe('vm.query').subscribe((event) => {
      const changedRow = (this.entityList.rows as any[]).find((o) => o.id === event.id);
      if (event.fields.state === ServiceStatus.Running) {
        changedRow.state = ServiceStatus.Running;
        changedRow.status.state = ServiceStatus.Running;
        changedRow.status.domain_state = event.fields.state;
      } else {
        changedRow.state = ServiceStatus.Stopped;
        changedRow.status.state = ServiceStatus.Stopped;
        changedRow.status.domain_state = event.fields.state;
      }
    });
  }

  resourceTransformIncomingRestData(vms: any[]) {
    for (let vm_index = 0; vm_index < vms.length; vm_index++) {
      vms[vm_index]['state'] = vms[vm_index]['status']['state'];
      vms[vm_index]['com_port'] = `/dev/nmdm${vms[vm_index]['id']}B`;
      vms[vm_index]['shutdown_timeout'] += T(' seconds');
      if (this.checkDisplay(vms[vm_index])) {
        vms[vm_index]['port'] = this.displayPort(vms[vm_index]);
      } else {
        vms[vm_index]['port'] = 'N/A';
        if (vms[vm_index]['vm_type'] === 'Container Provider') {
          vms[vm_index]['vm_type'] = globalHelptext.dockerhost;
        }
      }
      vms[vm_index]['memory'] = this.storageService.convertBytestoHumanReadable(vms[vm_index]['memory'] * 1048576, 2);
    }
    return vms;
  }

  checkDisplay(vm: any) {
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (this.productType !== ProductType.Scale && (vm.bootloader === 'GRUB' || vm.bootloader === 'UEFI_CSM')) {
      return false;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices && devices[i].dtype === 'DISPLAY') {
        return true;
      }
    }
  }

  displayPort(vm: any) {
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (this.productType !== ProductType.Scale && (vm.bootloader === 'GRUB' || vm.bootloader === 'UEFI_CSM')) {
      return false;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices && devices[i].dtype === 'DISPLAY') {
        return devices[i].attributes.port;
      }
    }
  }

  onSliderChange(row: any) {
    let method: ApiMethod;
    if (row['status']['state'] === ServiceStatus.Running) {
      method = this.wsMethods.stop;
      const parent = this;
      const stopDialog: DialogFormConfiguration = {
        title: T('Stop ' + row.name + '?'),
        fieldConfig: [
          {
            type: 'checkbox',
            name: 'force_after_timeout',
            placeholder: T('Force Stop After Timeout'),
            tooltip: T('Force the VM to stop if it has not already \
 stopped within the specified shutdown timeout. Without this option selected, the VM will \
 receive the shutdown signal, but may or may not complete the shutdown process.'),
          },
        ],
        saveButtonText: T('Stop'),
        customSubmit(entityDialog: EntityDialogComponent) {
          entityDialog.dialogRef.close(true);
          const forceValue = false; // We are not exposing this in the UI
          const forceValueTimeout = !!entityDialog.formValue.force_after_timeout;
          const params = [row.id, { force: forceValue, force_after_timeout: forceValueTimeout }];
          parent.doRowAction(row, method, params);
        },
      };
      this.dialogService.dialogForm(stopDialog);
    } else {
      method = this.wsMethods.start;
      this.doRowAction(row, method);
    }
  }

  onMemoryError(row: any) {
    const memoryDialog = this.dialogService.confirm(
      helptext.memory_dialog.title,
      helptext.memory_dialog.message,
      true,
      helptext.memory_dialog.buttonMsg,
      true,
      helptext.memory_dialog.secondaryCheckBoxMsg,
      undefined,
      [{ overcommit: false }],
      helptext.memory_dialog.tooltip,
    );

    memoryDialog.componentInstance.switchSelectionEmitter.subscribe(() => {
      memoryDialog.componentInstance.isSubmitEnabled = !memoryDialog.componentInstance.isSubmitEnabled;
    });

    memoryDialog.afterClosed().subscribe((dialogRes: boolean) => {
      if (dialogRes) {
        this.doRowAction(row, this.wsMethods.start, [row.id, { overcommit: true }]);
      }
    });
  }

  doRowAction(row: any, method: ApiMethod, params = [row.id], updateTable = false) {
    if (method === 'vm.stop') {
      this.dialogRef = this.dialog.open(EntityJobComponent,
        { data: { title: T('Stopping ' + row.name) }, disableClose: false });
      this.dialogRef.componentInstance.setCall(method, [params[0], params[1]]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.subscribe(() => {
        if (updateTable) {
          this.entityList.getData();
        } else {
          this.updateRows([row]);
        }
        this.dialogRef.close(false);
        this.dialogService.Info(T('Finished'), T('If ' + row.name + T(' is still running, \
 the Guest OS did not respond as expected. It is possible to use <i>Power Off</i> or the <i>Force Stop \
 After Timeout</i> option to stop the VM.')), '450px', 'info', true);
        this.checkMemory();
      });
      this.dialogRef.componentInstance.failure.subscribe((err: any) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
    } else {
      this.loader.open();
      this.ws.call(method, params).subscribe(
        (res) => {
          if (updateTable) {
            this.entityList.getData();
            this.loader.close();
          } else {
            this.updateRows([row]).then(() => {
              this.loader.close();
            });
          }
          this.checkMemory();
        },
        (err) => {
          this.loader.close();
          if (method === this.wsMethods.start && err.error === 12) {
            this.onMemoryError(row);
            return;
          } if (method === this.wsMethods.update) {
            row.autostart = !row.autostart;
          }
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
    }
  }

  updateRows(rows: any[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ws.call(this.queryCall).subscribe(
        (res: any[]) => {
          for (const row of rows) {
            const targetIndex = _.findIndex(res, (o) => o['id'] === row.id);
            if (targetIndex === -1) {
              reject(false);
            }
            for (const i in row) {
              row[i] = res[targetIndex][i];
            }
          }
          this.resourceTransformIncomingRestData(rows);
          resolve(true);
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
          reject(err);
        },
      );
    });
  }

  onCheckboxChange(row: any) {
    row.autostart = !row.autostart;
    this.doRowAction(row, this.wsMethods.update, [row.id, { autostart: row.autostart }]);
  }

  getActions(row: any) {
    return [{
      id: 'START',
      icon: 'play_arrow',
      label: T('Start'),
      onClick: (start_row: any) => {
        this.onSliderChange(start_row);
      },
    },
    {
      id: 'RESTART',
      icon: 'replay',
      label: T('Restart'),
      onClick: (restart_row: any) => {
        this.doRowAction(restart_row, this.wsMethods.restart);
      },
    },
    {
      id: 'POWER_OFF',
      icon: 'power_settings_new',
      label: T('Power Off'),
      onClick: (power_off_row: any) => {
        this.doRowAction(row, this.wsMethods.poweroff, [power_off_row.id]);
      },
    },
    {
      id: 'STOP',
      icon: 'stop',
      label: T('Stop'),
      onClick: (stop_row: any) => {
        this.onSliderChange(stop_row);
      },
    },
    {
      id: 'EDIT',
      icon: 'edit',
      label: T('Edit'),
      onClick: (edit_row: any) => {
        this.router.navigate(new Array('').concat(['vm', 'edit', edit_row.id]));
      },
    },
    {
      id: 'DELETE',
      icon: 'delete',
      label: T('Delete'),
      onClick: (delete_row: any) => {
        const parent = this;
        const conf: DialogFormConfiguration = {
          title: T('Delete Virtual Machine'),
          fieldConfig: [
            {
              type: 'checkbox',
              name: 'zvols',
              placeholder: T('Delete Virtual Machine Data?'),
              value: false,
              tooltip: T('Set to remove the data associated with this \
 Virtual Machine (which will result in data loss if the data is not backed up). Unset to \
 leave the data intact.'),
            },
            {
              type: 'checkbox',
              name: 'force',
              placeholder: T('Force Delete?'),
              value: false,
              tooltip: T('Set to ignore the Virtual \
 Machine status during the delete operation. Unset to prevent deleting \
 the Virtual Machine when it is still active or has an undefined state.'),
            },
            {
              type: 'input',
              name: 'confirm_name',
              placeholder: '',
              maskValue: delete_row.name,
              required: true,
              validation: [regexValidator(new RegExp(delete_row.name))],
              hideErrMsg: true,
            },
          ],
          saveButtonText: T('Delete'),
          customSubmit(entityDialog: EntityDialogComponent) {
            entityDialog.dialogRef.close(true);
            const params = [
              delete_row.id,
              {
                zvols: entityDialog.formValue.zvols,
                force: entityDialog.formValue.force,
              },
            ];
            parent.doRowAction(delete_row, parent.wsDelete, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DEVICES',
      icon: 'device_hub',
      label: T('Devices'),
      onClick: (devices_row: any) => {
        this.router.navigate(new Array('').concat(['vm', devices_row.id, 'devices', devices_row.name]));
      },
    },
    {
      id: 'CLONE',
      icon: 'filter_none',
      label: T('Clone'),
      onClick: (clone_row: any) => {
        const parent = this;
        const conf: DialogFormConfiguration = {
          title: T('Name'),
          fieldConfig: [
            {
              type: 'input',
              inputType: 'text',
              name: 'name',
              placeholder: T('Enter a Name (optional)'),
              required: false,
            },
          ],
          saveButtonText: T('Clone'),
          customSubmit(entityDialog: EntityDialogComponent) {
            entityDialog.dialogRef.close(true);
            const params = [clone_row.id];
            if (entityDialog.formValue.name) {
              params.push(entityDialog.formValue.name);
            }
            parent.doRowAction(clone_row, parent.wsMethods.clone, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DISPLAY',
      icon: 'settings_ethernet',
      label: T('Display'),
      onClick: (display_vm: any) => {
        this.loader.open();
        this.ws.call('vm.get_display_devices', [display_vm.id]).subscribe((res: any[]) => {
          this.loader.close();
          const conf: DialogFormConfiguration = {
            title: T('Pick a display device to open'),
            fieldConfig: [{
              type: 'radio',
              name: 'display_device',
              placeholder: T('Display Device'),
              options: res.map((d) => ({ label: d.attributes.type, value: d.id })),
              validation: [Validators.required],
            }],
            saveButtonText: 'Open',
            parent: this,
            customSubmit: (entityDialog: EntityDialogComponent) => {
              const display_device = _.find(res, { id: entityDialog.formValue.display_device });
              if (display_device.attributes.password_configured) {
                const pass_conf: DialogFormConfiguration = {
                  title: T('Enter password'),
                  message: T('Enter password to unlock this display device'),
                  fieldConfig: [{
                    type: 'input',
                    name: 'password',
                    inputType: 'password',
                    placeholder: T('Password'),
                    validation: [Validators.required],
                  }],
                  saveButtonText: T('Open'),
                  parent: this,
                  customSubmit: (passDialog: any) => {
                    this.loader.open();
                    this.ws.call('vm.get_display_web_uri', [display_device.id, passDialog.formValue.password]).subscribe((res) => {
                      this.loader.close();
                      window.open(res[0], '_blank');
                    }, (err) => {
                      this.loader.close();
                      new EntityUtils().handleError(this, err);
                    });
                  },
                };
                this.dialogService.dialogForm(pass_conf);
              } else {
                this.loader.open();
                this.ws.call('vm.get_display_web_uri', [display_device.id]).subscribe((res) => {
                  this.loader.close();
                  window.open(res[0], '_blank');
                }, (err) => {
                  this.loader.close();
                  new EntityUtils().handleError(this, err);
                });
              }
              entityDialog.dialogRef.close();
            },
          };
          this.dialogService.dialogForm(conf);
        }, (err) => {
          this.loader.close();
          new EntityUtils().handleError(this, err);
        });
      },
    },
    {
      id: 'SERIAL',
      icon: 'keyboard_arrow_right',
      label: T('Serial'),
      onClick: (vm: any) => {
        this.router.navigate(new Array('').concat(['vm', 'serial', vm.id]));
      },
    },
    {
      id: 'LOGS',
      icon: 'content_paste',
      label: T('Download Logs'),
      onClick: (vm: any) => {
        const path = `/var/log/libvirt/bhyve/${vm.id}_${vm.name}.log`;
        const filename = `${vm.id}_${vm.name}.log`;
        this.ws.call('core.download', ['filesystem.get', [path], filename]).subscribe(
          (download_res) => {
            const url = download_res[1];
            const mimetype = 'text/plain';
            this.storageService.streamDownloadFile(this.http, url, filename, mimetype).subscribe((file) => {
              this.storageService.downloadBlob(file, filename);
            }, (err) => {
              new EntityUtils().handleWSError(this, err, this.dialogService);
            });
          },
          (err) => {
            new EntityUtils().handleWSError(this, err, this.dialogService);
          },
        );
      },
    }];
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'DISPLAY' && (row['status']['state'] !== ServiceStatus.Running || !this.checkDisplay(row))) {
      return false;
    } if ((actionId === 'POWER_OFF' || actionId === 'STOP' || actionId === 'RESTART'
            || actionId === 'SERIAL') && row['status']['state'] !== ServiceStatus.Running) {
      return false;
    } if (actionId === 'START' && row['status']['state'] === ServiceStatus.Running) {
      return false;
    }
    return true;
  }

  checkMemory() {
    this.ws.call(this.wsMethods.getAvailableMemory).subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    });
  }

  ngOnDestroy() {
    this.eventSubscription.unsubscribe();
  }

  doAdd() {
    this.modalService.open('slide-in-form', this.addComponent);
  }
}
