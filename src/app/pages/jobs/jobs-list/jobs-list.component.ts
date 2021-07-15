import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { JobRow } from 'app/pages/jobs/jobs-list/job-row.interface';
import { LocaleService } from 'app/services/locale.service';
import { T } from 'app/translate-marker';
import { ModalService } from '../../../services/modal.service';
import { EntityTableConfig } from '../../common/entity/entity-table/entity-table.interface';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
})
export class JobsListComponent implements OnInit, EntityTableConfig {
  title = this.translate.instant(T('Job Log'));
  queryCall: 'core.get_jobs' = 'core.get_jobs';
  queryCallOption: QueryParams<Job> = [[], { order_by: ['-id'] }];
  entityList: EntityTableComponent;
  selectedIndex = 0;

  columns = [
    { name: T('Name'), prop: 'method', always_display: true },
    { name: T('Logs/Errors'), prop: 'logs_excerpt' },
    { name: T('ID'), prop: 'id' },
    { name: T('Started'), prop: 'date_started' },
    { name: T('Finished'), prop: 'date_finished' },
    { name: T('Abortable'), prop: 'abortable' },
    { name: T('Result'), prop: 'result' },
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
    private modalService: ModalService,
  ) {
    console.info('Job Log init');
  }

  ngOnInit(): void {
    console.info('Job Log ngOnInit');

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTab();
    });
  }

  dataHandler(entityList: EntityTableComponent): void {
    console.info('rows', entityList.rows);
    entityList.rows.forEach((row: JobRow) => {
      row.name = row.description ? row.description : row.method;
      row.logs_excerpt = row.logs_excerpt ? 'View Info' : 'None';
      row.date_started = row.time_started ? this.localeService.formatDateTime(new Date(row.time_started.$date)) : '–';
      row.date_finished = row.time_finished
        ? this.localeService.formatDateTime(new Date(row.time_finished.$date))
        : '–';
      // row.abortable = row.abortable.toString().toUpperCase();
    });
  }

  refreshTab(): void {
    console.info('update');
  }

  refresh(event: MatTabChangeEvent): void {
    this.selectedIndex = event.index;
    this.refreshTab();
  }
}
