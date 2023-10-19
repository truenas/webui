import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, pipe, tap } from 'rxjs';
import { vmDeviceTypeLabels } from 'app/enums/vm.enum';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
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
  dataProvider: AsyncDataProvider<VmDevice>;
  filterString = '';
  devices: VmDevice[] = [];

  columns = createTable<VmDevice>([
    textColumn({
      title: this.translate.instant('Device ID'),
      propertyName: 'id',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Device'),
      propertyName: 'dtype',
      sortable: true,
      getValue: (device) => {
        // TODO: getValue is incorrectly typed
        return this.getDeviceTypeLabel(device) as unknown as VmDevice[keyof VmDevice];
      },
    }),
    textColumn({
      title: this.translate.instant('Order'),
      propertyName: 'order',
      sortable: true,
    }),
    actionsColumn({}),
  ]);

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
    const devices$ = this.ws.call('vm.device.query', [[['vm', '=', this.vmId]]]);
    this.dataProvider = new AsyncDataProvider<VmDevice>(devices$);
    this.setDefaultSort();
    this.loadDevices();
  }

  loadDevices(): void {
    this.dataProvider.load<VmDevice[]>(() => pipe(
      tap((devices) => this.devices = devices),
      untilDestroyed(this),
    ));
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
    this.dataProvider.setRows(this.devices.filter((device) => {
      const deviceTypeLabel = this.getDeviceTypeLabel(device);
      return String(device.id).includes(this.filterString)
        || deviceTypeLabel.toLowerCase().includes(this.filterString);
    }));
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
