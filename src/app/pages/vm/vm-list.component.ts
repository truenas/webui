import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, take, tap } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CollectionChangeType } from 'app/enums/api.enum';
import { Role } from 'app/enums/role.enum';
import {
  VmBootloader, VmDeviceType, VmDisplayType, VmState, vmTimeNames,
} from 'app/enums/vm.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  toggleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualMachineDetailsRowComponent } from 'app/pages/vm/vm-list/vm-details-row/vm-details-row.component';
import { vmListElements } from 'app/pages/vm/vm-list.elements';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { VmService } from 'app/services/vm.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-vm-list',
  templateUrl: './vm-list.component.html',
  styleUrls: ['./vm-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileSizePipe],
  standalone: true,
  imports: [
    PageHeaderComponent,
    WithLoadingStateDirective,
    IxIconComponent,
    MatTooltip,
    BasicSearchComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    IxTableDetailsRowComponent,
    VirtualMachineDetailsRowComponent,
    IxTablePagerComponent,
    MatCard,
    MatCardContent,
    EmptyComponent,
    TranslateModule,
    AsyncPipe,
    FileSizePipe,
  ],
})
export class VmListComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private vmService = inject(VmService);
  private fileSizePipe = inject(FileSizePipe);
  protected emptyService = inject(EmptyService);

  protected readonly requiredRoles = [Role.VmWrite];
  protected readonly searchableElements = vmListElements;

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  vmMachines: VirtualMachine[] = [];
  searchQuery = signal('');
  dataProvider: AsyncDataProvider<VirtualMachine>;
  protected memWarning = helptextVmWizard.memory_warning;
  protected hasVirtualizationSupport$ = this.vmService.hasVirtualizationSupport$;
  protected availableMemory$ = this.vmService.getAvailableMemory().pipe(toLoadingState());
  vmMap = new Map<string | number, VirtualMachine>();

  vmNotSupportedConfig: EmptyConfig = {
    large: true,
    icon: iconMarker('mdi-laptop'),
    title: this.translate.instant('Virtualization is not supported'),
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
      sortBy: (row) => (row.status.state === VmState.Running ? 1 : 0),
      onRowToggle: (row, checked, toggle) => this.handleVmStatusToggle(row, checked, toggle),
    }),
    toggleColumn({
      title: this.translate.instant('Start on Boot'),
      requiredRoles: this.requiredRoles,
      propertyName: 'autostart',
      onRowToggle: (row, checked, toggle) => this.handleAutostartToggle(row, checked, toggle),
    }),
    textColumn({
      title: this.translate.instant('Virtual CPUs'),
      propertyName: 'vcpus',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Cores'),
      propertyName: 'cores',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Threads'),
      propertyName: 'threads',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Memory Size'),
      hidden: true,
      getValue: (row) => {
        return this.fileSizePipe.transform(row.memory * MiB);
      },
      sortBy: (row) => row.memory,
    }),
    textColumn({
      title: this.translate.instant('Boot Loader Type'),
      propertyName: 'bootloader',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('System Clock'),
      propertyName: 'time',
      hidden: true,
      getValue: (row) => vmTimeNames.get(row.time),
    }),
    textColumn({
      title: this.translate.instant('Display Port'),
      hidden: true,
      getValue: (row) => this.getDisplayPort(row),
      sortBy: (row) => this.getDisplayPortSortValue(row),
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Shutdown Timeout'),
      hidden: true,
      getValue: (row) => `${row.shutdown_timeout} seconds`,
      sortBy: (row) => row.shutdown_timeout,
    }),
  ], {
    uniqueRowTag: (row) => 'virtual-machine-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Virtual Machine')],
  });

  get hiddenColumns(): Column<VirtualMachine, ColumnComponent<VirtualMachine>>[] {
    return this.columns.filter((column) => column?.hidden);
  }

  ngOnInit(): void {
    this.createDataProvider();
    this.subscribeToVmEvents();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  createDataProvider(): void {
    // TODO: Refactor VM data provider to use ngrx/store
    const virtualMachines$ = this.api.call('vm.query').pipe(
      tap((vms) => {
        this.vmMachines = vms;

        this.vmMap = new Map<number, VirtualMachine>(
          vms.map((vm) => [vm.id, vm]),
        );
      }),
    );
    this.dataProvider = new AsyncDataProvider(virtualMachines$);
    this.refresh();
  }

  subscribeToVmEvents(): void {
    this.api.subscribe('vm.query')
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        const updatedVm = event.fields;
        const vmId = updatedVm?.id || event.id;

        if (!vmId) return;

        switch (event.msg) {
          case CollectionChangeType.Added:
          case CollectionChangeType.Changed: {
            const existingVm = this.vmMap.get(vmId);
            if (existingVm) {
              // Preserve critical properties like devices if they're not in the update
              const mergedVm = { ...existingVm, ...updatedVm };
              if (!updatedVm.devices && existingVm.devices) {
                mergedVm.devices = existingVm.devices;
              }
              this.vmMap.set(vmId, mergedVm);
            } else {
              this.vmMap.set(vmId, updatedVm);
            }
            break;
          }

          case CollectionChangeType.Removed:
            this.vmMap.delete(vmId);
            break;
        }

        this.vmMachines = Array.from(this.vmMap.values());
        this.dataProvider.setRows(this.vmMachines);
        this.cdr.detectChanges();
      });
  }

  doAdd(): void {
    this.slideIn.open(VmWizardComponent)
      .pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      ).subscribe(() => {
        this.vmService.checkMemory();
        this.refresh();
      });
  }

  getDisplayPort(vm: VirtualMachine): boolean | number | string {
    if (!vm.display_available) {
      return this.translate.instant('N/A');
    }
    const devices = vm.devices as VmDisplayDevice[];
    if (!devices || devices.length === 0) {
      return false;
    }
    if (this.isEnterprise() && vm.bootloader === VmBootloader.UefiCsm) {
      return false;
    }

    const displayDevices = devices.filter((device) => device.attributes.dtype === VmDeviceType.Display);
    if (displayDevices.length === 0) {
      return false;
    }

    // Show ports for all display devices (SPICE and VNC)
    const ports = displayDevices.map((device) => {
      const type = device.attributes.type === VmDisplayType.Spice ? 'SPICE' : 'VNC';
      return `${type}:${device.attributes.port}`;
    });

    return ports.join(', ');
  }

  getDisplayPortSortValue(vm: VirtualMachine): number {
    if (!vm.display_available) {
      return Number.MAX_SAFE_INTEGER; // N/A items should sort to the end
    }
    const devices = vm.devices as VmDisplayDevice[];
    if (!devices || devices.length === 0) {
      return Number.MAX_SAFE_INTEGER - 1; // No devices should sort near the end
    }
    if (this.isEnterprise() && vm.bootloader === VmBootloader.UefiCsm) {
      return Number.MAX_SAFE_INTEGER - 2; // Enterprise limitations should sort near the end
    }

    const displayDevices = devices.filter((device) => device.attributes.dtype === VmDeviceType.Display);
    if (displayDevices.length === 0) {
      return Number.MAX_SAFE_INTEGER - 3; // No display devices should sort near the end
    }

    // Sort by the lowest port number if multiple display devices exist
    const ports = displayDevices.map((device) => device.attributes.port);
    return Math.min(...ports);
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  private handleVmStatusToggle(vm: VirtualMachine, checked: boolean, toggle: { toggle(): void }): void {
    if (vm.status.state === VmState.Running && !checked) {
      // User wants to stop a running VM - show stop dialog
      this.vmService.doStop(vm).pipe(
        take(1),
        untilDestroyed(this),
      ).subscribe((confirmed: boolean) => {
        if (!confirmed) {
          // User cancelled - revert toggle state
          setTimeout(() => toggle.toggle(), 0);
        }
      });
    } else if (vm.status.state !== VmState.Running && checked) {
      // User wants to start a stopped VM - start directly
      this.vmService.doStart(vm).pipe(
        take(1),
        untilDestroyed(this),
      ).subscribe((success: boolean) => {
        if (!success) {
          // Start failed - revert toggle state
          setTimeout(() => toggle.toggle(), 0);
        }
      });
    }
  }

  private handleAutostartToggle(vm: VirtualMachine, _checked: boolean, toggle: { toggle(): void }): void {
    this.vmService.toggleVmAutostart(vm).pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((success: boolean) => {
      if (!success) {
        // Operation failed - revert toggle state
        setTimeout(() => toggle.toggle(), 0);
      }
    });
  }
}
