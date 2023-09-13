import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { VmBootloader, VmDeviceType } from 'app/enums/vm.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/vm/vm-list';
import wizardHelptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import {
  VirtualizationDetails,
  VirtualMachine, VirtualMachineUpdate,
} from 'app/interfaces/virtual-machine.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { StopVmDialogComponent } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { VirtualMachineRow } from 'app/pages/vm/vm-list/virtual-machine-row.interface';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';
import { WebSocketService } from 'app/services/ws.service';

const noMemoryError = 'ENOMEM';

@UntilDestroy()
@Component({
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
  providers: [VmService],
})
export class VmListComponent implements EntityTableConfig<VirtualMachineRow> {
  title = this.translate.instant('Virtual Machines');
  queryCall = 'vm.query' as const;
  wsDelete = 'vm.delete' as const;
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  private productType = this.systemGeneralService.getProductType();
  hasVirtualizationSupport = false;
  disableActionsConfig = true;
  virtualizationDetails: VirtualizationDetails = null;
  canAdd = false;

  entityList: EntityTableComponent<VirtualMachineRow>;
  columns = [
    { name: this.translate.instant('Name'), prop: 'name', always_display: true },
    {
      name: this.translate.instant('State'), prop: 'state', always_display: true, toggle: true,
    },
    {
      name: this.translate.instant('Autostart'), prop: 'autostart', checkbox: true, always_display: true,
    },
    { name: this.translate.instant('Virtual CPUs'), prop: 'vcpus', hidden: true },
    { name: this.translate.instant('Cores'), prop: 'cores', hidden: true },
    { name: this.translate.instant('Threads'), prop: 'threads', hidden: true },
    { name: this.translate.instant('Memory Size'), prop: 'memoryString', hidden: true },
    { name: this.translate.instant('Boot Loader Type'), prop: 'bootloader', hidden: true },
    { name: this.translate.instant('System Clock'), prop: 'time', hidden: true },
    { name: this.translate.instant('Display Port'), prop: 'port', hidden: true },
    { name: this.translate.instant('Description'), prop: 'description', hidden: true },
    { name: this.translate.instant('Shutdown Timeout'), prop: 'shutdownTimeoutString', hidden: true },
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
  } as const;

  availableMemory: string;
  memTitle = wizardHelptext.vm_mem_title;
  memWarning = wizardHelptext.memory_warning;

  constructor(
    private ws: WebSocketService,
    private storageService: StorageService,
    private formatter: IxFormatterService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private router: Router,
    protected dialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private vmService: VmService,
    private translate: TranslateService,
    private systemGeneralService: SystemGeneralService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent<VirtualMachineRow>): void {
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
        (changedRow: VirtualMachineRow) => {
          if (!event.fields) {
            return undefined;
          }

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
        shutdownTimeoutString: `${vm.shutdown_timeout} seconds`,
        memoryString: this.formatter.convertBytesToHumanReadable(vm.memory * 1048576, 2),
      } as VirtualMachineRow;

      if (this.checkDisplay(vm)) {
        transformed.port = this.getDisplayPort(vm);
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

    return false;
  }

  getDisplayPort(vm: VirtualMachine): boolean | number {
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

    return false;
  }

  onSliderChange(row: VirtualMachineRow): void {
    if (row.status.state === ServiceStatus.Running) {
      this.openStopDialog(row);
    } else {
      this.doRowAction(row, this.wsMethods.start);
    }
  }

  onMemoryError(row: VirtualMachineRow): void {
    this.dialogService.confirm({
      title: helptext.memory_dialog.title,
      message: helptext.memory_dialog.message,
      confirmationCheckboxText: helptext.memory_dialog.secondaryCheckboxMessage,
      buttonText: helptext.memory_dialog.buttonMessage,
    })
      .pipe(untilDestroyed(this))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.doRowAction(row, this.wsMethods.start, [row.id, { overcommit: true }]);
      });
  }

  doRowAction<T extends 'vm.start' | 'vm.update' | 'vm.poweroff'>(
    row: VirtualMachineRow,
    method: T,
    params: ApiCallParams<T> = [row.id],
    updateTable = false,
  ): void {
    this.loader.open();
    this.ws.call(method, params).pipe(untilDestroyed(this)).subscribe({
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
      error: (error: WebsocketError) => {
        this.loader.close();
        if (method === this.wsMethods.start && error.errname === noMemoryError) {
          this.onMemoryError(row);
          return;
        }
        if (method === this.wsMethods.update) {
          row.autostart = !row.autostart;
        }
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  updateRows(rows: VirtualMachineRow[]): Promise<VirtualMachineRow[]> {
    return new Promise((resolve, reject) => {
      this.ws.call(this.queryCall).pipe(untilDestroyed(this)).subscribe({
        next: (vms) => {
          rows = this.resourceTransformIncomingRestData(vms);
          resolve(rows);
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          reject(error);
        },
      });
    });
  }

  onCheckboxChange(row: VirtualMachineRow): void {
    this.doRowAction(row, this.wsMethods.update, [row.id, { autostart: row.autostart } as VirtualMachineUpdate]);
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
        this.loader.open();
        this.ws.startJob(this.wsMethods.restart, [vm.id]).pipe(untilDestroyed(this)).subscribe({
          complete: () => {
            this.updateRows([row]).then(() => {
              this.loader.close();
            });
            this.checkMemory();
          },
          error: (error: WebsocketError) => {
            this.loader.close();
            this.dialogService.error(this.errorHandler.parseWsError(error));
          },
        });
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
        this.openStopDialog(vm);
      },
    },
    {
      id: 'EDIT',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (vm: VirtualMachineRow) => {
        const slideInRef = this.slideInService.open(VmEditFormComponent, { data: vm });
        slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
      },
    },
    {
      id: 'DELETE',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (vm: VirtualMachineRow) => {
        this.dialog.open(DeleteVmDialogComponent, {
          data: vm,
        })
          .afterClosed()
          .pipe(untilDestroyed(this))
          .subscribe((wasDeleted: boolean) => {
            if (!wasDeleted) {
              return;
            }

            this.entityList.getData();
          });
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
        this.dialog.open(CloneVmDialogComponent, {
          data: vm,
        })
          .afterClosed()
          .pipe(untilDestroyed(this))
          .subscribe((wasCloned: boolean) => {
            if (!wasCloned) {
              return;
            }

            this.entityList.getData();
          });
      },
    },
    {
      id: 'DISPLAY',
      icon: 'settings_ethernet',
      label: this.translate.instant('Display'),
      onClick: (vm: VirtualMachineRow) => {
        this.loader.open();
        this.ws.call('vm.get_display_devices', [vm.id]).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.vmService.openDisplayWebUri(vm.id);
          },
          error: (error: WebsocketError) => {
            this.loader.close();
            this.dialogService.error(this.errorHandler.parseWsError(error));
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
          error: (error: WebsocketError) => this.dialogService.error(this.errorHandler.parseWsError(error)),
        });
      },
    }] as EntityTableAction[];
  }

  isActionVisible(actionId: string, row: VirtualMachineRow): boolean {
    if (actionId === 'DISPLAY' && (row.status.state !== ServiceStatus.Running || !this.checkDisplay(row))) {
      return false;
    }
    if ((actionId === 'POWER_OFF' || actionId === 'STOP' || actionId === 'RESTART'
            || actionId === 'SERIAL') && row.status.state !== ServiceStatus.Running) {
      return false;
    }
    if (actionId === 'START' && row.status.state === ServiceStatus.Running) {
      return false;
    }
    return true;
  }

  checkMemory(): void {
    this.ws.call('vm.get_available_memory').pipe(untilDestroyed(this)).subscribe((availableMemory) => {
      this.availableMemory = this.formatter.convertBytesToHumanReadable(availableMemory);
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(VmWizardComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  private openStopDialog(vm: VirtualMachineRow): void {
    this.dialog.open(StopVmDialogComponent, {
      data: vm,
    })
      .afterClosed()
      .pipe(
        filter((data: { wasStopped: boolean; forceAfterTimeout: boolean }) => data?.wasStopped),
        untilDestroyed(this),
      )
      .subscribe((data: { forceAfterTimeout: boolean }) => {
        this.stopVm(vm, data.forceAfterTimeout);

        this.updateRows([vm]);
        this.checkMemory();
      });
  }

  stopVm(vm: VirtualMachine, forceAfterTimeout: boolean): void {
    const jobDialogRef = this.dialog.open(
      EntityJobComponent,
      {
        data: {
          title: this.translate.instant('Stopping {rowName}', { rowName: vm.name }),
        },
      },
    );
    jobDialogRef.componentInstance.setCall('vm.stop', [vm.id, {
      force: false,
      force_after_timeout: forceAfterTimeout,
    }]);
    jobDialogRef.componentInstance.submit();
    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      jobDialogRef.close(false);
      this.dialogService.info(
        this.translate.instant('Finished'),
        this.translate.instant(helptext.stop_dialog.successMessage, { vmName: vm.name }),
        true,
      );
    });
  }
}
