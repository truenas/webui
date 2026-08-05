import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent,
  TnButtonComponent,
  TnCellDefDirective,
  TnDialog,
  TnHeaderCellDefDirective,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VmDeviceType, VmState, vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import {
  dataProviderLoading, dataProviderRows, mapTnSortToTableSort, memoizedRowTag,
} from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import {
  DeviceDeleteModalComponent,
} from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DeviceDetailsComponent } from 'app/pages/vm/devices/device-list/device-details/device-details.component';
import { ExportDiskDialogComponent } from 'app/pages/vm/devices/device-list/export-disk-dialog/export-disk-dialog.component';

@Component({
  selector: 'ix-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnBannerComponent,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTestIdDirective,
    TnIconButtonComponent,
    TnMenuTriggerDirective,
    TnMenuComponent,
    TnMenuItemComponent,
    TnTooltipDirective,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class DeviceListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private tnDialog = inject(TnDialog);
  private route = inject(ActivatedRoute);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.VmDeviceWrite];

  protected readonly searchQuery = signal('');
  private devices: VmDevice[] = [];
  private vmName = '';
  protected readonly isVmRunning = signal(false);

  protected readonly displayedColumns = ['id', 'dtype', 'order', 'actions'];

  private readonly devices$ = this.api.call('vm.device.query', [[['vm', '=', this.vmId]]]).pipe(
    tap((devices) => this.devices = devices),
    takeUntilDestroyed(this.destroyRef),
  );

  readonly dataProvider = new AsyncDataProvider<VmDevice>(this.devices$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(this.dataProvider.emptyType$);

  /**
   * The Export to Image item is disabled while the VM runs, and a disabled item cannot carry
   * its own tooltip (see the template). The reason is stated once above the table instead, and
   * only when it applies to something on screen — a running VM with at least one disk device.
   */
  protected readonly showExportBlockedNotice = computed(() => {
    return this.isVmRunning() && this.rows().some((device) => this.isDiskDevice(device));
  });

  /**
   * `dtype` is a display-only column (the label comes from `getDeviceTypeLabel`, and the
   * raw value lives under `attributes`), so it needs an explicit accessor to sort by what
   * the user actually sees.
   */
  private readonly sortAccessors: Record<string, (row: VmDevice) => string | number> = {
    dtype: (row) => this.getDeviceTypeLabel(row),
  };

  protected readonly trackByDeviceId = (_index: number, row: VmDevice): number => row.id;

  /** Row tag the template's `[tnTestId]`s are keyed on; memoized — every cell asks per pass. */
  protected readonly uniqueRowTag = memoizedRowTag<VmDevice>(
    (row) => `vm-device-${row.attributes.dtype}-${row.order}`,
  );

  private get vmId(): number {
    return Number(this.route.snapshot.params['pk']);
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.loadDevices();
    this.loadVmName();
    this.subscribeToVmUpdates();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  private loadVmName(): void {
    this.api.call('vm.query', [[['id', '=', this.vmId]]]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((vms: VirtualMachine[]) => {
      if (vms.length > 0) {
        this.vmName = vms[0].name;
        this.isVmRunning.set(vms[0].status.state === VmState.Running);
      }
    });
  }

  private subscribeToVmUpdates(): void {
    this.api.subscribe('vm.query').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      if (event.id === this.vmId) {
        this.vmName = event.fields.name;
        this.isVmRunning.set(event.fields.status.state === VmState.Running);
        this.cdr.markForCheck();
      }
    });
  }

  private loadDevices(): void {
    this.dataProvider.load();
  }

  protected onAdd(): void {
    this.formPanel.open(DeviceFormComponent, {
      title: this.translate.instant('Add Device for {vmName}', { vmName: this.vmName }),
      inputs: {
        deviceFormData: {
          virtualMachineId: this.vmId,
          vmName: this.vmName,
        },
      },
    }).onSuccess(() => this.loadDevices(), this.destroyRef);
  }

  protected onEdit(device: VmDevice): void {
    this.formPanel.open(DeviceFormComponent, {
      title: this.translate.instant('Edit Device for {vmName}', { vmName: this.vmName }),
      inputs: {
        deviceFormData: {
          device,
          virtualMachineId: this.vmId,
          vmName: this.vmName,
        },
      },
    }).onSuccess(() => this.loadDevices(), this.destroyRef);
  }

  protected onDelete(device: VmDevice): void {
    this.tnDialog
      .open(
        DeviceDeleteModalComponent,
        {
          disableClose: false,
          width: '400px',
          data: device,
        },
      )
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(
        () => this.loadDevices(),
      );
  }

  protected onDetails(device: VmDevice): void {
    this.tnDialog.open(DeviceDetailsComponent, {
      data: device,
    });
  }

  protected handleExportDisk(device: VmDevice): void {
    if (!this.isVmRunning()) {
      this.onExportDisk(device);
    }
  }

  private onExportDisk(device: VmDevice): void {
    const dialogRef = this.tnDialog.open(ExportDiskDialogComponent, {
      width: '600px',
      data: {
        device,
        vmName: this.vmName || 'VM',
      },
    });

    dialogRef.closed
      .pipe(
        filter((result) => !!result),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result: { request: { source: string; destination: string }; destinationPath: string }) => {
        const jobDialogRef = this.dialogService.jobDialog(
          this.api.job('vm.device.convert', [result.request]),
          {
            title: this.translate.instant('Exporting Disk Image'),
            description: this.translate.instant('Exporting {source} to {destination}', {
              source: result.request.source,
              destination: result.request.destination,
            }),
          },
        );

        jobDialogRef.afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (jobResult) => {
              if (!jobResult?.error) {
                this.snackbar.success(
                  this.translate.instant('Disk image successfully exported to {path}', {
                    path: result.destinationPath,
                  }),
                );
              }
            },
            error: (error: unknown) => {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.dialogService.error({
                title: this.translate.instant('Export Failed'),
                message: errorMessage || this.translate.instant('An error occurred while exporting the disk image'),
              });
            },
          });
      });
  }

  protected isDiskDevice(device: VmDevice): device is VmDevice & { attributes: { dtype: VmDeviceType.Disk } } {
    return device?.attributes?.dtype === VmDeviceType.Disk;
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      list: this.devices,
      query,
      columnKeys: ['id', 'dtype'],
      preprocessMap: {
        dtype: (dtype: VmDeviceType) => this.getDeviceTypeLabel({ dtype } as VmDevice),
      },
    });
    this.cdr.markForCheck();
  }

  private setDefaultSort(): void {
    // TODO: Simplify to not have to specify column index or property?
    this.dataProvider.setSorting({
      active: this.displayedColumns.indexOf('order'),
      direction: SortDirection.Asc,
      propertyName: 'order',
    });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort(event, this.displayedColumns, { sortAccessors: this.sortAccessors }),
    );
  }

  protected getDeviceTypeLabel(device: VmDevice): string {
    if (device.attributes.dtype === VmDeviceType.Display) {
      // For display devices, include the protocol type (SPICE/VNC)
      const displayType = device.attributes.type;
      if (displayType) {
        const baseLabel = vmDeviceTypeLabels.get(device.attributes.dtype) ?? device.attributes.dtype;
        return this.translate.instant(baseLabel) + ` (${displayType})`;
      }
    }

    const deviceLabel = vmDeviceTypeLabels.get(device.attributes.dtype) ?? device.attributes.dtype;
    return this.translate.instant(deviceLabel);
  }
}
