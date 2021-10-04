import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { VmBootloader, VmDeviceType } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/vm/vm-list';
import wizardHelptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayAttributes, VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { VirtualMachineRow } from 'app/pages/vm/vm-list/virtual-machine-row.interface';
import {
  WebSocketService, StorageService, AppLoaderService, DialogService, VmService, NetworkService, SystemGeneralService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { VMWizardComponent } from '../vm-wizard/vm-wizard.component';

@UntilDestroy()
@Component({
  selector: 'vm-list',
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
  providers: [VmService, MessageService],
})
export class VMListComponent implements EntityTableConfig<VirtualMachineRow>, OnInit {
  title = T('Virtual Machines');
  queryCall: 'vm.query' = 'vm.query';
  wsDelete: 'vm.delete' = 'vm.delete';
  route_add: string[] = ['vm', 'wizard'];
  route_edit: string[] = ['vm', 'edit'];
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  private productType = window.localStorage.getItem('product_type') as ProductType;
  hasVirtualizationSupport = false;
  disableActionsConfig = true;

  entityList: EntityTableComponent<VirtualMachineRow>;
  columns = [
    { name: T('Name') as string, prop: 'name', always_display: true },
    {
      name: T('State') as string, prop: 'state', always_display: true, toggle: true,
    },
    { name: T('Autostart') as string, prop: 'autostart', checkbox: true },
    { name: T('Virtual CPUs') as string, prop: 'vcpus', hidden: true },
    { name: T('Cores') as string, prop: 'cores', hidden: true },
    { name: T('Threads') as string, prop: 'threads', hidden: true },
    { name: T('Memory Size') as string, prop: 'memory', hidden: true },
    { name: T('Boot Loader Type') as string, prop: 'bootloader', hidden: true },
    { name: T('System Clock') as string, prop: 'time', hidden: true },
    { name: T('Display Port') as string, prop: 'port', hidden: true },
    { name: T('Description') as string, prop: 'description', hidden: true },
    { name: T('Shutdown Timeout') as string, prop: 'shutdown_timeout', hidden: true },
  ];
  config = {
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
    private router: Router,
    protected dialog: MatDialog,
    private http: HttpClient,
    private modalService: ModalService,
    private vmService: VmService,
    private networkService: NetworkService,
    private messageService: MessageService,
    private prefService: PreferencesService,
    private translate: TranslateService,
    private systemGeneralService: SystemGeneralService,
  ) {
    if (this.productType !== ProductType.Scale) {
      // TODO: Check if it can be removed
      this.columns.push({ name: T('Com Port'), prop: 'com_port', hidden: true });
    }
  }

  ngOnInit(): void {
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(
      () => {
        this.entityList.getData();
      },
    );
  }

  afterInit(entityList: EntityTableComponent): void {
    this.checkMemory();
    this.entityList = entityList;

    this.vmService.getVirtualizationDetails().pipe(untilDestroyed(this)).subscribe((virtualization) => {
      this.hasVirtualizationSupport = virtualization.supported;
      this.disableActionsConfig = !virtualization.supported;
      if (!this.hasVirtualizationSupport) {
        this.entityList.emptyTableConf = {
          large: true,
          icon: 'laptop',
          title: this.translate.instant('Virtualization is not supported'),
          message: virtualization.error.replace('INFO: ', ''),
          button: null,
        };
      }
    }, () => {
      /* fallback when endpoint is unavailable */
      this.disableActionsConfig = false;
    });

    this.ws.subscribe('vm.query').pipe(untilDestroyed(this)).subscribe((event) => {
      const changedRow = this.entityList.rows.find((o) => o.id === event.id);
      if (event.fields.status.state === ServiceStatus.Running) {
        changedRow.state = ServiceStatus.Running;
        changedRow.status.state = event.fields.status.state;
        changedRow.status.domain_state = event.fields.status.domain_state;
      } else {
        changedRow.state = ServiceStatus.Stopped;
        changedRow.status.state = event.fields.status.state;
        changedRow.status.domain_state = event.fields.status.domain_state;
      }
    });
  }

  resourceTransformIncomingRestData(vms: VirtualMachine[]): VirtualMachineRow[] {
    return vms.map((vm) => {
      const transformed = {
        ...vm,
        state: vm.status.state,
        com_port: `/dev/nmdm${vm.id}B`,
        shutdown_timeout: `${vm.shutdown_timeout} seconds`,
        memory: this.storageService.convertBytestoHumanReadable(vm.memory * 1048576, 2),
      } as VirtualMachineRow;

      if (this.checkDisplay(vm)) {
        transformed.port = this.displayPort(vm);
      } else {
        transformed.port = 'N/A';
        if (transformed.vm_type === 'Container Provider') {
          transformed.vm_type = globalHelptext.dockerhost;
        }
      }

      return transformed;
    });
  }

  checkDisplay(vm: VirtualMachine | VirtualMachineRow): boolean {
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (this.productType !== ProductType.Scale && ([VmBootloader.Grub, VmBootloader.UefiCsm].includes(vm.bootloader))) {
      return false;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices && devices[i].dtype === VmDeviceType.Display) {
        return true;
      }
    }
  }

  displayPort(vm: VirtualMachine): boolean | number {
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (this.productType !== ProductType.Scale && ([VmBootloader.Grub, VmBootloader.UefiCsm].includes(vm.bootloader))) {
      return false;
    }
    for (let i = 0; i < devices.length; i++) {
      if (devices && devices[i].dtype === VmDeviceType.Display) {
        return (devices[i].attributes as VmDisplayAttributes).port;
      }
    }
  }

  onSliderChange(row: VirtualMachineRow): void {
    let method: ApiMethod;
    if (row['status']['state'] === ServiceStatus.Running) {
      method = this.wsMethods.stop;
      const stopDialog: DialogFormConfiguration = {
        title: this.translate.instant('Stop {vmName}?', { vmName: row.name }),
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
        customSubmit: (entityDialog: EntityDialogComponent) => {
          entityDialog.dialogRef.close(true);
          const forceValue = false; // We are not exposing this in the UI
          const forceValueTimeout = !!entityDialog.formValue.force_after_timeout;
          const params = [row.id, { force: forceValue, force_after_timeout: forceValueTimeout }];
          this.doRowAction(row, method, params);
        },
      };
      this.dialogService.dialogForm(stopDialog);
    } else {
      method = this.wsMethods.start;
      this.doRowAction(row, method);
    }
  }

  onMemoryError(row: VirtualMachineRow): void {
    const memoryDialog = this.dialogService.confirm({
      title: helptext.memory_dialog.title,
      message: helptext.memory_dialog.message,
      hideCheckBox: true,
      buttonMsg: helptext.memory_dialog.buttonMsg,
      secondaryCheckBox: true,
      secondaryCheckBoxMsg: helptext.memory_dialog.secondaryCheckBoxMsg,
      data: [{ overcommit: false }],
      tooltip: helptext.memory_dialog.tooltip,
    });

    memoryDialog.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe(() => {
      memoryDialog.componentInstance.isSubmitEnabled = !memoryDialog.componentInstance.isSubmitEnabled;
    });

    memoryDialog.afterClosed().pipe(untilDestroyed(this)).subscribe((dialogRes: boolean) => {
      if (dialogRes) {
        this.doRowAction(row, this.wsMethods.start, [row.id, { overcommit: true }]);
      }
    });
  }

  extractHostname(url: string): string {
    let hostname: string;
    if (url.indexOf('//') > -1) {
      hostname = url.split('/')[2];
    } else {
      hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];

    return hostname;
  }

  doRowAction(row: VirtualMachineRow, method: ApiMethod, params: any[] = [row.id], updateTable = false): void {
    if (method === 'vm.stop') {
      this.dialogRef = this.dialog.open(EntityJobComponent,
        { data: { title: this.translate.instant('Stopping {rowName}', { rowName: row.name }) } });
      this.dialogRef.componentInstance.setCall(method, [params[0], params[1]]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        if (updateTable) {
          this.entityList.getData();
        } else {
          this.updateRows([row]);
        }
        this.dialogRef.close(false);
        this.dialogService.info(
          T('Finished'),
          this.translate.instant('If {vmName} is still running, the Guest OS did not respond as expected. It is possible to use <i>Power Off</i> or the <i>Force Stop After Timeout</i> option to stop the VM.', { vmName: row.name }),
          '450px',
          'info',
          true,
        );
        this.checkMemory();
      });
      this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
    } else {
      this.loader.open();
      this.ws.call(method, params).pipe(untilDestroyed(this)).subscribe(
        () => {
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

  updateRows(rows: VirtualMachineRow[]): Promise<VirtualMachineRow[]> {
    return new Promise((resolve, reject) => {
      this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          rows = this.resourceTransformIncomingRestData(res);
          resolve(rows);
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
          reject(err);
        },
      );
    });
  }

  onCheckboxChange(row: VirtualMachineRow): void {
    this.doRowAction(row, this.wsMethods.update, [row.id, { autostart: row.autostart }]);
  }

  getActions(row: VirtualMachineRow): EntityTableAction[] {
    return [{
      id: 'START',
      icon: 'play_arrow',
      label: T('Start'),
      onClick: (start_row: VirtualMachineRow) => {
        this.onSliderChange(start_row);
      },
    },
    {
      id: 'RESTART',
      icon: 'replay',
      label: T('Restart'),
      onClick: (restart_row: VirtualMachineRow) => {
        this.doRowAction(restart_row, this.wsMethods.restart);
      },
    },
    {
      id: 'POWER_OFF',
      icon: 'power_settings_new',
      label: T('Power Off'),
      onClick: (power_off_row: VirtualMachineRow) => {
        this.doRowAction(row, this.wsMethods.poweroff, [power_off_row.id]);
      },
    },
    {
      id: 'STOP',
      icon: 'stop',
      label: T('Stop'),
      onClick: (stop_row: VirtualMachineRow) => {
        this.onSliderChange(stop_row);
      },
    },
    {
      id: 'EDIT',
      icon: 'edit',
      label: T('Edit'),
      onClick: (edit_row: VirtualMachineRow) => {
        this.router.navigate(new Array('').concat(['vm', 'edit', String(edit_row.id)]));
      },
    },
    {
      id: 'DELETE',
      icon: 'delete',
      label: T('Delete'),
      onClick: (delete_row: VirtualMachineRow) => {
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
          customSubmit: (entityDialog: EntityDialogComponent) => {
            entityDialog.dialogRef.close(true);
            const params = [
              delete_row.id,
              {
                zvols: entityDialog.formValue.zvols,
                force: entityDialog.formValue.force,
              },
            ];
            this.doRowAction(delete_row, this.wsDelete, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DEVICES',
      icon: 'device_hub',
      label: T('Devices'),
      onClick: (devices_row: VirtualMachineRow) => {
        this.router.navigate(new Array('').concat(['vm', String(devices_row.id), 'devices', devices_row.name]));
      },
    },
    {
      id: 'CLONE',
      icon: 'filter_none',
      label: T('Clone'),
      onClick: (clone_row: VirtualMachineRow) => {
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
          customSubmit: (entityDialog: EntityDialogComponent) => {
            entityDialog.dialogRef.close(true);
            const params = [clone_row.id];
            if (entityDialog.formValue.name) {
              params.push(entityDialog.formValue.name);
            }
            this.doRowAction(clone_row, this.wsMethods.clone, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DISPLAY',
      icon: 'settings_ethernet',
      label: T('Display'),
      onClick: (display_vm: VirtualMachineRow) => {
        this.loader.open();
        this.ws.call('vm.get_display_devices', [display_vm.id]).pipe(untilDestroyed(this)).subscribe((display_devices_res) => {
          if (display_devices_res.length === 1) {
            if (!display_devices_res[0].attributes.password_configured) {
              this.ws.call(
                'vm.get_display_web_uri',
                [
                  display_vm.id,
                  this.extractHostname(window.origin),
                ],
              ).pipe(untilDestroyed(this)).subscribe((web_uri_res) => {
                this.loader.close();
                if (web_uri_res[display_devices_res[0].id].error) {
                  return this.dialogService.info('Error', web_uri_res[display_devices_res[0].id].error);
                }
                window.open(web_uri_res[display_devices_res[0].id].uri, '_blank');
              }, (err) => {
                this.loader.close();
                new EntityUtils().handleError(this, err);
              });
            } else {
              this.loader.close();
              const display_device = _.find(display_devices_res, { id: display_devices_res[0].id });
              this.showPasswordDialog(display_vm, display_device);
            }
          } else {
            this.loader.close();
            const conf: DialogFormConfiguration = {
              title: T('Display Device'),
              message: T('Pick a display device to open'),
              fieldConfig: [{
                type: 'radio',
                name: 'display_device',
                options: display_devices_res.map((d) => ({ label: d.attributes.type, value: d.id })),
                validation: [Validators.required],
              }],
              saveButtonText: T('Open'),
              parent: this,
              customSubmit: (entityDialog: EntityDialogComponent) => {
                const display_device = _.find(display_devices_res, { id: entityDialog.formValue.display_device });
                if (display_device.attributes.password_configured) {
                  this.showPasswordDialog(display_vm, display_device);
                } else {
                  this.loader.open();
                  this.ws.call(
                    'vm.get_display_web_uri',
                    [
                      display_vm.id,
                      this.extractHostname(window.origin),
                    ],
                  ).pipe(untilDestroyed(this)).subscribe((web_uris_res) => {
                    this.loader.close();
                    if (web_uris_res[display_device.id].error) {
                      return this.dialogService.info('Error', web_uris_res[display_device.id].error);
                    }
                    window.open(web_uris_res[display_device.id].uri, '_blank');
                  }, (err) => {
                    this.loader.close();
                    new EntityUtils().handleError(this, err);
                  });
                }
                entityDialog.dialogRef.close();
              },
            };
            this.dialogService.dialogForm(conf);
          }
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
      onClick: (vm: VirtualMachineRow) => {
        this.router.navigate(new Array('').concat(['vm', 'serial', String(vm.id)]));
      },
    },
    {
      id: 'LOGS',
      icon: 'content_paste',
      label: T('Download Logs'),
      onClick: (vm: VirtualMachineRow) => {
        const path = `/var/log/libvirt/bhyve/${vm.id}_${vm.name}.log`;
        const filename = `${vm.id}_${vm.name}.log`;
        this.ws.call('core.download', ['filesystem.get', [path], filename]).pipe(untilDestroyed(this)).subscribe(
          (download_res) => {
            const url = download_res[1];
            const mimetype = 'text/plain';
            this.storageService.streamDownloadFile(this.http, url, filename, mimetype)
              .pipe(untilDestroyed(this))
              .subscribe((file) => {
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
    }] as EntityTableAction[];
  }

  showPasswordDialog(display_vm: VirtualMachineRow, display_device: VmDisplayDevice): void {
    const pass_conf: DialogFormConfiguration = {
      title: T('Enter password'),
      message: T('Enter password to unlock this display device'),
      fieldConfig: [{
        type: 'input',
        name: 'password',
        togglePw: true,
        inputType: 'password',
        placeholder: T('Password'),
        validation: [Validators.required],
      }],
      saveButtonText: T('Open'),
      parent: this,
      customSubmit: (passDialog: EntityDialogComponent) => {
        this.loader.open();
        this.ws.call(
          'vm.get_display_web_uri',
          [
            display_vm.id,
            this.extractHostname(window.origin),
            {
              devices_passwords: [
                {
                  device_id: display_device.id,
                  password: passDialog.formValue.password,
                },
              ],
            },
          ],
        ).pipe(untilDestroyed(this)).subscribe((pass_res) => {
          this.loader.close();
          if (pass_res[display_device.id].error) {
            passDialog.formGroup.controls['password'].reset();
            return pass_conf.fieldConfig[0].warnings = pass_res[display_device.id].error;
          }
          passDialog.dialogRef.close();
          window.open(pass_res[display_device.id].uri, '_blank');
        }, (err) => {
          passDialog.dialogRef.close();
          this.loader.close();
          new EntityUtils().handleError(this, err);
        });
      },
    };
    this.dialogService.dialogForm(pass_conf);
  }

  isActionVisible(actionId: string, row: VirtualMachineRow): boolean {
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

  checkMemory(): void {
    this.ws.call(this.wsMethods.getAvailableMemory).pipe(untilDestroyed(this)).subscribe((res) => {
      this.availMem = this.storageService.convertBytestoHumanReadable(res);
    });
  }

  doAdd(): void {
    this.modalService.openInSlideIn(VMWizardComponent);
  }
}
