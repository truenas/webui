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
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { vmListElements } from 'app/pages/vm/vm-list/vm-list.elements';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-vm-list',
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileSizePipe],
})
export class VmListComponent implements OnInit {
  protected readonly requiredRoles = [Role.VmWrite];
  protected readonly searchableElements = vmListElements;

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
    }),
    toggleColumn({
      title: this.translate.instant('Running'),
      requiredRoles: this.requiredRoles,
      getValue: (row) => row.status.state === VmState.Running,
      onRowToggle: (row) => this.vmService.toggleVmStatus(row),
    }),
    toggleColumn({
      title: this.translate.instant('Start on Boot'),
      requiredRoles: this.requiredRoles,
      propertyName: 'autostart',
      onRowToggle: (row) => this.vmService.toggleVmAutostart(row),
    }),
    textColumn({
      title: this.translate.instant('Virtual CPUs'),
      propertyName: 'vcpus',
      isExtra: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Cores'),
      propertyName: 'cores',
      isExtra: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Threads'),
      propertyName: 'threads',
      isExtra: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Memory Size'),
      isExtra: true,
      hidden: true,
      getValue: (row) => {
        return this.fileSizePipe.transform(row.memory * MiB);
      },
    }),
    textColumn({
      title: this.translate.instant('Boot Loader Type'),
      propertyName: 'bootloader',
      isExtra: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('System Clock'),
      propertyName: 'time',
      isExtra: true,
      hidden: true,
      getValue: (row) => vmTimeNames.get(row.time),
    }),
    textColumn({
      title: this.translate.instant('Display Port'),
      isExtra: true,
      hidden: true,
      getValue: (row) => this.getDisplayPort(row),
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      isExtra: true,
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Shutdown Timeout'),
      isExtra: true,
      hidden: true,
      getValue: (row) => `${row.shutdown_timeout} seconds`,
    }),
  ], {
    rowTestId: (row) => 'virtual-machine-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Virtual Machine')],
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
    private fileSizePipe: FileSizePipe,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.createDataProvider();
    this.listenForVmUpdates();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  createDataProvider(): void {
    // TODO: Refactor VM data provider to use ngrx/store
    const virtualMachines$ = this.ws.call('vm.query').pipe(
      tap((vms) => this.vmMachines = vms),
    );
    this.dataProvider = new AsyncDataProvider(virtualMachines$);
    this.refresh();
  }

  listenForVmUpdates(): void {
    this.vmService.refreshVmList$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.refresh();
      });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(VmWizardComponent);
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.vmService.checkMemory();
        this.refresh();
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
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
