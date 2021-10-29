import {
  ApplicationRef, Component, Injector,
} from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'system-tunables-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class TunableListComponent implements EntityTableConfig {
  title: string = this.translate.instant('Tunables');
  title_scale: string = this.translate.instant('Sysctl');
  wsDelete = 'tunable.delete' as const;
  queryCall = 'tunable.query' as const;

  route_edit: string[] = ['system', 'tunable', 'edit'];
  protected route_success: string[] = ['system', 'tunable'];
  route_add: string[] = ['system', 'tunable', 'add'];
  route_add_tooltip: string = this.translate.instant('Add Tunable');

  protected route_edit_scale: string[] = ['system', 'sysctl', 'edit'];
  protected route_success_scale: string[] = ['system', 'advanced'];
  protected route_add_scale: string[] = ['system', 'sysctl', 'add'];
  protected route_add_tooltip_scale = this.translate.instant('Add Sysctl');

  protected product_type: ProductType;

  protected entityList: EntityTableComponent;

  wsMultiDelete = 'core.bulk' as const;
  multiActions = [
    {
      id: 'mdelete',
      label: this.translate.instant('Delete'),
      icon: 'delete',
      enable: true,
      ttpos: 'above' as TooltipPosition,
      onClick: (selected: Tunable[]) => {
        this.entityList.doMultiDelete(selected);
      },
    },
  ];

  columns = [
    { name: this.translate.instant('Variable'), prop: 'var', always_display: true },
    { name: this.translate.instant('Value'), prop: 'value' },
    { name: this.translate.instant('Type'), prop: 'type' },
    { name: this.translate.instant('Description'), prop: 'comment' },
    { name: this.translate.instant('Enabled'), prop: 'enabled' },
  ];
  rowIdentifier = 'var';

  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Tunable') as string,
      key_props: ['var'],
    },
    multiSelect: true,
  };

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected translate: TranslateService,
  ) {}

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.product_type = window.localStorage.getItem('product_type') as ProductType;
    if (this.product_type === ProductType.Scale || this.product_type === ProductType.ScaleEnterprise) {
      this.route_add = this.route_add_scale;
      this.route_edit = this.route_edit_scale;
      this.route_success = this.route_success_scale;
      this.route_add_tooltip = this.route_add_tooltip_scale;
      this.config.deleteMsg.title = this.translate.instant('Sysctl');
      this.title = this.title_scale;
    }
  }

  wsMultiDeleteParams(selected: Tunable[]): [string, number[][]?] {
    const params: [string, number[][]?] = [this.wsDelete];
    const selectedId = selected.map((tunable) => [tunable.id]);
    params.push(selectedId);
    return params;
  }
}
