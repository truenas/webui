import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { tunableListElements } from 'app/pages/system/advanced/sysctl/tunable-list/tunable-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './tunable-list.component.html',
  styleUrls: ['./tunable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TunableListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = tunableListElements;

  dataProvider: AsyncDataProvider<Tunable>;
  filterString = '';
  tunables: Tunable[] = [];
  columns = createTable<Tunable>([
    textColumn({
      title: this.translate.instant('Variable'),
      propertyName: 'var',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Value'),
      propertyName: 'value',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'tunable-' + row.var + '-' + row.value,
  });

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
    private chainedSlideIns: IxChainedSlideInService,
  ) {}

  ngOnInit(): void {
    const tunables$ = this.ws.call('tunable.query').pipe(
      tap((tunables) => this.tunables = tunables),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<Tunable>(tunables$);
    this.setDefaultSort();
    this.getTunables();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  getTunables(): void {
    this.dataProvider.load();
  }

  doAdd(): void {
    this.chainedSlideIns.open(TunableFormComponent).pipe(
      filter((response) => !!response.response),
      tap(() => this.getTunables()),
      untilDestroyed(this),
    ).subscribe();
  }

  doEdit(tunable: Tunable): void {
    this.chainedSlideIns.open(TunableFormComponent, false, tunable).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getTunables();
    });
  }

  doDelete(tunable: Tunable): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Delete Sysctl'),
        message: this.translate.instant('Are you sure you want to delete "{name}"?', { name: tunable.var }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        const jobDialogRef = this.matDialog.open(EntityJobComponent, {
          data: {
            title: this.translate.instant('Deleting...'),
          },
        });
        jobDialogRef.componentInstance.setCall('tunable.delete', [tunable.id]);
        jobDialogRef.componentInstance.submit();
        jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.getTunables();
          this.dialogService.closeAllDialogs();
          this.snackbar.success(this.translate.instant('Sysctl "{name}" deleted', { name: tunable.var }));
        });
        jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
          jobDialogRef.close();
          this.dialogService.closeAllDialogs();
          this.dialogService.error(this.errorHandler.parseError(error));
        });
      });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.tunables.filter((tunable) => {
      return tunable.var.split('_').includes(this.filterString)
      || tunable.value.includes(this.filterString)
      || tunable.comment.includes(this.filterString);
    }));
    this.cdr.markForCheck();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'var',
    });
  }
}
