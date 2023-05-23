import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class VmwareSnapshotListComponent implements EntityTableConfig {
  title = 'VMware Snapshots';
  queryCall = 'vmware.query' as const;
  routeAddTooltip = this.translate.instant('Add VMware Snapshot');
  protected entityList: EntityTableComponent;
  wsDelete = 'vmware.delete' as const;

  columns = [
    { name: 'Hostname', prop: 'hostname', always_display: true },
    { name: 'Username', prop: 'username' },
    { name: 'filesystem', prop: 'filesystem' },
    { name: 'datastore', prop: 'datastore' },
  ];
  rowIdentifier = 'hostname';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('VMware Snapshot'),
      key_props: ['hostname', 'filesystem'],
    },
  };

  constructor(
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string): boolean {
    if (actionId === 'edit' || actionId === 'add') {
      return false;
    }
    return true;
  }

  doAdd(): void {
    const slideIn = this.slideInService.open(VmwareSnapshotFormComponent);
    slideIn.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  getActions(vmwareSnapshot: VmwareSnapshot): EntityTableAction[] {
    return [
      {
        id: vmwareSnapshot.hostname,
        icon: 'delete',
        name: 'delete',
        label: this.translate.instant('Delete'),
        onClick: (row: VmwareSnapshot) => {
          this.entityList.doDelete(row);
        },
      },
      {
        id: vmwareSnapshot.hostname,
        icon: 'edit',
        name: 'edit',
        label: this.translate.instant('Edit'),
        onClick: (row: VmwareSnapshot) => {
          const slideIn = this.slideInService.open(VmwareSnapshotFormComponent);
          slideIn.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
            this.entityList.getData();
          });
          slideIn.componentInstance.setSnapshotForEdit(row);
        },
      },
    ] as EntityTableAction[];
  }
}
