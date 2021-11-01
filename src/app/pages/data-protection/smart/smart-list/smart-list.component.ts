import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/data-protection/smart/smart';
import { SmartTestUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { SmartFormComponent } from 'app/pages/data-protection/smart/smart-form/smart-form.component';
import { TaskService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { StorageService } from 'app/services/storage.service';

@UntilDestroy()
@Component({
  selector: 'app-smart-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, EntityFormService],
})
export class SmartListComponent implements EntityTableConfig {
  title = this.translate.instant('S.M.A.R.T. Tests');
  queryCall = 'smart.test.query' as const;
  route_add: string[] = ['tasks', 'smart', 'add'];
  route_add_tooltip = this.translate.instant('Add S.M.A.R.T. Test');
  route_edit: string[] = ['tasks', 'smart', 'edit'];
  wsDelete = 'smart.test.delete' as const;
  entityList: EntityTableComponent;
  parent: SmartListComponent;

  columns = [
    {
      name: helptext.smartlist_column_disks,
      prop: 'disks',
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
    protected modalService: ModalService,
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected entityFormService: EntityFormService,
    protected translate: TranslateService,
  ) {
    this.storageService.listDisks().pipe(untilDestroyed(this)).subscribe((listDisks) => {
      this.listDisks = listDisks;
    });
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  resourceTransformIncomingRestData(data: SmartTestUi[]): SmartTestUi[] {
    return data.map((test) => {
      test.cron_schedule = `0 ${test.schedule.hour} ${test.schedule.dom} ${test.schedule.month} ${test.schedule.dow}`;
      test.next_run = this.taskService.getTaskNextRun(test.cron_schedule);
      test.frequency = this.taskService.getTaskCronDescription(test.cron_schedule);

      if (test.all_disks) {
        test.disks = [this.translate.instant(helptext.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        const readableDisks = test.disks.map((disk) => {
          return this.listDisks.find((item) => item.identifier === disk).devname;
        });
        test.disks = readableDisks;
      }
      return test;
    });
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(SmartFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
