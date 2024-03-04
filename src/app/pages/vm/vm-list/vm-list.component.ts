import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { Role } from 'app/enums/role.enum';
import {
  VmBootloader, VmDeviceType, VmState, vmTimeNames,
} from 'app/enums/vm.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxFileSizePipe } from 'app/modules/ix-file-size/ix-file-size.pipe';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IxFileSizePipe],
})
export class VmListComponent implements OnInit {
  protected requiredRoles = [Role.VmWrite];

  vmMachines: VirtualMachine[] = [];
  filterString = '';
  dataProvider: AsyncDataProvider<VirtualMachine>;
  protected memWarning = helptextVmWizard.memory_warning;
  protected hasVirtualizationSupport$ = this.vmService.hasVirtualizationSupport$;
  protected availableMemory$ = this.vmService.getAvailableMemory().pipe(toLoadingState());

  vmNotSupportedConfig: EmptyConfig = {
    large: true,
    icon: 'laptop',
    title: this.translate.instant('Virtualization is not supported'),
    button: null,
  };

  columns = createTable<VirtualMachine>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    toggleColumn({
      title: this.translate.instant('Running'),
      sortable: true,
      requiredRoles: this.requiredRoles,
      getValue: (row) => row.status.state === VmState.Running,
      onRowToggle: (row) => this.vmService.toggleVmStatus(row),
    }),
    toggleColumn({
      title: this.translate.instant('Start on Boot'),
      requiredRoles: this.requiredRoles,
      propertyName: 'autostart',
      sortable: true,
      onRowToggle: (row) => this.vmService.toggleVmAutostart(row),
    }),
    textColumn({
      title: this.translate.instant('Virtual CPUs'),
      propertyName: 'vcpus',
      sortable: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Cores'),
      propertyName: 'cores',
      sortable: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Threads'),
      propertyName: 'threads',
      sortable: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Memory Size'),
      hidden: true,
      getValue: (row) => {
        return this.fileSizePipe.transform(row.memory * MiB);
      },
    }),
    textColumn({
      title: this.translate.instant('Boot Loader Type'),
      propertyName: 'bootloader',
      sortable: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('System Clock'),
      propertyName: 'time',
      sortable: true,
      hidden: true,
      getValue: (row) => vmTimeNames.get(row.time),
    }),
    textColumn({
      title: this.translate.instant('Display Port'),
      sortable: true,
      hidden: true,
      getValue: (row) => this.getDisplayPort(row),
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      sortable: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Shutdown Timeout'),
      sortable: true,
      hidden: true,
      getValue: (row) => `${row.shutdown_timeout} seconds`,
    }),
  ], {
    rowTestId: (row) => 'virtual-machine-' + row.name,
  });

  get hiddenColumns(): Column<VirtualMachine, ColumnComponent<VirtualMachine>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  constructor(
    private slideInService: IxSlideInService,
    private systemGeneralService: SystemGeneralService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private vmService: VmService,
    private fileSizePipe: IxFileSizePipe,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.createDataProvider();
    this.listenForVmUpdates();
  }

  createDataProvider(): void {
    // TODO: Refactor VM data provider to use ngrx/store
    const virtualMachines$ = this.ws.call('vm.query').pipe(
      tap((vms) => this.vmMachines = vms),
    );
    this.dataProvider = new AsyncDataProvider(virtualMachines$);
    this.dataProvider.load();
  }

  listenForVmUpdates(): void {
    this.vmService.refreshVmList$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.dataProvider.load();
      });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(VmWizardComponent);
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.vmService.checkMemory();
        this.dataProvider.load();
      });
  }

  getDisplayPort(vm: VirtualMachine): boolean | number | string {
    if (!vm.display_available) {
      return this.translate.instant('N/A');
    }
    const devices = vm.devices;
    if (!devices || devices.length === 0) {
      return false;
    }
    if (this.systemGeneralService.isEnterprise && ([VmBootloader.Grub, VmBootloader.UefiCsm].includes(vm.bootloader))) {
      return false;
    }
    for (const device of devices) {
      if (devices && device.dtype === VmDeviceType.Display) {
        return device.attributes.port;
      }
    }

    return false;
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  protected onListFiltered(query: string): void {
    const filterString = query.toLowerCase();
    this.dataProvider.setRows(this.vmMachines.filter((vm) => {
      return vm.name.includes(filterString);
    }));
  }
}
