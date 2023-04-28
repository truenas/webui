import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/data-protection/smart/smart';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { TaskService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [TaskService],
})
export class SmartTaskListComponent implements EntityTableConfig {
  title = this.translate.instant('S.M.A.R.T. Tests');
  queryCall = 'smart.test.query' as const;
  routeAdd: string[] = ['tasks', 'smart', 'add'];
  routeAddTooltip = this.translate.instant('Add S.M.A.R.T. Test');
  routeEdit: string[] = ['tasks', 'smart', 'edit'];
  wsDelete = 'smart.test.delete' as const;
  entityList: EntityTableComponent;
  parent: SmartTaskListComponent;

  columns = [
    {
      name: helptext.smartlist_column_disks,
      prop: 'disksLabel',
      always_display: true,
    },
    {
      name: helptext.smartlist_column_type,
      prop: 'type',
      always_display: true,
    },
    { name: helptext.smartlist_column_description, prop: 'desc' },
    { name: helptext.smartlist_column_frequency, prop: 'frequency', enableMatTooltip: true },
    {
      name: helptext.smartlist_column_next_run,
      prop: 'next_run',
    },
  ];
  rowIdentifier = 'type';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('S.M.A.R.T. Test'),
      key_props: ['type', 'desc'],
    },
  };
  listDisks: Disk[] = [];

  constructor(
    protected storageService: StorageService,
    protected slideInService: IxSlideInService,
    protected taskService: TaskService,
    protected translate: TranslateService,
    protected store$: Store<AppState>,
  ) {
    this.storageService.listDisks().pipe(untilDestroyed(this)).subscribe((listDisks) => {
      this.listDisks = listDisks;
    });
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: SmartTestTaskUi[]): SmartTestTaskUi[] {
    return data.map((test) => {
      test.cron_schedule = `0 ${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      test.frequency = this.taskService.getTaskCronDescription(test.cron_schedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        test.next_run = this.taskService.getTaskNextRun(test.cron_schedule, timezone);
      });

      if (test.all_disks) {
        test.disksLabel = [this.translate.instant(helptext.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        const readableDisks = test.disks.map((disk) => {
          return this.listDisks.find((item) => item.identifier === disk).devname;
        });
        test.disksLabel = readableDisks;
      }
      return test;
    });
  }

  doAdd(): void {
    this.slideInService.open(SmartTaskFormComponent);
  }

  getActions(): EntityTableAction<SmartTestTaskUi>[] {
    return [{
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      onClick: (row: SmartTestTaskUi) => {
        const slideIn = this.slideInService.open(SmartTaskFormComponent);
        slideIn.setTestForEdit(row);
      },
    }, {
      id: 'delete',
      icon: 'delete',
      label: 'Delete',
      onClick: (rowinner: SmartTestTaskUi) => {
        this.entityList.doDelete(rowinner);
      },
    }] as EntityTableAction[];
  }
}
