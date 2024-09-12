import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { VmDeviceType, vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import {
  DeviceDeleteModalComponent,
} from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DeviceDetailsComponent } from 'app/pages/vm/devices/device-list/device-details/device-details.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceListComponent implements OnInit {
  protected readonly requiredRoles = [Role.VmDeviceWrite];

  dataProvider: AsyncDataProvider<VmDevice>;
  filterString = '';
  devices: VmDevice[] = [];

  columns = createTable<VmDevice>([
    textColumn({
      title: this.translate.instant('Device ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Device'),
      propertyName: 'dtype',
      getValue: (device) => this.getDeviceTypeLabel(device),
    }),
    textColumn({
      title: this.translate.instant('Order'),
      propertyName: 'order',
    }),
    actionsColumn({}),
  ], {
    uniqueRowTag: (row) => 'vm-device-' + row.dtype + '-' + row.order,
    ariaLabels: (row) => [row.dtype, this.translate.instant('Device')],
  });

  get vmId(): number {
    return Number(this.route.snapshot.params['pk']);
  }

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private matDialog: MatDialog,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const devices$ = this.ws.call('vm.device.query', [[['vm', '=', this.vmId]]]).pipe(
      tap((devices) => this.devices = devices),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<VmDevice>(devices$);
    this.setDefaultSort();
    this.loadDevices();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  loadDevices(): void {
    this.dataProvider.load();
  }

  onAdd(): void {
    this.slideInService.open(DeviceFormComponent, {
      data: {
        virtualMachineId: this.vmId,
      },
    })
      .slideInClosed$.pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.loadDevices();
      });
  }

  onEdit(device: VmDevice): void {
    this.slideInService.open(DeviceFormComponent, {
      data: {
        device,
        virtualMachineId: this.vmId,
      },
    })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.loadDevices();
      });
  }

  onDelete(device: VmDevice): void {
    this.matDialog
      .open(
        DeviceDeleteModalComponent,
        {
          disableClose: false,
          width: '400px',
          data: device,
        },
      )
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(
        () => this.loadDevices(),
      );
  }

  onDetails(device: VmDevice): void {
    this.matDialog.open(DeviceDetailsComponent, {
      data: device,
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
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

  setDefaultSort(): void {
    // TODO: Simplify to not have to specify column index or property?
    this.dataProvider.setSorting({
      active: 2,
      direction: SortDirection.Asc,
      propertyName: 'order',
    });
  }

  private getDeviceTypeLabel(device: VmDevice): string {
    const deviceLabel = vmDeviceTypeLabels.get(device.dtype) ?? device.dtype;
    return this.translate.instant(deviceLabel);
  }
}
