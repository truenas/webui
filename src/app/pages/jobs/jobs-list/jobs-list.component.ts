import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { JobRow } from 'app/pages/jobs/jobs-list/job-row.interface';
import { LocaleService } from 'app/services/locale.service';
import { T } from 'app/translate-marker';
import { EntityTableConfig } from '../../common/entity/entity-table/entity-table.interface';

@UntilDestroy()
@Component({
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  styleUrls: ['./jobs-list.component.scss'],
})
export class JobsListComponent implements EntityTableConfig<JobRow> {
  title = this.translate.instant(T('Job Log'));
  queryCall: 'core.get_jobs' = 'core.get_jobs';
  entityList: EntityTableComponent;

  columns = [
    {
      name: T('Name'),
      prop: 'method',
      always_display: true,
      job: true,
      widget: {
        component: 'JobItemComponent',
        icon: 'assignment',
      },
    },
    { name: T('Logs/Errors'), prop: 'logs_excerpt' },
    { name: T('ID'), prop: 'id', sort: 'desc' },
    { name: T('Started'), prop: 'date_started' },
    { name: T('Finished'), prop: 'date_finished' },
    { name: T('Abortable'), prop: 'abortable' },
    { name: T('State'), prop: 'state' },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Name',
      key_props: ['method'],
    },
  };

  constructor(
    private translate: TranslateService,
    private localeService: LocaleService,
    private store: JobsManagerStore,
  ) {}

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(data: JobRow[]): JobRow[] {
    return data.map((item) => this.transformJob(item));
  }

  transformJob(job: JobRow): JobRow {
    const transformed = { ...job };
    transformed.logs_excerpt = job.logs_excerpt ? 'View Info' : 'None';
    transformed.date_started = job.time_started
      ? this.localeService.formatDateTime(new Date(job.time_started.$date))
      : '–';
    transformed.date_finished = job.time_finished
      ? this.localeService.formatDateTime(new Date(job.time_finished.$date))
      : '–';
    return transformed;
  }

  onAborted(job: JobRow): void {
    this.store.remove(job);
  }
}
