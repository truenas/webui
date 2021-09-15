import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { VmDevice } from 'app/interfaces/vm-device.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import {
  EntityTableComponent,
} from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-device-list',
  template: `
    <entity-table [title]="title" [conf]="this"></entity-table>
  `,
})
export class DeviceListComponent implements EntityTableConfig {
  resource_name: string;
  route_add: string[];
  route_edit: string[];
  protected route_delete: string[];
  protected pk: string;
  vm: string;
  private entityList: EntityTableComponent;
  wsDelete: 'datastore.delete' = 'datastore.delete';
  queryCall: 'vm.device.query' = 'vm.device.query';
  queryCallOption: [[Partial<QueryFilter<VmDevice>>]] = [[['vm', '=']]];
  protected loaderOpen = false;
  columns = [
    { name: T('Device ID'), prop: 'id', always_display: true },
    { name: T('Device'), prop: 'dtype' },
    { name: T('Order'), prop: 'order' },
  ];
  rowIdentifier = 'id';
  title = T('VM ');
  config = {
    paging: true,
    sorting: { columns: this.columns },
  };

  globalConfig = {
    id: 'config',
    tooltip: T('Close (return to VM list)'),
    icon: 'highlight_off',
    onClick: () => {
      this.router.navigate(new Array('').concat(['vm']));
    },
  };

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    public dialogService: DialogService,
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  isActionVisible(actionId: string, row: VmDevice): boolean {
    return !(actionId === 'delete' && (row as any).id === true);
  }

  getActions(row: VmDevice): EntityTableAction<VmDevice>[] {
    const self = this;
    const actions = [];
    actions.push({
      id: row.id,
      name: 'edit',
      icon: 'edit',
      label: T('Edit'),
      onClick: (edit_row: VmDevice) => {
        this.router.navigate(new Array('').concat(
          ['vm', this.pk, 'devices', this.vm, 'edit', String(edit_row.id), edit_row.dtype],
        ));
      },
    });
    actions.push({
      id: row.id,
      name: 'delete',
      icon: 'delete',
      label: T('Delete'),
      onClick: (delete_row: VmDevice) => {
        this.deviceDelete(delete_row);
      },
    });
    actions.push({
      id: row.id,
      name: 'reorder',
      icon: 'reorder',
      label: T('Change Device Order'),
      onClick: (row1: VmDevice) => {
        self.translate.get('Change order for ').pipe(untilDestroyed(this)).subscribe((orderMsg) => {
          const conf: DialogFormConfiguration = {
            title: T('Change Device Order'),
            message: orderMsg + `<b>${row1.dtype} ${row1.id}</b>`,
            parent: this,
            fieldConfig: [{
              type: 'input',
              name: 'order',
            },
            ],
            saveButtonText: T('Save'),
            preInit(entityDialog: EntityDialogComponent) {
              _.find(entityDialog.fieldConfig, { name: 'order' })['value'] = row1.order;
            },
            customSubmit(entityDialog: EntityDialogComponent) {
              const value = entityDialog.formValue;
              self.loader.open();
              self.ws.call('vm.device.update', [row1.id, { order: value.order }]).pipe(untilDestroyed(this)).subscribe(() => {
                entityDialog.dialogRef.close(true);
                self.loader.close();
                this.parent.entityList.getData();
              }, () => {
                self.loader.close();
              }, () => {
                entityDialog.dialogRef.close(true);
                self.loader.close();
                this.parent.entityList.getData();
              });
            },
          };
          self.dialogService.dialogForm(conf);
        });
      },
    });
    actions.push({
      id: row.id,
      name: 'details',
      icon: 'list',
      label: T('Details'),
      onClick: (device: VmDevice) => {
        self.translate.get('Change order for ').pipe(untilDestroyed(this)).subscribe((detailMsg) => {
          let details = '';
          Object.entries(device.attributes).forEach(([attribute, attributeValue]) => {
            details = `${attribute}: ${attributeValue} \n` + details;
          });
          this.dialogService.info(detailMsg + `${row.dtype} ${row.id}`, details, '500px', 'info');
        });
      },
    });
    return actions as EntityTableAction[];
  }

  deviceDelete(row: VmDevice): void {
    this.translate.get('Delete').pipe(untilDestroyed(this)).subscribe((msg) => {
      this.dialogService.confirm({
        title: T('Delete'),
        message: `${msg} <b>${row.dtype} ${row.id}</b>`,
        hideCheckBox: true,
        buttonMsg: T('Delete Device'),
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.loader.open();
        this.loaderOpen = true;
        if (this.wsDelete) {
          this.ws.call(this.wsDelete, ['vm.device', row.id]).pipe(untilDestroyed(this)).subscribe(
            () => {
              this.entityList.getData();
              this.loader.close();
            },
            (resinner) => {
              new EntityUtils().handleError(this, resinner);
              this.loader.close();
            },
          );
        }
      });
    });
  }

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
      this.vm = params['name'];
      this.route_add = ['vm', this.pk, 'devices', this.vm, 'add'];
      this.route_edit = ['vm', this.pk, 'devices', this.vm, 'edit'];
      this.route_delete = ['vm', this.pk, 'devices', this.vm, 'delete'];
      // this is filter by vm's id to show devices belonging to that VM
      this.resource_name = 'vm/device/?vm__id=' + this.pk;
      this.title = this.title + this.vm + ' devices';
      this.cdRef.detectChanges();
      this.queryCallOption[0][0].push(parseInt(this.pk, 10));
    });
  }
}
