import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit,
  computed, inject, signal,
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
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { column } from 'app/modules/tn-table/column-configs';
import {
  TableColumnPickerComponent,
} from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import {
  TableDetailsRowComponent,
} from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';
import {
  createTable, dataProviderLoading, dataProviderRows, mapTnSortToTableSort, memoizedRowTag, toDisplayedColumns,
} from 'app/modules/tn-table/utils';
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
    TableDetailsRowComponent,
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

  /**
   * Column model retained purely to drive `<ix-table-column-picker>` (visibility
   * + saved `vmList` prefs) and the hidden-column readout in the expanded detail row.
   * tn-table renders the visible cells from the template and derives its
   * `displayedColumns` from these via `toDisplayedColumns`, so every column carries the
   * `propertyName` that names its `tnColumnDef`.
   *
   * The two toggle columns are declared as text columns here on purpose: the interactive
   * switch is rendered by `<ix-table-toggle-cell>` in the template, so this model only carries
   * the readable Yes/No the detail row shows once the user hides the column. That readout is
   * therefore text where it used to be a live toggle — deliberately, since the detail row
   * already offers Start/Stop/Power Off buttons, so no action is actually lost with the column.
   *
   * Every derived value goes through one of the `*Label()` / `is*()` helpers below, which the
   * template cells call too, so the value a hidden column renders in the detail row can't
   * drift from the one its visible counterpart renders.
   */
  protected readonly columns = signal(createTable<VirtualMachine>([
    column({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    column({
      title: this.translate.instant('Running'),
      propertyName: 'status',
      getValue: (row) => this.yesNo(this.isRunning(row)),
      // The table shows this as an <ix-table-toggle-cell>; a details row prints Yes/No, under the
      // suffix that toggle resolves.
      testIdSuffix: 'row-toggle',
    }),
    column({
      title: this.translate.instant('Start on Boot'),
      propertyName: 'autostart',
      getValue: (row) => this.yesNo(this.isAutostartEnabled(row)),
      // The table shows this as an <ix-table-toggle-cell>; a details row prints Yes/No, under the
      // suffix that toggle resolves.
      testIdSuffix: 'row-toggle',
    }),
    column({
      title: this.translate.instant('Virtual CPUs'),
      propertyName: 'vcpus',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Cores'),
      propertyName: 'cores',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Threads'),
      propertyName: 'threads',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Memory Size'),
      propertyName: 'memory',
      hidden: true,
      getValue: (row) => this.memoryLabel(row),
    }),
    column({
      title: this.translate.instant('Boot Loader Type'),
      propertyName: 'bootloader',
      hidden: true,
    }),
    column({
      title: this.translate.instant('System Clock'),
      propertyName: 'time',
      hidden: true,
      getValue: (row) => this.systemClockLabel(row),
    }),
    column({
      title: this.translate.instant('Display Port'),
      // The cast is nominal: `propertyName` only names the `tnColumnDef`, and `sortAccessors`
      // supplies the actual sort accessor, so the value is never read off the row.
      propertyName: displayPortColumn as keyof VirtualMachine,
      hidden: true,
      getValue: (row) => this.displayPortLabel(row),
    }),
    column({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      hidden: true,
    }),
    column({
      title: this.translate.instant('Shutdown Timeout'),
      propertyName: 'shutdown_timeout',
      hidden: true,
      getValue: (row) => this.shutdownTimeoutLabel(row),
    }),
  ]));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<TableColumn<VirtualMachine>[]>(
    () => this.columns().filter((tableColumn) => tableColumn?.hidden),
  );

  /**
   * Sort accessors for the columns tn-table can't sort by `propertyName` alone —
   * `status` is an object and `display_port` is derived from the VM's devices.
   */
  private readonly sortAccessors: Record<string, (row: VirtualMachine) => string | number> = {
    status: (row) => (row.status.state === VmState.Running ? 1 : 0),
    [displayPortColumn]: (row) => this.getDisplayPortSortValue(row),
  };

  protected readonly trackByVmId = (_index: number, row: VirtualMachine): number => row.id;

  /**
   * Row tag every `[tnTestId]` in the template is keyed on. Memoized because each of the 11
   * columns asks for it on every change-detection pass, and `subscribeToVmEvents` forces one
   * per websocket event.
   */
  protected readonly uniqueRowTag = memoizedRowTag<VirtualMachine>((row) => `virtual-machine-${row.name}`);

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

  /**
   * Single source for every cell value that isn't a bare row property. The template cells and
   * the column model's `getValue` both go through these, so a column reads identically whether
   * it is visible in the table or hidden and rendered by the expanded detail row.
   */
  protected isRunning(row: VirtualMachine): boolean {
    return row.status.state === VmState.Running;
  }

  protected isAutostartEnabled(row: VirtualMachine): boolean {
    return !!row.autostart;
  }

  private yesNo(value: boolean): string {
    return value ? this.translate.instant('Yes') : this.translate.instant('No');
  }

  protected memoryLabel(row: VirtualMachine): string {
    return this.fileSizePipe.transform(row.memory * MiB);
  }

  /**
   * vmTimeNames values are T()-marked, so they need translating. `instant()` throws on an
   * absent *or* empty key, so a VM whose `time` isn't in the map renders an empty cell.
   */
  protected systemClockLabel(row: VirtualMachine): string {
    const label = vmTimeNames.get(row.time);
    return label ? this.translate.instant(label) : '';
  }

  /** Stringified because `getDisplayPort` can return a boolean/number and `tnTooltip` is typed string. */
  protected displayPortLabel(row: VirtualMachine): string {
    return String(this.getDisplayPort(row));
  }

  protected shutdownTimeoutLabel(row: VirtualMachine): string {
    return this.translate.instant(
      '{seconds, plural, =1 {# second} other {# seconds}}',
      { seconds: row.shutdown_timeout },
    );
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

  private getDisplayPort(vm: VirtualMachine): boolean | number | string {
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

  /** Base accessible name identifying a row: "<name> Virtual Machine". */
  private vmAriaLabel(row: VirtualMachine): string {
    return [row.name, this.translate.instant('Virtual Machine')].join(' ');
  }

  /**
   * Accessible name for a row's interactive cells. The column title leads because this table
   * has two toggle columns per row — without it both switches announce identically
   * ("Enable <name> Virtual Machine") and only their position tells them apart.
   */
  protected ariaLabel(row: VirtualMachine, columnTitle: string): string {
    return `${columnTitle} ${this.vmAriaLabel(row)}`;
  }

  protected onColumnsChange(columns: TableColumn<VirtualMachine>[]): void {
    this.columns.set([...columns]);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort(event, this.displayedColumns(), { sortAccessors: this.sortAccessors }),
    );
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
