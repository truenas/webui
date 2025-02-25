import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSmart } from 'app/helptext/data-protection/smart/smart';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';

@UntilDestroy()
@Component({
  selector: 'ix-smart-task-card',
  templateUrl: './smart-task-card.component.html',
  styleUrls: ['./smart-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    IxIconComponent,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SmartTaskCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.DiskWrite];

  smartTasks: SmartTestTaskUi[] = [];
  dataProvider: AsyncDataProvider<SmartTestTaskUi>;
  disks: Disk[] = [];

  columns = createTable<SmartTestTaskUi>([
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_disks),
      propertyName: 'disksLabel',
    }),
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_type),
      propertyName: 'type',
    }),
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_description),
      propertyName: 'desc',
    }),
    scheduleColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_frequency),
      getValue: (row) => row.schedule,
    }),
    relativeDateColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_next_run),
      getValue: (row) => this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule)),
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'smart-task-' + row.type + '-' + row.disks.join(','),
    ariaLabels: (row) => [row.type, row.disks.join(','), this.translate.instant('Smart Task')],
  });

  constructor(
    private slideIn: SlideIn,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private dialogService: DialogService,
    private taskService: TaskService,
    private storageService: StorageService,
    protected emptyService: EmptyService,
  ) {
    this.storageService.listDisks().pipe(filter(Boolean), untilDestroyed(this)).subscribe((disks: Disk[]) => {
      this.disks = disks;
    });
  }

  ngOnInit(): void {
    const smartTasks$ = this.api.call('smart.test.query').pipe(
      map((smartTasks: SmartTestTaskUi[]) => this.transformSmartTasks(smartTasks)),
      tap((smartTasks) => this.smartTasks = smartTasks),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<SmartTestTaskUi>(smartTasks$);
    this.getSmartTasks();
  }

  getSmartTasks(): void {
    this.dataProvider.load();
  }

  openForm(row?: SmartTestTaskUi): void {
    this.slideIn.open(SmartTaskFormComponent, { data: row }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getSmartTasks();
    });
  }

  private doDelete(smartTask: SmartTestTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete S.M.A.R.T. Test <b>"{name}"</b>?', {
        name: `${smartTask.type} - ${smartTask.desc}`,
      }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('smart.test.delete', [smartTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSmartTasks();
      },
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  private transformSmartTasks(smartTasks: SmartTestTaskUi[]): SmartTestTaskUi[] {
    return smartTasks.map((test) => {
      if (test.all_disks) {
        test.disksLabel = [this.translate.instant(helptextSmart.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        test.disksLabel = [
          test.disks
            .map((identifier: string) => {
              const fullDisk = this.disks.find((item) => item.identifier === identifier);
              if (fullDisk) {
                return fullDisk.devname;
              }
              return identifier;
            })
            .join(','),
        ];
      }
      return test;
    });
  }
}
