import { Component } from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { TunableFormComponent } from 'app/pages/system/tunable/tunable-form/tunable-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class TunableListComponent implements EntityTableConfig {
  title: string = this.translate.instant('Sysctl');
  wsDelete = 'tunable.delete' as const;
  queryCall = 'tunable.query' as const;
  routeAddTooltip: string = this.translate.instant('Add Sysctl');
  protected routeSuccess: string[] = ['system', 'sysctl'];
  protected productType: ProductType;
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
      title: this.translate.instant('Sysctl'),
      key_props: ['var'],
    },
    multiSelect: true,
  };

  constructor(
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.loaderOpen = true;
      this.entityList.needRefreshTable = true;
      this.entityList.getData();
    });
  }

  wsMultiDeleteParams(selected: Tunable[]): [string, number[][]?] {
    const params: [string, number[][]?] = [this.wsDelete];
    const selectedId = selected.map((tunable) => [tunable.id]);
    params.push(selectedId);
    return params;
  }

  doAdd(): void {
    this.slideInService.open(TunableFormComponent);
  }

  getActions(row: Tunable): EntityTableAction<Tunable>[] {
    return [
      {
        icon: 'edit',
        label: this.translate.instant('Edit'),
        name: 'edit',
        actionName: 'edit',
        onClick: (row: Tunable) => {
          const tunableForm = this.slideInService.open(TunableFormComponent);
          tunableForm.setTunableForEdit(row);
        },
      },
      {
        icon: 'delete',
        name: 'delete',
        actionName: 'delete',
        label: this.translate.instant('Delete'),
        onClick: () => {
          this.entityList.doDelete(row);
        },
      },
    ] as EntityTableAction<Tunable>[];
  }
}
