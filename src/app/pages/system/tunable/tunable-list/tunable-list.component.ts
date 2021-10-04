import {
  ApplicationRef, Component, Injector,
} from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { ProductType } from 'app/enums/product-type.enum';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'system-tunables-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class TunableListComponent implements EntityTableConfig {
  title: string = T('Tunables');
  title_scale: string = T('Sysctl');
  wsDelete: 'tunable.delete' = 'tunable.delete';
  queryCall: 'tunable.query' = 'tunable.query';

  route_edit: string[] = ['system', 'tunable', 'edit'];
  protected route_success: string[] = ['system', 'tunable'];
  route_add: string[] = ['system', 'tunable', 'add'];
  route_add_tooltip: string = T('Add Tunable');

  protected route_edit_scale: string[] = ['system', 'sysctl', 'edit'];
  protected route_success_scale: string[] = ['system', 'advanced'];
  protected route_add_scale: string[] = ['system', 'sysctl', 'add'];
  protected route_add_tooltip_scale = T('Add Sysctl');

  protected product_type: ProductType;

  protected entityList: EntityTableComponent;

  wsMultiDelete: 'core.bulk' = 'core.bulk';
  multiActions = [
    {
      id: 'mdelete',
      label: T('Delete'),
      icon: 'delete',
      enable: true,
      ttpos: 'above' as TooltipPosition,
      onClick: (selected: any) => {
        this.entityList.doMultiDelete(selected);
      },
    },
  ];

  columns = [
    { name: T('Variable'), prop: 'var', always_display: true },
    { name: T('Value'), prop: 'value' },
    { name: T('Type'), prop: 'type' },
    { name: T('Description'), prop: 'comment' },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  rowIdentifier = 'var';

  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Tunable') as string,
      key_props: ['var'],
    },
    multiSelect: true,
  };

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef) {}

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.product_type = window.localStorage.getItem('product_type') as ProductType;
    if (this.product_type === ProductType.Scale || this.product_type === ProductType.ScaleEnterprise) {
      this.route_add = this.route_add_scale;
      this.route_edit = this.route_edit_scale;
      this.route_success = this.route_success_scale;
      this.route_add_tooltip = this.route_add_tooltip_scale;
      this.config.deleteMsg.title = T('Sysctl');
      this.title = this.title_scale;
    }
  }

  wsMultiDeleteParams(selected: any): any {
    const params: any[] = [this.wsDelete];
    const selectedId = [];
    for (const i in selected) {
      selectedId.push([selected[i].id]);
    }
    params.push(selectedId);
    return params;
  }
}
