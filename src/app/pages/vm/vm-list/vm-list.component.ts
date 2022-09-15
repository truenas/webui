import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { switchMap } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { VmBootloader, VmDeviceType } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/vm/vm-list';
import wizardHelptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { VirtualizationDetails, VirtualMachine, VmStopParams } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EmptyType, EmptyConfig } from 'app/modules/entity/entity-empty/entity-empty.component';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { regexValidator } from 'app/modules/entity/entity-form/validators/regex-validation';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { VirtualMachineRow } from 'app/pages/vm/vm-list/virtual-machine-row.interface';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import {
  WebSocketService, StorageService, AppLoaderService, DialogService, VmService, SystemGeneralService,
} from 'app/services';
import { LayoutService } from 'app/services/layout.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
  providers: [VmService, MessageService],
})
export class VmListComponent implements EntityTableConfig<VirtualMachineRow>, OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  title = this.translate.instant('Virtual Machines');
  queryCall = 'vm.query' as const;
  wsDelete = 'vm.delete' as const;
  routeAdd: string[] = ['vm', 'wizard'];
  routeEdit: string[] = ['vm', 'edit'];
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  private productType = this.systemGeneralService.getProductType();
  hasVirtualizationSupport = false;
  disableActionsConfig = true;
  virtualizationDetails: VirtualizationDetails = null;
  canAdd = false;

  entityList: EntityTableComponent<VirtualMachineRow>;
  columns = [
    { name: this.translate.instant('Name') as string, prop: 'name', always_display: true },
    {
      name: this.translate.instant('State') as string, prop: 'state', always_display: true, toggle: true,
    },
    {
      name: this.translate.instant('Autostart') as string, prop: 'autostart', checkbox: true, always_display: true,
    },
    { name: this.translate.instant('Virtual CPUs') as string, prop: 'vcpus', hidden: true },
    { name: this.translate.instant('Cores') as string, prop: 'cores', hidden: true },
    { name: this.translate.instant('Threads') as string, prop: 'threads', hidden: true },
    { name: this.translate.instant('Memory Size') as string, prop: 'memory', hidden: true },
    { name: this.translate.instant('Boot Loader Type') as string, prop: 'bootloader', hidden: true },
    { name: this.translate.instant('System Clock') as string, prop: 'time', hidden: true },
    { name: this.translate.instant('Display Port') as string, prop: 'port', hidden: true },
    { name: this.translate.instant('Description') as string, prop: 'description', hidden: true },
    { name: this.translate.instant('Shutdown Timeout') as string, prop: 'shutdown_timeout', hidden: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Name',
      key_props: ['name'],
    },
  };

  protected wsMethods = {
    start: 'vm.start',
    restart: 'vm.restart',
    stop: 'vm.stop',
    poweroff: 'vm.poweroff',
    update: 'vm.update',
    clone: 'vm.clone',
    getAvailableMemory: 'vm.get_available_memory',
  } as const;

  availableMemory: string;
  memTitle = wizardHelptext.vm_mem_title;
  memWarning = wizardHelptext.memory_warning;

  constructor(
    private ws: WebSocketService,
    private storageService: StorageService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private router: Router,
    protected dialog: MatDialog,
    private modalService: ModalService,
    private vmService: VmService,
    private translate: TranslateService,
    private layoutService: LayoutService,
    private systemGeneralService: SystemGeneralService,
  ) {}

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

    this.vmService.getVirtualizationDetails().pipe(untilDestroyed(this)).subscribe({
      next: (virtualization) => {
        this.virtualizationDetails = virtualization;
        this.hasVirtualizationSupport = virtualization.supported;
        this.canAdd = virtualization.supported;
      },
      error: () => {
        // fallback when endpoint is unavailable
        this.canAdd = true;
      },
    });

    this.ws.subscribe('vm.query').pipe(untilDestroyed(this)).subscribe((event) => {
      entityList.patchCurrentRows(
        (row: VirtualMachineRow) => row.id === event.id,
        (changedRow) => {
          if (event.fields.status.state === ServiceStatus.Running) {
            changedRow.state = ServiceStatus.Running;
            changedRow.status.state = event.fields.status.state;
            changedRow.status.domain_state = event.fields.status.domain_state;
          } else {
            changedRow.state = ServiceStatus.Stopped;
            changedRow.status.state = event.fields.status.state;
            changedRow.status.domain_state = event.fields.status.domain_state;
          }
          return changedRow;
        },
      );
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getCustomEmptyConfig(emptyType: EmptyType): EmptyConfig {
    if (!this.virtualizationDetails) {
      return null;
    }

    if (
      (emptyType === EmptyType.FirstUse || emptyType === EmptyType.NoPageData)
      && !this.virtualizationDetails.supported
    ) {
      return {
        large: true,
        icon: 'laptop',
        title: this.translate.instant('Virtualization is not supported'),
        message: this.virtualizationDetails.error.replace('INFO: ', ''),
        button: null,
      };
    }

    return null;
  }

  resourceTransformIncomingRestData(vms: VirtualMachine[]): VirtualMachineRow[] {
    return vms.map((vm) => {
      const transformed = {
        ...vm,
        state: vm.status.state,
        com_port: `/dev/nmdm${vm.id}B`,
        shutdown_timeout: `${vm.shutdown_timeout} seconds`,
        memory: this.storageService.convertBytesToHumanReadable(vm.memory * 1048576, 2),
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
    for (const device of devices) {
      if (devices && device.dtype === VmDeviceType.Display) {
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
    for (const device of devices) {
      if (devices && device.dtype === VmDeviceType.Display) {
        return (device.attributes).port;
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
            placeholder: this.translate.instant('Force Stop After Timeout'),
            tooltip: this.translate.instant('Force the VM to stop if it has not already \
 stopped within the specified shutdown timeout. Without this option selected, the VM will \
 receive the shutdown signal, but may or may not complete the shutdown process.'),
          },
        ],
        saveButtonText: this.translate.instant('Stop'),
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

  doRowAction(row: VirtualMachineRow, method: ApiMethod, params: unknown[] = [row.id], updateTable = false): void {
    if (method === this.wsMethods.stop) {
      this.dialogRef = this.dialog.open(EntityJobComponent,
        { data: { title: this.translate.instant('Stopping {rowName}', { rowName: row.name }) } });
      this.dialogRef.componentInstance.setCall(method, [params[0], params[1]] as VmStopParams);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        if (updateTable) {
          this.entityList.getData();
        } else {
          this.updateRows([row]);
        }
        this.dialogRef.close(false);
        this.dialogService.info(
          this.translate.instant('Finished'),
          this.translate.instant('If {vmName} is still running, the Guest OS did not respond as expected. It is possible to use <i>Power Off</i> or the <i>Force Stop After Timeout</i> option to stop the VM.', { vmName: row.name }),
          true,
        );
        this.checkMemory();
      });
      this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      });
    } else {
      this.loader.open();
      this.ws.call(method, params as any).pipe(untilDestroyed(this)).subscribe({
        next: () => {
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
        error: (err) => {
          this.loader.close();
          if (method === this.wsMethods.start && err.error === 12) {
            this.onMemoryError(row);
            return;
          } if (method === this.wsMethods.update) {
            row.autostart = !row.autostart;
          }
          new EntityUtils().handleWsError(this, err, this.dialogService);
        },
      });
    }
  }

  updateRows(rows: VirtualMachineRow[]): Promise<VirtualMachineRow[]> {
    return new Promise((resolve, reject) => {
      this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe({
        next: (res) => {
          rows = this.resourceTransformIncomingRestData(res);
          resolve(rows);
        },
        error: (err) => {
          new EntityUtils().handleWsError(this, err, this.dialogService);
          reject(err);
        },
      });
    });
  }

  onCheckboxChange(row: VirtualMachineRow): void {
    this.doRowAction(row, this.wsMethods.update, [row.id, { autostart: row.autostart }]);
  }

  getActions(row: VirtualMachineRow): EntityTableAction[] {
    return [{
      id: 'START',
      icon: 'play_arrow',
      label: this.translate.instant('Start'),
      onClick: (vm: VirtualMachineRow) => {
        this.onSliderChange(vm);
      },
    },
    {
      id: 'RESTART',
      icon: 'replay',
      label: this.translate.instant('Restart'),
      onClick: (vm: VirtualMachineRow) => {
        this.doRowAction(vm, this.wsMethods.restart);
      },
    },
    {
      id: 'POWER_OFF',
      icon: 'power_settings_new',
      label: this.translate.instant('Power Off'),
      onClick: (vm: VirtualMachineRow) => {
        this.doRowAction(row, this.wsMethods.poweroff, [vm.id]);
      },
    },
    {
      id: 'STOP',
      icon: 'stop',
      label: this.translate.instant('Stop'),
      onClick: (vm: VirtualMachineRow) => {
        this.onSliderChange(vm);
      },
    },
    {
      id: 'EDIT',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (vm: VirtualMachineRow) => {
        this.router.navigate(new Array('').concat(['vm', 'edit', String(vm.id)]));
      },
    },
    {
      id: 'DELETE',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (vm: VirtualMachineRow) => {
        const conf: DialogFormConfiguration = {
          title: this.translate.instant('Delete Virtual Machine'),
          fieldConfig: [
            {
              type: 'checkbox',
              name: 'zvols',
              placeholder: this.translate.instant('Delete Virtual Machine Data?'),
              value: false,
              tooltip: this.translate.instant('Set to remove the data associated with this \
 Virtual Machine (which will result in data loss if the data is not backed up). Unset to \
 leave the data intact.'),
            },
            {
              type: 'checkbox',
              name: 'force',
              placeholder: this.translate.instant('Force Delete?'),
              value: false,
              tooltip: this.translate.instant('Set to ignore the Virtual \
 Machine status during the delete operation. Unset to prevent deleting \
 the Virtual Machine when it is still active or has an undefined state.'),
            },
            {
              type: 'input',
              name: 'confirm_name',
              placeholder: '',
              maskValue: vm.name,
              required: true,
              validation: [regexValidator(new RegExp(vm.name))],
              hideErrMsg: true,
            },
          ],
          saveButtonText: this.translate.instant('Delete'),
          customSubmit: (entityDialog: EntityDialogComponent) => {
            entityDialog.dialogRef.close(true);
            const params = [
              vm.id,
              {
                zvols: entityDialog.formValue.zvols,
                force: entityDialog.formValue.force,
              },
            ];
            this.doRowAction(vm, this.wsDelete, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DEVICES',
      icon: 'device_hub',
      label: this.translate.instant('Devices'),
      onClick: (vm: VirtualMachineRow) => {
        this.router.navigate(new Array('').concat(['vm', String(vm.id), 'devices', vm.name]));
      },
    },
    {
      id: 'CLONE',
      icon: 'filter_none',
      label: this.translate.instant('Clone'),
      onClick: (vm: VirtualMachineRow) => {
        const conf: DialogFormConfiguration = {
          title: this.translate.instant('Name'),
          fieldConfig: [
            {
              type: 'input',
              inputType: 'text',
              name: 'name',
              placeholder: this.translate.instant('Enter a Name (optional)'),
              required: false,
            },
          ],
          saveButtonText: this.translate.instant('Clone'),
          customSubmit: (entityDialog: EntityDialogComponent) => {
            entityDialog.dialogRef.close(true);
            const params = [vm.id];
            if (entityDialog.formValue.name) {
              params.push(entityDialog.formValue.name);
            }
            this.doRowAction(vm, this.wsMethods.clone, params, true);
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      id: 'DISPLAY',
      icon: 'settings_ethernet',
      label: this.translate.instant('Display'),
      onClick: (vm: VirtualMachineRow) => {
        this.loader.open();
        this.ws.call('vm.get_display_devices', [vm.id]).pipe(untilDestroyed(this)).subscribe({
          next: (displayDevices) => {
            if (displayDevices.length === 1) {
              if (!displayDevices[0].attributes.password_configured) {
                this.ws.call(
                  'vm.get_display_web_uri',
                  [
                    vm.id,
                    window.location.host,
                    { protocol: window.location.protocol.replace(':', '').toUpperCase() },
                  ],
                ).pipe(untilDestroyed(this)).subscribe({
                  next: (webUris) => {
                    this.loader.close();
                    if (webUris[displayDevices[0].id].error) {
                      return this.dialogService.warn('Error', webUris[displayDevices[0].id].error);
                    }
                    window.open(webUris[displayDevices[0].id].uri, '_blank');
                  },
                  error: (err) => {
                    this.loader.close();
                    new EntityUtils().handleError(this, err);
                  },
                });
              } else {
                this.loader.close();
                const displayDevice = _.find(displayDevices, { id: displayDevices[0].id });
                this.showPasswordDialog(vm, displayDevice);
              }
            } else {
              this.loader.close();
              const conf: DialogFormConfiguration = {
                title: this.translate.instant('Display Device'),
                message: this.translate.instant('Pick a display device to open'),
                fieldConfig: [{
                  type: 'radio',
                  name: 'display_device',
                  options: displayDevices.map((device) => ({ label: device.attributes.type, value: device.id })),
                  validation: [Validators.required],
                }],
                saveButtonText: this.translate.instant('Open'),
                customSubmit: (entityDialog: EntityDialogComponent) => {
                  const displayDevice = _.find(displayDevices, { id: entityDialog.formValue.display_device });
                  if (displayDevice.attributes.password_configured) {
                    this.showPasswordDialog(vm, displayDevice);
                  } else {
                    this.loader.open();
                    this.ws.call(
                      'vm.get_display_web_uri',
                      [
                        vm.id,
                        window.location.host,
                        { protocol: window.location.protocol.replace(':', '').toUpperCase() },
                      ],
                    ).pipe(untilDestroyed(this)).subscribe({
                      next: (webUris) => {
                        this.loader.close();
                        if (webUris[displayDevice.id].error) {
                          return this.dialogService.warn('Error', webUris[displayDevice.id].error);
                        }
                        window.open(webUris[displayDevice.id].uri, '_blank');
                      },
                      error: (err) => {
                        this.loader.close();
                        new EntityUtils().handleError(this, err);
                      },
                    });
                  }
                  entityDialog.dialogRef.close();
                },
              };
              this.dialogService.dialogForm(conf);
            }
          },
          error: (err) => {
            this.loader.close();
            new EntityUtils().handleError(this, err);
          },
        });
      },
    },
    {
      id: 'SERIAL',
      icon: 'keyboard_arrow_right',
      label: this.translate.instant('Serial Shell'),
      onClick: (vm: VirtualMachineRow) => {
        this.router.navigate(new Array('').concat(['vm', 'serial', String(vm.id)]));
      },
    },
    {
      id: 'LOGS',
      icon: 'content_paste',
      label: this.translate.instant('Download Logs'),
      onClick: (vm: VirtualMachineRow) => {
        const path = `/var/log/libvirt/qemu/${vm.id}_${vm.name}.log`;
        const filename = `${vm.id}_${vm.name}.log`;
        this.ws.call('core.download', ['filesystem.get', [path], filename]).pipe(
          switchMap(([, url]) => {
            const mimetype = 'text/plain';
            return this.storageService.downloadUrl(url, filename, mimetype);
          }),
          untilDestroyed(this),
        ).subscribe({
          error: (error) => new EntityUtils().handleWsError(this, error, this.dialogService),
        });
      },
    }] as EntityTableAction[];
  }

  showPasswordDialog(vm: VirtualMachineRow, displayDevice: VmDisplayDevice): void {
    const passwordConfiguration: DialogFormConfiguration = {
      title: this.translate.instant('Enter password'),
      message: this.translate.instant('Enter password to unlock this display device'),
      fieldConfig: [{
        type: 'input',
        name: 'password',
        togglePw: true,
        inputType: 'password',
        placeholder: this.translate.instant('Password'),
        validation: [Validators.required],
      }],
      saveButtonText: this.translate.instant('Open'),
      customSubmit: (passDialog: EntityDialogComponent) => {
        this.loader.open();
        this.ws.call(
          'vm.get_display_web_uri',
          [
            vm.id,
            window.location.host,
            {
              protocol: window.location.protocol.replace(':', '').toUpperCase(),
              devices_passwords: [
                {
                  device_id: displayDevice.id,
                  password: passDialog.formValue.password,
                },
              ],
            },
          ],
        ).pipe(untilDestroyed(this)).subscribe({
          next: (webUris) => {
            this.loader.close();
            if (webUris[displayDevice.id].error) {
              passDialog.formGroup.controls['password'].reset();
              return passwordConfiguration.fieldConfig[0].warnings = webUris[displayDevice.id].error;
            }
            passDialog.dialogRef.close();
            window.open(webUris[displayDevice.id].uri, '_blank');
          },
          error: (err) => {
            passDialog.dialogRef.close();
            this.loader.close();
            new EntityUtils().handleError(this, err);
          },
        });
      },
    };
    this.dialogService.dialogForm(passwordConfiguration);
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
      this.availableMemory = this.storageService.convertBytesToHumanReadable(res);
    });
  }

  doAdd(): void {
    this.modalService.openInSlideIn(VmWizardComponent);
  }
}
