import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit,
  computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCardComponent,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { take, tap } from 'rxjs';
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
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import {
  TableColumnPickerComponent,
} from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, toDisplayedColumns, toUniqueRowTag,
} from 'app/modules/ix-table/utils';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualMachineDetailsRowComponent } from 'app/pages/vm/vm-list/vm-details-row/vm-details-row.component';
import { vmListElements } from 'app/pages/vm/vm-list.elements';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { VmService } from 'app/services/vm.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

/**
 * tn-table column name for the derived Display Port column. It has no backing
 * VirtualMachine property, so it is named here once and reused by the column model and
 * the sort-accessor map.
 */
const displayPortColumn = 'display_port';

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
    TnIconComponent,
    TnTooltipDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnTestIdDirective,
    TableToggleCellComponent,
    IxTableDetailsRowComponent,
    VirtualMachineDetailsRowComponent,
    TnTablePagerComponent,
    TnCardComponent,
    TnEmptyComponent,
    TranslateModule,
    FileSizePipe,
  ],
})
export class VmListComponent implements OnInit {
  private formPanel = inject(FormSidePanelService);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private vmService = inject(VmService);
  private fileSizePipe = inject(FileSizePipe);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.VmWrite];
  protected readonly searchableElements = vmListElements;
  protected readonly VmState = VmState;
  protected readonly MiB = MiB;
  protected readonly vmTimeNames = vmTimeNames;

  private readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  private vmMachines: VirtualMachine[] = [];
  protected readonly searchQuery = signal('');
  protected memWarning = helptextVmWizard.memory_warning;
  protected readonly hasVirtualizationSupport = toSignal(this.vmService.hasVirtualizationSupport$);
  protected availableMemory$ = this.vmService.getAvailableMemory().pipe(toLoadingState());
  private vmMap = new Map<string | number, VirtualMachine>();

  // TODO: Refactor VM data provider to use ngrx/store
  private readonly virtualMachines$ = this.api.call('vm.query').pipe(
    tap((vms) => {
      this.vmMachines = vms;
      this.vmMap = new Map<number, VirtualMachine>(vms.map((vm) => [vm.id, vm]));
    }),
  );

  readonly dataProvider = new AsyncDataProvider<VirtualMachine>(this.virtualMachines$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);

  private readonly table = viewChild(TnTableComponent<VirtualMachine>);

  /**
   * ix-table column model retained purely to drive `<ix-table-column-picker>` (visibility
   * + saved `vmList` prefs) and the hidden-column readout in the expanded detail row.
   * tn-table renders the visible cells from the template and derives its
   * `displayedColumns` from these via `toDisplayedColumns`, so every column carries the
   * `propertyName` that names its `tnColumnDef`.
   *
   * The two toggle columns are declared as text columns here on purpose: the interactive
   * switch is rendered by `<ix-table-toggle-cell>` in the template, and this model only
   * needs a readable value for the case where the user hides the column and it falls
   * through to the detail row.
   */
  protected readonly columns = signal(createTable<VirtualMachine>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Running'),
      propertyName: 'status',
      getValue: (row) => (row.status.state === VmState.Running
        ? this.translate.instant('Yes')
        : this.translate.instant('No')),
    }),
    textColumn({
      title: this.translate.instant('Start on Boot'),
      propertyName: 'autostart',
      getValue: (row) => (row.autostart ? this.translate.instant('Yes') : this.translate.instant('No')),
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
      propertyName: 'memory',
      hidden: true,
      getValue: (row) => {
        return this.fileSizePipe.transform(row.memory * MiB);
      },
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
      // vmTimeNames values are T()-marked, so they need translating; `?? ''` guards a VM
      // whose `time` is absent, which `translate.instant(undefined)` would throw on.
      getValue: (row) => this.translate.instant(vmTimeNames.get(row.time) ?? ''),
    }),
    textColumn({
      title: this.translate.instant('Display Port'),
      // The cast is nominal: `propertyName` only names the `tnColumnDef`, and `sortByMap`
      // supplies the actual sort accessor, so the value is never read off the row.
      propertyName: displayPortColumn as keyof VirtualMachine,
      hidden: true,
      getValue: (row) => this.getDisplayPort(row),
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Shutdown Timeout'),
      propertyName: 'shutdown_timeout',
      hidden: true,
      getValue: (row) => this.translate.instant('{n} seconds', { n: row.shutdown_timeout }),
    }),
  ], {
    uniqueRowTag: (row) => 'virtual-machine-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Virtual Machine')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<Column<VirtualMachine, ColumnComponent<VirtualMachine>>[]>(
    () => this.columns().filter((column) => column?.hidden),
  );

  /**
   * Sort accessors for the columns tn-table can't sort by `propertyName` alone —
   * `status` is an object and `display_port` is derived from the VM's devices.
   */
  private readonly sortByMap: Record<string, (row: VirtualMachine) => string | number> = {
    status: (row) => (row.status.state === VmState.Running ? 1 : 0),
    [displayPortColumn]: (row) => this.getDisplayPortSortValue(row),
  };

  protected readonly trackByVmId = (_index: number, row: VirtualMachine): number => row.id;

  // TEMP: tn-table allows several rows expanded at once and exposes no single-expand input
  // (0.3.26 has only `expandable` / `isRowExpandable`), so restore the previous ix-table
  // behaviour here: whenever a second row opens, collapse back to just the newly-opened one.
  // Remove once the library grows a single-expand mode — see NAS-141021 library follow-ups.
  private previousExpandedRows = new Set<unknown>();

  constructor() {
    effect(() => {
      const table = this.table();
      if (!table) {
        return;
      }
      const expanded = table.expandedRows();
      if (expanded.size <= 1) {
        this.previousExpandedRows = new Set(expanded);
        return;
      }
      const newest = [...expanded].find((row) => !this.previousExpandedRows.has(row));
      const collapsed = newest ? new Set<unknown>([newest]) : new Set<unknown>();
      this.previousExpandedRows = collapsed;
      table.expandedRows.set(collapsed);
    });
  }

  ngOnInit(): void {
    this.refresh();
    this.subscribeToVmEvents();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  private subscribeToVmEvents(): void {
    this.api.subscribe('vm.query')
      .pipe(takeUntilDestroyed(this.destroyRef))
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

  protected doAdd(): void {
    // Footerless — the wizard's stepper owns its own Back/Save buttons.
    this.formPanel.open(VmWizardComponent, {
      title: this.translate.instant('Create Virtual Machine'),
      wide: true,
      footerless: true,
    }).onSuccess(() => {
      this.vmService.checkMemory();
      this.refresh();
    }, this.destroyRef);
  }

  protected getDisplayPort(vm: VirtualMachine): boolean | number | string {
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

  private getDisplayPortSortValue(vm: VirtualMachine): number {
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

  protected uniqueRowTag(row: VirtualMachine): string {
    return toUniqueRowTag('virtual-machine-' + row.name);
  }

  protected ariaLabel(row: VirtualMachine): string {
    return [row.name, this.translate.instant('Virtual Machine')].join(' ');
  }

  protected onColumnsChange(columns: Column<VirtualMachine, ColumnComponent<VirtualMachine>>[]): void {
    this.columns.set([...columns]);
  }

  protected onRowClick(row: VirtualMachine): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort(event, this.displayedColumns(), this.sortByMap));
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  private refresh(): void {
    this.dataProvider.load();
  }

  protected handleVmStatusToggle(vm: VirtualMachine, checked: boolean, cell: TableToggleCellComponent): void {
    if (vm.status.state === VmState.Running && !checked) {
      // User wants to stop a running VM - show stop dialog
      this.vmService.doStop(vm).pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((confirmed: boolean) => {
        if (!confirmed) {
          // User cancelled - revert toggle state
          cell.revert();
        }
      });
    } else if (vm.status.state !== VmState.Running && checked) {
      // User wants to start a stopped VM - start directly
      this.vmService.doStartResume(vm).pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((success: boolean) => {
        if (!success) {
          // Start failed - revert toggle state
          cell.revert();
        }
      });
    }
  }

  protected handleAutostartToggle(vm: VirtualMachine, cell: TableToggleCellComponent): void {
    this.vmService.toggleVmAutostart(vm).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((success: boolean) => {
      if (!success) {
        // Operation failed - revert toggle state
        cell.revert();
      }
    });
  }
}
