import { Component, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import {
  EntityTableComponent,
} from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DeviceFormComponent } from 'app/pages/vm/devices/device-form/device-form.component';
import { DeviceDeleteModalComponent } from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: `
    <ix-entity-table [title]="title" [conf]="this"></ix-entity-table>
  `,
})
export class DeviceListComponent implements EntityTableConfig {
  resourceName: string;
  routeAdd: string[];
  routeEdit: string[];
  protected routeDelete: string[];
  protected pk: string;
  vm: string;
  private entityList: EntityTableComponent;
  queryCall = 'vm.device.query' as const;
  queryCallOption: [[Partial<QueryFilter<VmDevice>>]] = [[['vm', '=']]];
  columns = [
    { name: this.translate.instant('Device ID'), prop: 'id', always_display: true },
    { name: this.translate.instant('Device'), prop: 'dtype' },
    { name: this.translate.instant('Order'), prop: 'order' },
  ];
  rowIdentifier = 'id';
  title: string;
  config = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    public dialogService: DialogService,
    private matDialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  isActionVisible(actionId: string): boolean {
    return actionId !== 'delete';
  }

  getActions(row: VmDevice): EntityTableAction<VmDevice>[] {
    const actions = [];
    actions.push({
      id: row.id,
      name: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (device: VmDevice) => {
        const slideInRef = this.slideInService.open(DeviceFormComponent, {
          data: { virtualMachineId: Number(this.pk), device },
        });
        slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
      },
    });
    actions.push({
      id: row.id,
      name: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (device: VmDevice) => {
        this.deviceDelete(device);
      },
    });
    actions.push({
      id: row.id,
      name: 'details',
      icon: 'list',
      label: this.translate.instant('Details'),
      onClick: (device: VmDevice) => {
        let details = '';
        Object.entries(device.attributes).forEach(([attribute, attributeValue]) => {
          details = `${attribute}: ${attributeValue} \n` + details;
        });
        this.dialogService.info(
          this.translate.instant('Details for <b>{vmDevice}</b>', { vmDevice: `${row.dtype} ${row.id}` }),
          details,
          true,
        );
      },
    });
    return actions as EntityTableAction[];
  }

  deviceDelete(row: VmDevice): void {
    this.matDialog
      .open(
        DeviceDeleteModalComponent,
        {
          disableClose: false,
          width: '400px',
          data: { row },
        },
      )
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(
        () => this.entityList.getData(),
      );
  }

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params.pk as string;
      this.vm = params.name as string;
      this.routeEdit = ['vm', this.pk, 'devices', this.vm, 'edit'];
      this.routeDelete = ['vm', this.pk, 'devices', this.vm, 'delete'];
      // this is filter by vm's id to show devices belonging to that VM
      this.resourceName = 'vm/device/?vm__id=' + this.pk;
      this.title = this.translate.instant('VM {vm} devices', { vm: this.vm });
      this.cdRef.detectChanges();
      this.queryCallOption[0][0].push(parseInt(this.pk, 10));
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(DeviceFormComponent, { data: { virtualMachineId: Number(this.pk) } });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }
}
